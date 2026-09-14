"use client";

import { memo, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, AlertTriangle } from "lucide-react";
import SharePromptMenu from "./SharePromptMenu";
import PromptVariablesRail from "./PromptVariablesRail";
import { getToolBrand } from "@/lib/tool-brand";
import { extractVariables, fillBody, renderPromptBody } from "./promptVariables";
import { GENERATOR_URL, openInTool, extractContextValues } from "./promptTerminalActions";
import { getStoredPcpToken, clearStoredPcpToken, buildAuthorizeUrl } from "@/lib/pcp-auth";
import type { PromptTool } from "@/lib/api";
import styles from "./PromptTerminal.module.css";

/**
 * PromptTerminal — the prompt block (Figma x-gop-design-system 1266:4591).
 *
 *   ┌─ block #1b1a1a r24 ─ gold top glow (no starfield — 1552:4643) ───┐
 *   │ ( >- Title ………………………………………… [Open in X] [Copy] )  ← glass pill   │
 *   │ ┌─ prompt panel (white/2%) ──────────────┐ ┌─ variables rail ──┐ │
 *   │ │ #CONTEXT:                    ┌────────┐│ │ ⚙ Fill in the     │ │
 *   │ │ mono 14/24, [gold pills]     │ image  ││ │   variables       │ │
 *   │ │ … (fixed height, scrolls) ▐  └────────┘│ │ [field][field]…   │ │
 *   │ └────────────────────────────────────────┘ │ ▸ Context Inject  │ │
 *   │                                            └───────────────────┘ │
 *   └────────────────────────────────────────────────────────────────--┘
 *
 * Client island: owns copy state and the variable map. The body panel is
 * a fixed-height scroll area (no expand/collapse); focusing or typing a
 * variable in the rail auto-scrolls the panel to that token's pill.
 * The body text + every variable field is in the SSR HTML (crawlable).
 */

type Props = {
  body: string | null;
  tools: PromptTool[];
  title: string;
  heroImage: string | null;
  /** True when the white taxonomy strip is attached below (Figma 1578:7096):
   *  squares the bottom corners so panel + strip read as one card. */
  attached?: boolean;
};

type CopyState = "idle" | "copied" | "failed";

export default function PromptTerminal({ body, tools, title, heroImage, attached = false }: Props) {
  // "Open in" is for tools you can actually paste a prompt INTO — the chat
  // LLMs. A prompt's recommended tools can include project/automation SaaS
  // (Notion, Asana, n8n) and generators, which are not paste targets, so they
  // were offering an "Open in Notion" button that makes no sense.
  //
  // Gated on the backend's own tool `type`, not a hardcoded brand list, so it
  // tracks the catalogue: type "llm" is currently chatgpt, claude, deepseek,
  // gemini, grok, mistral. If a prompt has no LLM attached (an image prompt,
  // say) we fall back to its own tools rather than showing nothing.
  const llmTools = (tools ?? []).filter((t) => t.type === "llm");
  const openInTools = llmTools.length > 0 ? llmTools : (tools ?? []);
  const [heroFailed, setHeroFailed] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [injecting, setInjecting] = useState(false);
  // Screen-reader announcements (copy result, open-in feedback).
  const [announce, setAnnounce] = useState("");
  const showHero = !!heroImage && !heroFailed;

  // ── Variable state — values flow into the body render, copy, and
  // "Open in X". Same engine as before (promptVariables).
  const variables = useMemo(() => extractVariables(body), [body]);
  const [values, setValues] = useState<Record<string, string>>({});
  const filledBody = useMemo(() => fillBody(body, values), [body, values]);
  // Memoised so unrelated re-renders (copy state, announcements, collapse
  // toggles) don't rebuild the whole highlighted <pre> tree, only edits do.
  const bodyNodes = useMemo(() => renderPromptBody(body, values), [body, values]);
  const filledCount = variables.filter((v) => values[v.key]?.trim()).length;

  const setVar = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // ── Scroll-to-variable — focusing or typing a rail field brings that
  // token's pill into view inside the fixed-height body panel. Manual
  // container math (not scrollIntoView) so the PAGE never scrolls while
  // the user is typing. No-ops while the pill is already visible.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const scrollToVar = (key: string) => {
    const clip = bodyRef.current;
    if (!clip) return;
    const pill = clip.querySelector<HTMLElement>(`[data-var-key="${CSS.escape(key)}"]`);
    if (!pill) return;
    const cr = clip.getBoundingClientRect();
    const pr = pill.getBoundingClientRect();
    if (pr.top >= cr.top + 8 && pr.bottom <= cr.bottom - 8) return;
    clip.scrollTo({
      top: pr.top - cr.top + clip.scrollTop - (clip.clientHeight - pr.height) / 2,
      behavior: "smooth",
    });
  };

  const onCopy = async () => {
    if (!filledBody) return;
    let ok = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(filledBody);
        ok = true;
      } catch { /* ignore — fall through to failed state */ }
    }
    setCopyState(ok ? "copied" : "failed");
    setAnnounce(ok ? "Prompt copied to clipboard" : "Copy failed");
    setTimeout(() => setCopyState("idle"), 1800);
  };

  const onOpenIn = (tool: PromptTool) => {
    const name = tool.webName ?? tool.name;
    setAnnounce(`Prompt copied. Opening ${name} in a new tab`);
    openInTool(tool, filledBody);
  };

  // Context Inject — ask Prompt Copilot for the user's saved context for
  // this prompt's variables and fill the rail with it. No PCP session yet?
  // Send the user through the cross-domain SSO handoff (lib/pcp-auth) to
  // get one, then come straight back here. Once there's a token, the call
  // goes through the same-origin proxy (/api/pcp/get-context, POST
  // {prompt_body, variables}) — PCP's API needs a Bearer token and isn't
  // CORS-open for this origin. If PCP is unreachable, fall back to copying
  // the prompt and opening the generator.
  const onContextInject = async () => {
    if (!body || injecting) return;

    const token = getStoredPcpToken();
    if (!token) {
      window.location.href = buildAuthorizeUrl(window.location.pathname + window.location.search);
      return;
    }

    const keys = variables.map((v) => v.key);
    setInjecting(true);
    setAnnounce("Loading your Prompt Copilot context");
    try {
      const res = await fetch("/api/pcp/get-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt_body: body, variables: keys }),
      });

      if (res.status === 401) {
        clearStoredPcpToken();
        window.location.href = buildAuthorizeUrl(window.location.pathname + window.location.search);
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(`pcp ${res.status}`);

      const filled = extractContextValues(data, keys);
      const n = Object.keys(filled).length;
      if (n > 0) {
        setValues((prev) => ({ ...prev, ...filled }));
        setAnnounce(`Filled ${n} ${n === 1 ? "variable" : "variables"} from your Prompt Copilot context`);
      } else {
        setAnnounce("No saved context found for this prompt yet");
      }
    } catch {
      if (filledBody && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(filledBody).catch(() => {});
      }
      setAnnounce("Prompt Copilot unavailable. Prompt copied. Opening it in a new tab");
      window.open(GENERATOR_URL, "_blank", "noopener,noreferrer");
    } finally {
      setInjecting(false);
    }
  };

  if (!body && !showHero) return null;

  return (
    <section className={attached ? `${styles.block} ${styles.attached}` : styles.block}>
      {/* Decorations clipped to the rounded corners in their own layer so
          the block itself can stay overflow:visible (sticky rail).
          (Starfield removed — the updated node 1552:4643 is a clean
          gradient surface; only the gold top glow remains.) */}
      <div className={styles.decoClip}>
        <span className={styles.topGlow} aria-hidden />
      </div>

      {/* Copy / open-in feedback for screen readers */}
      <span role="status" aria-live="polite" className="sr-only">{announce}</span>

      <div className="relative z-[1] flex flex-col gap-4 p-6 max-[640px]:p-3">
        {/* ── Header pill ───────────────────────────────────────── */}
        <header className={`${styles.headerPill} flex min-h-[44px] items-center justify-between gap-3 py-1.5 pl-6 pr-2 max-[640px]:pl-4`}>
          <div className="flex min-w-0 items-center gap-4">
            <TerminalGlyph />
            <p className="m-0 truncate font-sans text-[14px] leading-5 text-white">{title}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {openInTools.map((tool) => {
              const name = tool.webName ?? tool.name;
              const label = `Open in ${name} (opens in a new tab; the prompt is copied for you)`;
              const BrandIcon = getToolBrand(name).Icon;
              return (
                <button
                  key={String(tool.id)}
                  type="button"
                  title={`Open in ${name}`}
                  aria-label={label}
                  onClick={() => onOpenIn(tool)}
                  className={styles.actionPill}
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center justify-self-center">
                    <BrandIcon size={16} />
                  </span>
                  <span className={styles.actionLabel}>Open in {name}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={styles.actionPill}
              data-state={copyState}
              onClick={onCopy}
              aria-label={copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy prompt"}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center justify-self-center">
                {copyState === "copied" ? <Check size={16} strokeWidth={2} />
                  : copyState === "failed" ? <AlertTriangle size={16} strokeWidth={2} />
                  : <Copy size={16} strokeWidth={2} />}
              </span>
              <span className={styles.actionLabel}>
                {copyState === "copied" ? "Copied!"
                  : copyState === "failed" ? "Couldn't copy"
                  : "Copy"}
              </span>
            </button>
            <SharePromptMenu title={title} />
          </div>
        </header>

        {/* ── Panels row ────────────────────────────────────────── *
         * items-start (not stretch) lets the rail be shorter than a tall
         * expanded prompt — required for the rail's sticky behaviour. */}
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4 max-[960px]:grid-cols-1">
          {/* Prompt panel — fixed height, scrolls (no expand/collapse) */}
          <div className={`${styles.panel} @container relative overflow-hidden`}>
            <div ref={bodyRef} className={styles.bodyClip}>
              {/* Container query (panel-relative, not viewport): the hero stacks
                  below the prompt text whenever the panel itself gets narrow,
                  so the mono <pre> never gets squeezed beside a 248px image
                  while the variables rail is still alongside on desktop. */}
              <div className="flex items-start gap-6 p-6 @max-[720px]:flex-col-reverse">
                <pre className="m-0 min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words bg-transparent font-mono text-[14px] leading-6 text-white">
                  <code>{bodyNodes}</code>
                </pre>
                {/* Example output — only renders for real generated assets
                  * (heroImage is host-filtered in the data layer; prompts
                  * without one get the full-width-text variant, 1282:3164) */}
                {showHero && heroImage && (
                  <figure className="relative m-0 h-[248px] w-[248px] flex-shrink-0 overflow-hidden rounded-gop-lg border border-white/16 @max-[720px]:w-full @max-[720px]:max-w-[330px]">
                    <Image
                      src={heroImage}
                      alt={`Example output for ${title}`}
                      fill
                      priority
                      sizes="(max-width: 768px) 330px, 248px"
                      className="object-cover"
                      onError={() => setHeroFailed(true)}
                    />
                  </figure>
                )}
              </div>
            </div>
          </div>

          {/* Variables rail — FIXED height matching the body panel's 413px
              cap, so growing textareas scroll inside the field list instead
              of resizing the whole block (no layout jump while typing). The
              parent owns the state + scroll-to-variable; the rail is
              presentational (see PromptVariablesRail). */}
          <PromptVariablesRail
            variables={variables}
            values={values}
            filledCount={filledCount}
            injecting={injecting}
            onVarChange={(key, val) => { setVar(key, val); scrollToVar(key); }}
            onVarFocus={scrollToVar}
            onReset={() => { setValues({}); setAnnounce("Variables reset"); }}
            onContextInject={onContextInject}
          />
        </div>
      </div>
    </section>
  );
}

/* ── ">-" terminal glyph — Figma Logo 541:4914 (gold gradient) ─────── */
const TerminalGlyph = memo(function TerminalGlyph() {
  const uid = useId();
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="flex-shrink-0">
      <g clipPath={`url(#${uid}-clip)`}>
        <path
          d="M10.6085 12L0.589159 18L-1 15.4079L4.69076 11.9999L-1 8.59202L0.589159 6L10.6085 12ZM25 10.0701V13.1009H14.5131V10.0701H25Z"
          fill={`url(#${uid}-grad)`}
        />
      </g>
      <defs>
        <linearGradient id={`${uid}-grad`} x1="12" y1="18" x2="12" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0.5" stopColor="#FDC302" />
          <stop offset="1" stopColor="#ECDF5F" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
});

