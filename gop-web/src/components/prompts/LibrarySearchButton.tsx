"use client";

import { Search } from "lucide-react";
import KbdShortcut from "./KbdShortcut";

/**
 * LibrarySearchButton — the hero search pill (Figma 1617:23129). A white
 * rounded-full button with a soft top glow, "Search" label, and the ⌘K
 * shortcut chip. Opens the global command palette (same event the navbar
 * search uses).
 */
export default function LibrarySearchButton() {
  return (
    <button
      type="button"
      aria-label="Search prompts (Command K)"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new Event("gop:open-search"))}
      className={[
        // Input-style layout (Figma 1617:23129): label group flush left,
        // ⌘K chip pinned to the right edge — not a centered cluster.
        "group relative inline-flex h-12 w-full max-w-[480px] items-center justify-between overflow-hidden",
        "rounded-full bg-white px-4 text-gop-body-sm text-gop-ink-soft",
        "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_16px_-8px_rgba(0,0,0,0.08)]",
        "transition-[box-shadow,transform] duration-200 [transition-timing-function:var(--gop-ease-standard)]",
        "hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_24px_-10px_rgba(0,0,0,0.14)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
      ].join(" ")}
    >
      {/* soft top glow (Figma Ellipse 1904) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2 left-1/2 h-6 w-[90%] -translate-x-1/2 rounded-full bg-white opacity-60 blur-[6px]"
      />
      <span className="relative flex items-center gap-2">
        <Search size={18} strokeWidth={1.8} className="text-gop-ink-soft" />
        <span>Search</span>
      </span>
      <KbdShortcut className="relative inline-flex h-[26px] items-center rounded-[8px] border border-gop-ink-hairline bg-white px-1.5 font-sans text-[13px] text-gop-ink-soft shadow-[0_1px_1px_rgba(0,0,0,0.04)]" />
    </button>
  );
}
