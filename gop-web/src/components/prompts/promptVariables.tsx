import { Fragment, type ReactNode } from "react";

/**
 * Prompt variable engine.
 *
 * Prompts ship with placeholder tokens the user fills in:
 *   {{project-type}}              double-brace (preferred, modern prompts)
 *   {variable}                    single-brace
 *   [INSERT YOUR PRODUCT HERE]    square-bracket (legacy / "insert" style)
 *
 * This module:
 *   1. extractVariables(body)  → de-duped list of fillable variables
 *   2. fillBody(body, values)  → body with filled values substituted in,
 *                                empty ones left as their original token
 *   3. renderPromptBody(body, values) → ReactNode for the <pre>, with
 *                                empty placeholders shown as gold pills and
 *                                filled values shown highlighted
 *
 * The same token can appear many times; the user fills it once and every
 * occurrence updates.
 */

export type PromptVariable = {
  key: string;        // slug — dedup + state key
  raw: string;        // exact token text, e.g. "{{project-type}}"
  label: string;      // human label, e.g. "Project type"
  multiline: boolean; // long / "insert"-style → render a textarea
};

// Double-brace wins over single-brace (listed first in the alternation).
const TOKEN_RE = /(\{\{[^}\n]+\}\}|\[[^\]\n]{1,90}\]|\{[^}\n]+\})/g;
// Non-global clone for single-string tests (no lastIndex statefulness).
const TOKEN_TEST_RE = new RegExp(`^${TOKEN_RE.source}$`);

/** Shared gate: tokens that get a fill-in field. Single-character keys
 *  like `{{n}}` / `[1]` are AI-output counters, not user inputs — they
 *  must neither get a field NOR render as a fillable-looking pill. */
function isFillable(raw: string): boolean {
  return keyOf(innerOf(raw)).length >= 2;
}

/** Strip the surrounding braces/brackets and return the inner text. */
function innerOf(raw: string): string {
  return raw
    .replace(/^\{\{|\}\}$/g, "")
    .replace(/^[[{]|[\]}]$/g, "")
    .trim();
}

/** Slug used to dedupe + key the value map. */
function keyOf(inner: string): string {
  return inner
    .toLowerCase()
    .replace(/^insert\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Human-readable field label from the inner token text. */
function labelOf(inner: string): string {
  let s = inner.replace(/^insert\s+/i, "").replace(/[-_]+/g, " ").trim();
  // ALL-CAPS "insert" style → sentence case; otherwise capitalise first.
  if (s === s.toUpperCase()) s = s.charAt(0) + s.slice(1).toLowerCase();
  else s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

export function extractVariables(body: string | null | undefined): PromptVariable[] {
  if (!body) return [];
  const seen = new Set<string>();
  const out: PromptVariable[] = [];
  for (const match of body.matchAll(TOKEN_RE)) {
    const raw = match[0];
    if (!isFillable(raw)) continue;
    const inner = innerOf(raw);
    const key = keyOf(inner);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      raw,
      label: labelOf(inner),
      multiline: inner.length > 24 || /insert/i.test(inner),
    });
  }
  return out;
}

/** Body with every filled variable substituted in. Empty values keep the
 *  original token so the prompt still reads as a template. */
export function fillBody(
  body: string | null | undefined,
  values: Record<string, string>,
): string {
  if (!body) return "";
  return body.replace(TOKEN_RE, (raw) => {
    if (!isFillable(raw)) return raw;
    const key = keyOf(innerOf(raw));
    const v = values[key];
    return v && v.trim() ? v : raw;
  });
}

/* ── Inline render for the <pre> ──────────────────────────────────── */

const EMPTY_PILL =
  "inline-block px-1 rounded-[5px] " +
  "bg-[linear-gradient(to_bottom,rgba(252,217,74,0.12),rgba(252,217,74,0.09))] " +
  "border border-[rgba(252,217,74,0.1)] " +
  "text-gop-accent-yellow font-mono text-[13px] leading-[22px] tracking-[-0.5px] align-baseline";

// Filled value — same pale chassis as the empty pill (the design keeps
// yellow at ~12% alpha everywhere; a solid gold block read far too loud),
// just a touch stronger + white text so the typed value reads as content.
const FILLED_PILL =
  "inline-block px-1 rounded-[5px] " +
  "bg-[linear-gradient(to_bottom,rgba(252,217,74,0.18),rgba(252,217,74,0.13))] " +
  "border border-[rgba(252,217,74,0.22)] " +
  "text-white/95 font-mono text-[13px] leading-[22px] tracking-[-0.5px] align-baseline";

export function renderPromptBody(
  body: string | null | undefined,
  values: Record<string, string>,
): ReactNode {
  if (!body) return null;
  const parts = body.split(TOKEN_RE);
  return (
    <>
      {parts.map((part, i) => {
        // Pill only the tokens that actually have a fill-in field — the
        // gold pill is a promise of interactivity.
        if (!TOKEN_TEST_RE.test(part) || !isFillable(part)) {
          return <Fragment key={i}>{part}</Fragment>;
        }
        const key = keyOf(innerOf(part));
        const value = values[key];
        // data-var-key: the terminal's scroll-to-variable hook — focusing a
        // rail field scrolls the body panel to the first pill with its key.
        return value && value.trim() ? (
          <span key={i} data-var-key={key} className={FILLED_PILL}>{value}</span>
        ) : (
          <span key={i} data-var-key={key} className={EMPTY_PILL}>{part}</span>
        );
      })}
    </>
  );
}
