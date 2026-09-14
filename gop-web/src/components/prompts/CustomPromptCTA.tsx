"use client";

/* eslint-disable @next/next/no-img-element -- decorative, pre-sized Figma exports */

import { useEffect, useRef } from "react";

/**
 * CustomPromptCTA — "No Perfect Match? Generate a Custom Prompt" banner,
 * rebuilt 1:1 from Figma 1338:6218 (design-context). Dark #242223 panel with
 * the DS glassy inset + a soft top glow, the real model app-icon tiles
 * exported from Figma at their native sizes, the headline (Generate = bold
 * italic, NO outline), and the compact gold button on the brand token.
 *
 * The tiles drift a few px vertically as the banner crosses the viewport
 * (scroll parallax, per-tile depth) — rAF-throttled, attached only while
 * the banner is on screen, off entirely for prefers-reduced-motion.
 */
const GENERATOR_URL = "/prompt-generator";

export default function CustomPromptCTA() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tiles = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    if (tiles.length === 0) return;

    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const half = window.innerHeight / 2;
      // -1 (banner below the fold) → 0 (centred) → 1 (scrolled past)
      const p = Math.max(-1, Math.min(1, (half - (r.top + r.height / 2)) / half));
      for (const t of tiles) {
        const depth = Number(t.dataset.depth) || 0;
        // Drift only — centring comes from the class utilities, which in
        // Tailwind v4 live on the native `translate` property and compose
        // with this transform (re-adding -50% here double-shifts).
        t.style.transform = `translateY(${(p * depth).toFixed(1)}px)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "80px" },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden rounded-gop-xl bg-gop-card shadow-[inset_0_27px_76px_rgba(255,255,255,0.06),inset_0_0.6px_2px_rgba(255,255,255,0.16)]"
    >
      {/* glow — Figma Ellipse 1904, bleeding from the top centre */}
      <img
        src="/images/cta/glow.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-0 w-[940px] max-w-none -translate-x-1/2 -translate-y-[56%] select-none"
      />

      {/* floating model tiles — exact Figma exports at native size (the tile +
          glow + 3D tilt are baked in). Top row sits low enough to clear the
          banner's top edge; depth = parallax drift in px. */}
      <Tile src="claude.svg" w={142} depth={16} className="left-[18.9%] top-[32%]" />
      <Tile src="gemini.png" w={126} depth={11} className="left-[79%] top-[30%]" />
      <Tile src="chatgpt.svg" w={130} depth={8} className="left-[10.5%] top-[74%]" />
      <Tile src="qwen.png" w={126} depth={13} className="left-[88.3%] top-[72%]" />

      {/* content — centred (Figma "Custom Prompt Content"); py-10 gives the
          floating tiles headroom against the banner edges */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="m-0 font-sans text-[32px] font-light leading-10 tracking-[-0.5px] text-gop-menu-item max-[640px]:text-[26px] max-[640px]:leading-9">
            No Perfect Match?
          </h2>
          <p className="m-0 flex flex-wrap items-center justify-center gap-x-3 font-sans text-[32px] leading-10 tracking-[-0.5px] text-gop-menu-item max-[640px]:text-[26px] max-[640px]:leading-9">
            <span className="font-bold italic">Generate</span>
            <span className="font-light">a Custom Prompt</span>
          </p>
        </div>

        {/* Button — Figma 1338:6870: compact gold gradient pill, 1px gold ring */}
        <a
          href={GENERATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex h-14 items-center justify-center gap-1 overflow-hidden rounded-full border border-white/40 px-4 font-sans text-[18px] leading-6 text-gop-dark shadow-[0_0_0_1px_#fdc302] transition-[filter,transform] duration-150 ease-out hover:brightness-[1.03] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold focus-visible:ring-offset-2"
          style={{ background: "var(--gop-gradient-gold)" }}
        >
          {/* white top-edge sheen (Figma Ellipse 1905) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[-1px] -top-[18px] h-[22px]"
            style={{ background: "radial-gradient(50% 100% at 50% 100%, rgba(255,255,255,0.65), transparent 72%)" }}
          />
          <span className="relative">Generate</span>
          <img src="/images/cta/wand.svg" alt="" aria-hidden width={24} height={24} className="relative" />
        </a>
      </div>
    </section>
  );
}

/** A floating model app-icon tile (decorative; the tile + glow + tilt are
 *  baked into the export). Sized at native width, centred on its position.
 *  data-depth: px of vertical parallax drift at full scroll progress —
 *  the class transform is the reduced-motion/initial fallback; the scroll
 *  handler overrides it inline with the same centring plus the drift. */
function Tile({ src, w, depth, className }: { src: string; w: number; depth: number; className: string }) {
  return (
    <img
      src={`/images/cta/${src}`}
      alt=""
      aria-hidden
      data-depth={depth}
      style={{ width: w }}
      className={`pointer-events-none absolute z-0 hidden h-auto -translate-x-1/2 -translate-y-1/2 select-none will-change-transform md:block ${className}`}
    />
  );
}
