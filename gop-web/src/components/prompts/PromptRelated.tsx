"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PromptCard from "./PromptCard";
import type { Prompt } from "@/lib/api";

/**
 * PromptRelated — horizontal-scroll strip of related prompts.
 *
 * Replaces the identical-card-grid anti-pattern. Cards snap to the
 * scroller, arrows in the header expose the next page, and edge fade
 * gradients tell the user the row extends.
 *
 * Returns null when there are no items so the section header doesn't
 * orphan on a thin prompt.
 */
type Props = {
  items: Prompt[];
  title?: string;
};

export default function PromptRelated({ items, title = "Related Prompts" }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [items?.length]);

  if (!items?.length) return null;

  const scrollBy = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-related-card]");
    const step = card ? card.getBoundingClientRect().width + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-6 min-w-0 max-[640px]:gap-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-gop-subtitle text-gop-ink">
          {title}
        </h2>
        <div className="flex gap-1.5">
          <ScrollButton dir="left" onClick={() => scrollBy(-1)} disabled={!canLeft} />
          <ScrollButton dir="right" onClick={() => scrollBy(1)} disabled={!canRight} />
        </div>
      </header>

      <div
        className="relative -mx-6 -mb-5 px-6 max-[640px]:-mx-4 max-[640px]:px-4"
        data-can-left={canLeft || undefined}
        data-can-right={canRight || undefined}
      >
        {/* Edge fade gradients — toggle via data attrs */}
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute inset-y-0 left-0 z-[2] w-10",
            "bg-gradient-to-r from-gop-page to-transparent",
            "transition-opacity duration-200",
            canLeft ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute inset-y-0 right-0 z-[2] w-10",
            "bg-gradient-to-l from-gop-page to-transparent",
            "transition-opacity duration-200",
            canRight ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          ref={scrollerRef}
          role="region"
          aria-label={title}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1); }
            if (e.key === "ArrowLeft")  { e.preventDefault(); scrollBy(-1); }
          }}
          className={[
            // 3-up at desktop (Figma: 389px cards, 16px gaps on the 1200
            // grid); below 980px fall back to peek-scroll card widths.
            "grid grid-flow-col auto-cols-[calc((100%-2rem)/3)]",
            "max-[980px]:auto-cols-[minmax(280px,320px)]",
            // overflow-x:auto forces overflow-y to compute to auto (CSS spec),
            // which clips the card's downward hover shadow. pt-2/pb-7 gives the
            // shadow room inside the scroll viewport; -mb-5 on the wrapper above
            // reclaims most of the extra height so the strip doesn't balloon.
            "gap-4 overflow-x-auto overflow-y-visible pt-2 pb-7",
            "snap-x snap-mandatory scroll-pl-6 max-[640px]:scroll-pl-4",
            // Hidden scrollbar — the arrow buttons + edge fades are the
            // scroll affordance, no ugly track. Firefox + WebKit.
            "[scrollbar-width:none] [-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gop-accent-yellow focus-visible:rounded-lg",
          ].join(" ")}
        >
          {/* h-full both levels → every card matches the tallest in the row
              (grid cells already stretch; the card fills its cell, and its
              mt-auto stats row bottom-aligns across all cards). */}
          {items.map((p) => (
            <div key={p.id} data-related-card className="snap-start h-full">
              <PromptCard prompt={p} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollButton({
  dir, onClick, disabled,
}: { dir: "left" | "right"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Scroll to previous prompts" : "Scroll to more prompts"}
      className={[
        // Figma 1400:8859 — 32px white round button, #AFAFAF/24 edge.
        "inline-flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 items-center justify-center rounded-full",
        "border border-[rgba(175,175,175,0.24)] bg-white text-gop-dark shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-[background,border-color,transform] duration-150 ease-out",
        "hover:bg-gop-surface-alt hover:border-gop-ink-faint",
        "active:not-disabled:scale-95",
        "disabled:opacity-35 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {dir === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}
