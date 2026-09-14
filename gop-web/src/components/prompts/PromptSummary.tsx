"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Prompt } from "@/lib/api";

/**
 * PromptSummary — the collapsible long-form section at the foot of the
 * prompt page (Figma 1266:4588 → "Prompt Summary Sections"). White bordered
 * rows that expand to reveal the prompt's long-form prose (the SEO "about"
 * copy and the full how-to). Replaces the old flat "About this prompt" card.
 *
 * The first row opens by default so the page still paints meaningful,
 * crawlable copy without interaction. Body text auto-formats ● bullets and
 * numbered steps into lists, everything else into paragraphs.
 */
type Item = { id: string; title: string; body: string };

function buildItems(prompt: Prompt): Item[] {
  // A single block: STRICTLY the schema's long-form SEO copy
  // (seo_description → seoDescription). No fallback to `description` —
  // that one-liner already renders in the page header, so repeating it
  // here reads as filler. No SEO text → no section.
  const about = (prompt.seoDescription ?? "").trim();
  // Heading = prompt name + static "Description" so the row reads as a
  // section ("AI Business Consultant Description"), not a stray title.
  const name = prompt.promptName || prompt.title;
  return about ? [{ id: "about", title: `${name} Description`, body: about }] : [];
}

export default function PromptSummary({ prompt }: { prompt: Prompt }) {
  const items = buildItems(prompt);
  const [open, setOpen] = useState<string | null>(() => items[0]?.id ?? null);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={open === item.id}
          onToggle={() => setOpen((cur) => (cur === item.id ? null : item.id))}
        />
      ))}
    </section>
  );
}

function AccordionRow({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  return (
    <div className="overflow-hidden rounded-gop-md border border-gop-ink-hairline bg-gop-surface">
      <h2 className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gop-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gop-accent-yellow max-[640px]:px-5"
        >
          <span className="font-sans text-[20px] font-medium leading-6 tracking-[-0.5px] text-gop-ink max-[640px]:text-[17px]">
            {item.title}
          </span>
          <ChevronDown
            size={22}
            strokeWidth={2}
            aria-hidden
            className={`shrink-0 text-gop-ink-soft transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>

      {/* grid-rows 0fr→1fr animates height with no JS measuring */}
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-1 max-[640px]:px-5">
            <Prose text={item.body} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Body prose — ● bullets / "1." steps → lists, else paragraphs ─────── */
const BULLET = /^[\s]*([●•\-*]|\d+[.)])\s+/;

function Prose({ text }: { text: string }): ReactNode {
  const lines = String(text)
    .replace(/([●•])\s*/g, "\n$1 ")
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: Array<{ type: "p"; text: string } | { type: "ul"; items: string[] }> = [];
  let list: { type: "ul"; items: string[] } | null = null;
  for (const line of lines) {
    if (BULLET.test(line)) {
      if (!list) { list = { type: "ul", items: [] }; blocks.push(list); }
      list.items.push(line.replace(BULLET, ""));
    } else {
      list = null;
      blocks.push({ type: "p", text: line });
    }
  }

  return (
    <div className="flex max-w-[80ch] flex-col gap-3">
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="m-0 flex flex-col gap-2 p-0 list-none">
            {b.items.map((it, j) => (
              <li
                key={j}
                className="relative pl-5 text-gop-body text-gop-ink-muted min-w-0
                           before:absolute before:left-1 before:top-[0.7em] before:h-1 before:w-1
                           before:rounded-full before:bg-gop-ink-soft before:content-['']"
              >
                {it}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="m-0 text-gop-body text-gop-ink-muted">{b.text}</p>
        ),
      )}
    </div>
  );
}
