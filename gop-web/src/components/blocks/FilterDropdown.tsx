"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { GLASS_PANEL } from "./GlassMenu";
import FilterHint from "./FilterHint";

/**
 * FilterDropdown — the white pill trigger + glass popover for filter rows
 * (Figma 1725:7656). A shared block used by the library's PseoFilterRow and
 * the guides filter row. Two sizes:
 *   md — a 40px pill (icon + value + chevron chip), inside a grey capsule.
 *   sm — a 32px compact pill ("Sort by: Newest ▾").
 * Menu rows come in as children (MenuLink / MenuOption from GlassMenu). Closes
 * on outside click, Escape, or any click inside. `disabled` blanks the pill
 * and shows `disabledHint` on click (used for inert axes with no data yet).
 */
export default function FilterDropdown({
  icon,
  prefix,
  value,
  size = "md",
  align = "left",
  active = false,
  disabled = false,
  disabledHint,
  ariaLabel,
  children,
}: {
  icon?: ReactNode;
  /** Static lead-in text, e.g. "Sort by:". */
  prefix?: string;
  value: string;
  size?: "md" | "sm";
  align?: "left" | "right";
  /** This facet is the route's active selection — the pill reads as engaged
   *  (ink outline + bolder value) instead of a flat white chip. */
  active?: boolean;
  /** Blanked out — the menu won't open; a click shows `disabledHint`. */
  disabled?: boolean;
  disabledHint?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sizeCls =
    size === "md" ? "h-10 gap-2 pl-4 pr-1.5 text-[14px]" : "h-8 gap-1.5 px-3 text-[13px]";
  // Blanked (unavailable) → dimmed, no ring. Selected → ink outline + faint
  // inset ring so it stands out from the flat white pills. Otherwise flat.
  const skin = disabled
    ? "border-transparent opacity-45 shadow-none"
    : active
      ? "border-gop-ink/25 ring-1 ring-inset ring-gop-ink/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      : size === "md"
        ? "border-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gop-ink-faint"
        : "border-gop-ink-faint/60 hover:border-gop-ink-faint";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={disabled ? undefined : open}
        aria-disabled={disabled || undefined}
        onClick={() => (disabled ? setHint(true) : setOpen((o) => !o))}
        className={[
          "inline-flex items-center whitespace-nowrap rounded-full border bg-white leading-none text-gop-ink transition-colors duration-150",
          sizeCls,
          skin,
          disabled ? "cursor-not-allowed" : "",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-accent-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        ].join(" ")}
      >
        {icon && <span aria-hidden className="inline-flex shrink-0 items-center text-gop-ink">{icon}</span>}
        {prefix && <span className="text-gop-ink-muted">{prefix}</span>}
        <span className={`max-w-[150px] truncate ${active ? "font-semibold" : "font-medium"}`}>{value}</span>
        {size === "md" ? (
          <span
            aria-hidden
            className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gop-ink-faint/60 bg-white"
          >
            <ChevronDown size={13} className={`text-gop-ink-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
          </span>
        ) : (
          <ChevronDown size={14} className={`text-gop-ink transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && !disabled && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={[
            "absolute top-full z-50 mt-2 max-h-[min(360px,60vh)] min-w-[240px] overflow-y-auto",
            GLASS_PANEL,
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {children}
        </div>
      )}

      <FilterHint
        show={hint && disabled}
        message={disabledHint ?? "Not available with the current selection"}
        onDismiss={() => setHint(false)}
        align={align}
      />
    </div>
  );
}
