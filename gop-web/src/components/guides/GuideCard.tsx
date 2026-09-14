"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ArrowUpRight, FileText } from "lucide-react";
import { getToolBrand } from "@/lib/tool-brand";
import type { Guide } from "@/lib/api";

/** Models with a real brand glyph in the registry — others (Perplexity,
 *  OpenClaw, Text, Image) fall back to a neutral mark rather than a wrong one. */
const BRANDED = new Set(["grok", "claude", "gemini", "chatgpt", "midjourney", "deepseek", "nano banana"]);
const brandIcon = (model: string | null) =>
  model && BRANDED.has(model.toLowerCase()) ? getToolBrand(model).Icon : null;

/**
 * GuideCard — a single AI-guide tile (Figma 1721:6949). Dark card: a preview
 * panel up top (the guide's browser-framed cover, with a branded fallback) +
 * a New/Update badge; a body below with the model chip, title, description,
 * and a gold-check feature list. On hover/focus the "View Page" + "Get Free
 * Access" actions reveal (always shown on touch). No rating is rendered — the
 * backend has none, and a fabricated one is never shown.
 */
export default function GuideCard({ guide }: { guide: Guide }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[24px] shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
      {/* ── Preview panel ─────────────────────────────────────────── */}
      <div className="relative flex h-[254px] items-start justify-center overflow-hidden bg-[#2d2b2c] px-4 pt-6">
        <Preview src={guide.previewImage} name={guide.name} model={guide.model} />
        {guide.badge && (
          <span
            className="absolute right-3 top-3 inline-flex h-5 items-center rounded-full border border-white/40 px-2 text-[13px] font-medium text-gop-dark shadow-[0_0_0_1px_#fdc302]"
            style={{ background: "var(--gop-gradient-gold)" }}
          >
            {guide.badge === "new" ? "New" : "Update"}
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col gap-4 bg-gop-card px-4 pb-6 pt-4">
        {guide.model && <ModelChip model={guide.model} />}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="m-0 font-sans text-[20px] font-medium leading-6 tracking-[-0.5px] text-[#f7f7f7]">
              {guide.name}
            </h3>
            {guide.description && (
              <p className="m-0 font-sans text-[13px] leading-4 text-[#a8a7a8]">{guide.description}</p>
            )}
          </div>

          {guide.features.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {guide.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={16} strokeWidth={2.4} className="shrink-0 text-gop-accent-yellow" aria-hidden />
                  <span className="font-sans text-[13px] leading-4 text-[#a8a7a8]">{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hover/focus actions — always visible on touch (no hover). */}
        {(guide.landingUrl || guide.accessUrl) && (
          <div
            className={[
              "absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 pb-6 pt-10",
              "bg-gradient-to-t from-gop-card via-gop-card/95 to-transparent",
              "translate-y-1 opacity-0 transition-[opacity,transform] duration-200 ease-out",
              "group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
              "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
            ].join(" ")}
          >
            {guide.landingUrl && (
              <a
                href={guide.landingUrl}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
              >
                View Page
              </a>
            )}
            {guide.accessUrl && (
              <a
                href={guide.accessUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-semibold text-gop-dark no-underline transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
                style={{ background: "var(--gop-gradient-gold)" }}
              >
                Get Free Access
                <ArrowUpRight size={15} strokeWidth={2.4} aria-hidden />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/** Model tag — brand glyph + name (Grok/Claude/…); plain for Text/Image. */
function ModelChip({ model }: { model: string }) {
  const Brand = brandIcon(model);
  return (
    <span className="inline-flex h-[22px] w-fit items-center gap-1 self-start rounded-gop-sm bg-black px-1.5 text-[13px] leading-4 text-[#f7f7f7]">
      {Brand ? <Brand size={16} /> : <FileText size={14} strokeWidth={1.9} aria-hidden />}
      {model}
    </span>
  );
}

/** Preview image with a branded fallback (dark, model glyph) — the product
 *  image host isn't confirmed, so a failed load degrades gracefully. */
function Preview({ src, name, model }: { src: string | null; name: string; model: string | null }) {
  const [failed, setFailed] = useState(false);
  const Brand = brandIcon(model);

  if (src && !failed) {
    // next/image now that the cover host is confirmed and allowed in
    // next.config (cdn-new.godofprompt.dev). Gets us resizing, AVIF/WebP
    // negotiation and a reserved box — the plain <img> here shipped a
    // full-size cover per card and could shift layout on load.
    //
    // The box is intentionally TALLER than its 254px panel: the cover is
    // cropped at the fold so it reads as a page peeking out of the card.
    return (
      <Image
        src={src}
        alt={name}
        width={213}
        height={332}
        sizes="213px"
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-[332px] w-[213px] rounded-[8px] object-cover object-top shadow-[0_19px_38px_rgba(0,0,0,0.3),0_15px_12px_rgba(0,0,0,0.22)]"
      />
    );
  }
  // Fits the visible panel (no overflow) and centers glyph + name — reads as
  // an intentional cover, not a broken image.
  return (
    <div className="relative flex h-[230px] w-[213px] flex-col items-center justify-center gap-3.5 overflow-hidden rounded-[8px] bg-gop-dark p-5 text-center shadow-[0_19px_38px_rgba(0,0,0,0.3),0_15px_12px_rgba(0,0,0,0.22)]">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32"
        style={{ background: "radial-gradient(circle at 70% 30%, rgba(253,195,2,0.22), transparent 70%)" }}
      />
      {Brand ? (
        <Brand size={42} className="relative text-white/85" />
      ) : (
        <span className="relative font-mono text-3xl font-bold text-gop-gold">&gt;_</span>
      )}
      <span className="relative line-clamp-2 font-sans text-[15px] font-semibold leading-tight text-white/90">{name}</span>
    </div>
  );
}
