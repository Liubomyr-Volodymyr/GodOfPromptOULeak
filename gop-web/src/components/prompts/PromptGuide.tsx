import { ClipboardCheck, Braces, Lightbulb, SquareTerminal, HelpCircle } from "lucide-react";
import type { Prompt } from "@/lib/api";

/**
 * PromptGuide — the structured "Prompt Guide" section (Figma 1394:8394).
 * Heading on the page background, then white r24 cards (#E5E7EB edge,
 * 32px padding):
 *
 *   Prompt Guide
 *   ┌ What this prompt does ────────────┐ ┌ Tips for this prompt ──┐
 *   │ ▣ subtitle                        │ │ ▣ (title)              │
 *   │ ───────────────────────────────── │ │ ────────────────────── │
 *   │ {/} item   {/} item   {/} item    │ │ >_ Title / desc  (×3)  │
 *   └───────────────────────────────────┘ └────────────────────────┘
 *   ┌ How to use the prompt ── ① title/desc ② title/desc ③ … ─────┐
 *
 * The backend returns whatThisPromptDoes / tips / howToUse as "●" bullet
 * strings; titles for tips + steps are derived heuristically (splitItem) —
 * these are the fields that want a real {title, description} shape from
 * the backend.
 */

/** Split a "● a\n\n● b\n\n● c" field into clean items. */
function bullets(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n|●|•/)
    .map((s) => s.replace(/^[\s●•\-*]+/, "").trim())
    .filter(Boolean);
}

/** Derive a short title + description from a long sentence. Heuristic:
 *  cut at the first comma/colon/dash; title = the lead clause, desc = rest.
 *  Falls back to the first ~5 words. (Imperfect — backend-structured items
 *  would replace this.) */
function splitItem(s: string): { title: string; desc: string } {
  const m = s.match(/^(.{6,42}?)\s*[,:—–-]\s+(.+)$/);
  if (m) return { title: cap(m[1]), desc: m[2] };
  const w = s.split(/\s+/);
  if (w.length <= 6) return { title: cap(s.replace(/[.。]\s*$/, "")), desc: "" };
  return { title: cap(w.slice(0, 5).join(" ")), desc: w.slice(5).join(" ") };
}

/** Strip a leading "Step 1:" / "1." marker from a how-to step. */
function stripStepMarker(s: string): string {
  return s.replace(/^\s*(?:step\s*)?\d+\s*[:.)-]\s*/i, "").trim();
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function PromptGuide({ prompt }: { prompt: Prompt }) {
  const does = bullets(prompt.whatThisPromptDoes).slice(0, 3);
  const tips = bullets(prompt.tips).slice(0, 3).map(splitItem);
  const steps = bullets(prompt.howToUse).map(stripStepMarker).slice(0, 3).map(splitItem);

  // Nothing to show → don't render the guide at all.
  if (does.length === 0 && tips.length === 0 && steps.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 font-sans text-gop-subtitle text-gop-ink">Prompt Guide</h2>

      {/* Row 1: What (678) + Tips (506) — Figma gap 16 */}
      <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-4 max-[900px]:grid-cols-1">
        {does.length > 0 && <WhatCard items={does} />}
        {tips.length > 0 && <TipsCard tips={tips} />}
      </div>

      {/* Row 2: How to use (full width) */}
      {steps.length > 0 && <UsageCard steps={steps} />}
    </section>
  );
}

/* ── "What this prompt does" (Figma 1394:8481) ───────────────────────── */
function WhatCard({ items }: { items: string[] }) {
  return (
    <Card>
      <CardHeader
        icon={<ClipboardCheck size={20} strokeWidth={1.8} />}
        title="What this prompt does"
        titleSize={18}
        subtitle="Here's exactly what you get when you run it."
      />
      <Divider />
      <div className="grid grid-cols-3 gap-6 max-[640px]:grid-cols-1">
        {items.map((d, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Braces size={24} strokeWidth={1.5} className="text-gop-dark" aria-hidden />
            <p className="m-0 font-sans text-[13px] leading-4 text-gop-ink-muted">{d}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── "Tips for this prompt" (Figma 1394:8482) ────────────────────────── */
function TipsCard({ tips }: { tips: Array<{ title: string; desc: string }> }) {
  return (
    <Card>
      <CardHeader
        icon={<Lightbulb size={20} strokeWidth={1.8} />}
        title="Tips for this prompt"
        titleSize={16}
      />
      <Divider />
      <ul className="m-0 flex flex-col gap-4 p-0">
        {tips.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <SquareTerminal size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gop-dark" aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-sans text-[14px] leading-5 text-gop-ink">{t.title}</span>
              {t.desc && (
                <span className="font-sans text-gop-caption text-gop-ink-muted line-clamp-2">{t.desc}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── "How to use the prompt" (Figma 1395:8654) ───────────────────────── */
function UsageCard({ steps }: { steps: Array<{ title: string; desc: string }> }) {
  return (
    <Card>
      <div className="flex items-start gap-6 max-[760px]:flex-col">
        <div className="w-[266px] shrink-0 max-[760px]:w-full">
          <CardHeader
            icon={<HelpCircle size={20} strokeWidth={1.8} />}
            title="How to use the prompt"
            titleSize={18}
            subtitle={`A simple ${steps.length}-step workflow to get the best results.`}
            stacked
          />
        </div>
        <div className="hidden w-px self-stretch bg-[#F7F7F7] min-[761px]:block" />
        <ol className="m-0 grid flex-1 list-none grid-cols-3 gap-6 p-0 max-[760px]:grid-cols-1">
          {steps.map((s, i) => (
            <li key={i} className="flex flex-col gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(175,175,175,0.24)] bg-white font-sans text-[14px] text-black shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                <span className="font-sans text-[14px] leading-5 text-gop-ink">{s.title}</span>
                {s.desc && (
                  <p className="m-0 font-sans text-gop-caption text-gop-ink-muted line-clamp-2">{s.desc}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

/* ── Shared chrome — white r24 card, #E5E7EB edge, 32px pad (Figma) ──── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-gop-xl border border-[#E5E7EB] bg-white p-8 max-[640px]:p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  icon, title, subtitle, titleSize, stacked = false,
}: { icon: React.ReactNode; title: string; subtitle?: string; titleSize: number; stacked?: boolean }) {
  return (
    <div className={stacked ? "flex flex-col items-start gap-2.5" : "mb-4 flex items-center gap-2.5"}>
      <IconTile>{icon}</IconTile>
      <div className="flex min-w-0 flex-col">
        <span className="font-sans font-normal leading-6 text-gop-ink" style={{ fontSize: titleSize }}>{title}</span>
        {subtitle && <span className="font-sans text-gop-caption text-gop-ink-muted">{subtitle}</span>}
      </div>
    </div>
  );
}

/** 40px icon plaque (Figma "Top Navigation Bar" 40×40, r12, #EBEBEB edge). */
function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white text-gop-dark">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="mb-4 h-px w-full bg-[#F7F7F7]" />;
}
