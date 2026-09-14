"use client";

import { Fragment, useEffect, useRef } from "react";
import PromptCard, { type PromptCardVariant } from "./PromptCard";
import UnlockCTA from "./UnlockCTA";
import type { Prompt } from "@/lib/api";

// Entrance for appended cards — matches Emil's ease-out; guarded for reduced motion.
const CARD_IN = "motion-safe:animate-[gop-card-in_360ms_cubic-bezier(0.23,1,0.32,1)_both]";

/**
 * PromptGrid — the shared card mosaic for every library listing (hub +
 * pSEO). Figma 1617:13038 / 1434:16236: a 3-column dense grid on 234px rows
 * with a repeating rhythm — tall code-preview cards, wide (photo when the
 * prompt has example output) cards, and half-height cards — plus the
 * "Unlock Full Experience" CTA tile injected once inside the grid.
 *
 * Presentational: callers own data-fetching + pagination and pass the
 * current page of prompts. `loading` dims the grid during a re-query.
 */
export default function PromptGrid({
  prompts,
  loading = false,
  ctaAfter = 4,
  animateAppends = false,
}: {
  prompts: Prompt[];
  loading?: boolean;
  /** Grid index after which the Unlock CTA tile is injected. */
  ctaAfter?: number;
  /** Fade+rise cards that appear after the first render (infinite scroll). */
  animateAppends?: boolean;
}) {
  // Ids committed on prior renders. Anything not in here on a later render is
  // a freshly-appended card → gets the entrance animation. The initial render
  // seeds nothing (see effect), so SSR cards never animate; the effect fills
  // it after each commit, which is strict-mode safe (no render-time mutation).
  const seenRef = useRef<Set<Prompt["id"]>>(new Set());
  const initedRef = useRef(false);
  useEffect(() => {
    for (const p of prompts) seenRef.current.add(p.id);
    initedRef.current = true;
  }, [prompts]);
  const isNew = (id: Prompt["id"]) =>
    animateAppends && initedRef.current && !seenRef.current.has(id);

  if (prompts.length === 0 && !loading) {
    return (
      <div className="rounded-gop-lg border border-dashed border-gop-ink-hairline bg-white p-12 text-center text-gop-ink-muted">
        No prompts here yet — check back soon.
      </div>
    );
  }

  return (
    <div
      aria-busy={loading}
      className={[
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:auto-rows-[234px] sm:grid-flow-dense",
        "transition-opacity duration-200",
        loading ? "pointer-events-none opacity-50" : "opacity-100",
      ].join(" ")}
    >
      {prompts.map((p, i) => {
        const { variant, className } = slotFor(i, p);
        const cls = isNew(p.id) ? `${className} ${CARD_IN}` : className;
        return (
          <Fragment key={p.id}>
            <PromptCard prompt={p} variant={variant} className={cls} />
            {i === ctaAfter && <UnlockCTA className="sm:h-full" />}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ── mosaic pattern (Figma rows: tall·tall·halves / halves·wide / wide·halves) ── */

function slotFor(i: number, p: Prompt): { variant: PromptCardVariant; className: string } {
  const pos = i % 9;
  const hasImage = !!p.heroImage;
  // slots 0,1 → tall code preview cards
  if (pos === 0 || pos === 1) return { variant: "code", className: "sm:row-span-2 sm:h-full" };
  // slots 5,6 → wide cards (photo when the prompt has example output)
  if (pos === 5 || pos === 6) {
    return hasImage
      ? { variant: "photo", className: "sm:row-span-2 lg:col-span-2 sm:h-full" }
      : { variant: "code", className: "sm:row-span-2 lg:col-span-2 sm:h-full" };
  }
  // remaining slots → half-height cards, photo when possible
  return { variant: hasImage ? "photo" : "standard", className: "sm:h-full" };
}
