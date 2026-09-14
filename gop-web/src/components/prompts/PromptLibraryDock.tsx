"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/ui/Sheet";
import PromptGeneratorClient from "@/components/generator/PromptGeneratorClient";
import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { Search, WandSparkles } from "lucide-react";

/**
 * PromptLibraryDock — two sticky bottom-corner circles that float over the
 * prompt grid (Figma 1617:13017), one per bottom corner:
 *
 *   Custom Prompts  (bottom-left)   silver wand → hover expands to a labelled
 *                                   pill; links to the generator page.
 *   Search          (bottom-right)  magnifier   → hover expands into a search
 *                                   bar; clicking opens the ⌘K palette.
 *
 * They ride the viewport bottom while the prompts region is on screen and
 * STOP at that region's end (never float over the footer). Bounding is
 * measured against the nearest `[data-prompt-dock-boundary]`, so the dock
 * hides on library routes without a prompt grid (e.g. the detail page).
 *
 * Both use the DS "Context Menu" dark-glass recipe (#242223 + inset top
 * highlight + soft shadow + hairline) and sit under the ⌘K palette (z-40).
 */
const GENERATOR_PATH = "/prompt-generator";

const GLASS =
  "border border-white/[0.08] bg-gop-card " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_0.6px_2px_rgba(255,255,255,0.12),0_14px_30px_-12px_rgba(0,0,0,0.65)] " +
  "backdrop-blur-[12px]";

// Shared pill shell: dark glass, press feedback, focus ring, motion-safe.
const SHELL =
  "group pointer-events-auto flex h-12 items-center overflow-hidden rounded-full no-underline " +
  "transition-transform duration-150 ease-out hover:-translate-y-px focus-within:-translate-y-px active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-accent-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
  GLASS;

// Label/placeholder that unrolls from the icon on hover/focus.
const REVEAL =
  "max-w-0 overflow-hidden whitespace-nowrap pr-0 text-[15px] leading-5 opacity-0 " +
  "transition-[max-width,opacity,padding] duration-200 ease-out " +
  "group-hover:max-w-[200px] group-hover:opacity-100 group-focus-visible:max-w-[200px] group-focus-visible:opacity-100 " +
  "motion-reduce:transition-none";

/** Position the dock against the prompt region. It rides the viewport bottom
 *  (offset 0) while more is streaming in — so it never jumps as batches append
 *  — and only PARKS at the region's end (offset ≤ 0, moves up) once the region
 *  opts in with `data-dock-park` (hub: when done loading; pSEO: always).
 *
 *  Scroll-driven updates are instant (the dock tracks the end edge frame by
 *  frame); size/park-state changes settle smoothly (`smooth`), so the parking
 *  and any late reflow glide instead of snapping. */
type DockState = { show: boolean; offset: number; smooth: boolean };

function useDockBounds() {
  const pathname = usePathname();
  const [state, setState] = useState<DockState>({
    show: false,
    offset: 0,
    smooth: false,
  });

  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = (smooth: boolean) => {
      raf = 0;
      const el = document.querySelector("[data-prompt-dock-boundary]");
      if (!el) {
        setState((s) =>
          s.show ? { show: false, offset: 0, smooth: false } : s,
        );
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const show = r.bottom > 24 && r.top < vh;
      // Only clamp to the region's end once it opts into parking; otherwise
      // stay pinned to the viewport bottom (offset 0) so appends don't shift it.
      const park = el.hasAttribute("data-dock-park");
      const offset = park ? Math.min(0, Math.round(r.bottom - vh)) : 0;
      setState({ show, offset, smooth: smooth && !reduce.matches });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => measure(false));
    };
    measure(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const el = document.querySelector("[data-prompt-dock-boundary]");
    let ro: ResizeObserver | undefined;
    let mo: MutationObserver | undefined;
    if (el) {
      if ("ResizeObserver" in window) {
        ro = new ResizeObserver(() => measure(true));
        ro.observe(el);
      }
      mo = new MutationObserver(() => measure(true));
      mo.observe(el, { attributes: true, attributeFilter: ["data-dock-park"] });
    }
    const t = setTimeout(() => measure(false), 300);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro?.disconnect();
      mo?.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return state;
}

export default function PromptLibraryDock() {
  // The generator opens as a docked sheet over the current page rather than
  // navigating away — the page behind stays live (see components/ui/Sheet).
  const [sheetOpen, setSheetOpen] = useState(false);
  const { show, offset, smooth } = useDockBounds();

  return (
    <>
      <div
        aria-hidden={!show}
        style={{
          transform: `translateY(${offset}px)`,
          // Opacity always eases (fade in/out); the transform only eases when
          // settling/parking, so scroll-tracking stays instant (no rubber-band).
          transition: smooth
            ? "opacity 200ms ease, transform 300ms cubic-bezier(0.23,1,0.32,1)"
            : "opacity 200ms ease",
        }}
        className={
          "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex items-center justify-between px-6 " +
          (show ? "opacity-100" : "pointer-events-none opacity-0")
        }
      >
        {/* Custom Prompts — silver wand circle, expands to a labelled pill */}
        <Link
          href={GENERATOR_PATH}
          aria-label="Build a custom prompt"
          tabIndex={show ? undefined : -1}
          className={SHELL}
          onClick={(e) => {
            // Plain left click opens the docked sheet; modified clicks and
            // middle click keep the browser's normal new-tab behaviour, and the
            // href stays real so crawlers and no-JS users get the full page.
            if (
              e.metaKey ||
              e.ctrlKey ||
              e.shiftKey ||
              e.altKey ||
              e.button !== 0
            )
              return;
            e.preventDefault();
            setSheetOpen(true);
          }}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center">
            <WandSparkles
              size={19}
              strokeWidth={1.9}
              className="text-[#c7ccd4]"
              aria-hidden
            />
          </span>
          <span
            className={
              REVEAL +
              " font-medium text-white group-hover:pr-5 group-focus-visible:pr-5"
            }
          >
            Custom Prompts
          </span>
        </Link>

        {/* Search — magnifier circle, expands into a bar; click opens ⌘K palette */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("gop:open-search"))}
          aria-label="Search prompts (Command K)"
          aria-keyshortcuts="Meta+K Control+K"
          tabIndex={show ? undefined : -1}
          className={SHELL}
        >
          <span
            className={
              REVEAL +
              " order-1 text-white/45 group-hover:pl-5 group-focus-visible:pl-5"
            }
          >
            Search prompts…
          </span>
          <span className="order-2 grid h-12 w-12 shrink-0 place-items-center">
            <Search
              size={20}
              strokeWidth={1.9}
              className="text-white/90"
              aria-hidden
            />
          </span>
        </button>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        path={GENERATOR_PATH}
        title="Custom Prompt Generator — God of Prompt"
        heading="Generate Your AI Prompts In One Click"
        subheading="Describe your goal like you're chatting with a friend, and we'll handle the rest."
      >
        <PromptGeneratorClient />
      </Sheet>
    </>
  );
}
