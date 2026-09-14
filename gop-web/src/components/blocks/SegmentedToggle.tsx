"use client";

import type { ReactNode } from "react";

/**
 * SegmentedToggle — a small pill-shaped segmented control (Figma 1725:7656,
 * the "All / Text / Image" pattern). A shared block for simple state toggles
 * (e.g. the guides format filter). The prompt library's format toggle is a
 * specialised variant (routed links + modality locks) and stays local; this is
 * the plain button-driven version any page can reuse.
 */
export type Segment = { value: string; label: string; icon?: ReactNode; disabled?: boolean };

export default function SegmentedToggle({
  segments,
  value,
  onChange,
  ariaLabel,
}: {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex h-8 items-center gap-0.5 rounded-full border border-gop-ink-faint/60 bg-white p-1"
    >
      {segments.map((s) => {
        const on = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            aria-pressed={on}
            disabled={s.disabled}
            onClick={() => onChange(s.value)}
            className={[
              "inline-flex h-6 items-center gap-1.5 rounded-full px-3 text-[13px] leading-none transition-colors duration-150",
              on
                ? "bg-gop-dark font-medium text-white"
                : "text-gop-ink-muted hover:text-gop-ink",
              s.disabled ? "cursor-not-allowed opacity-45" : "",
            ].join(" ")}
          >
            {s.icon}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
