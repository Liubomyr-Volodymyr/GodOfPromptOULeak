"use client";

import Link from "@/components/ui/Link";
import { Check } from "lucide-react";

/**
 * GlassMenu — the shared dropdown-panel primitive for the library filter
 * surface. One source for the DS "Context Menu" glass (Figma 547-6998:
 * rgba(20,20,20,.8) + blur-24 + r-24 + layered shadow with inset highlights)
 * and the light-on-glass row components. Consumed by PseoDropdown, the hub
 * FilterDropdowns panels, and the LibraryResults sort listbox.
 *
 * GLASS_PANEL is visual-only — callers add their own positioning (absolute /
 * top / left) and sizing (min-w / max-h / overflow). (The navbar keeps its
 * own copy of the recipe by design; this is the library's.)
 */
export const GLASS_PANEL =
  "rounded-3xl bg-[rgba(20,20,20,0.8)] p-2 backdrop-blur-[24px] " +
  "shadow-[0_-12px_30px_rgba(0,0,0,0.12),0_4px_6px_rgba(0,0,0,0.06),0_12px_13px_rgba(0,0,0,0.17),0_-3px_5px_rgba(0,0,0,0.09),inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_1px_2px_rgba(255,255,255,0.08)]";

// Light-on-glass rows, full-radius (match GLASS_PANEL).
const ROW =
  "flex min-h-10 items-center gap-2.5 rounded-full px-3 text-[13.5px] no-underline transition-colors duration-150 " +
  "text-[#F7F7F7] hover:bg-white/[0.08] hover:text-white";
const ROW_ACTIVE = "bg-white/[0.16] font-medium text-white";

/** A navigating menu item (filter value → its canonical page). */
export function MenuLink({ href, icon, active, children }: { href: string; icon?: React.ReactNode; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={[ROW, active ? ROW_ACTIVE : ""].join(" ")}>
      {icon && <span className="inline-flex shrink-0 text-white/70">{icon}</span>}
      <span className="truncate">{children}</span>
      {active && <Check size={14} strokeWidth={2.5} className="ml-auto shrink-0 text-gop-menu-hover" />}
    </Link>
  );
}

/** A client option (e.g. Sort) — applies state instead of navigating. */
export function MenuOption({ active, onSelect, children }: { active?: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onSelect} className={["w-full", ROW, active ? ROW_ACTIVE : ""].join(" ")}>
      <span className="truncate">{children}</span>
      {active && <Check size={14} strokeWidth={2.5} className="ml-auto shrink-0 text-gop-menu-hover" />}
    </button>
  );
}
