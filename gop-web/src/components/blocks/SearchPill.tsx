"use client";

import { Search } from "lucide-react";

/**
 * SearchPill — the compact "Search ⌘K" pill (Figma 1627:16154). Tile-height
 * white pill that opens the global command palette (fires "gop:open-search",
 * the same event the navbar + hub hero search use). A shared block: the
 * category rail appends it (showSearch), and any page can drop it in.
 */
export default function SearchPill() {
  return (
    <button
      type="button"
      aria-label="Search prompts (Command K)"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new Event("gop:open-search"))}
      className={[
        "group relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white pl-4 pr-2",
        "text-gop-ink-soft shadow-[0_8px_12px_-4px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.08)]",
        "transition-[box-shadow,color] duration-200 hover:text-gop-ink",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
      ].join(" ")}
    >
      <Search size={18} strokeWidth={1.8} />
      <span className="text-[15px] leading-5">Search</span>
      <kbd
        aria-hidden
        className="ml-1 inline-flex h-[26px] items-center rounded-[8px] border border-gop-ink-hairline bg-white px-1.5 font-sans text-[13px] text-gop-ink-soft shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
      >
        ⌘K
      </kbd>
    </button>
  );
}
