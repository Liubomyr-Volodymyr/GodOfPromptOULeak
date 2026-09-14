"use client";

import { useEffect } from "react";

/**
 * FilterHint — a small popover bubble that explains why a filter control is
 * blanked/disabled ("no image prompts here", "only two filters at once").
 * Renders below its (relatively-positioned) parent and auto-dismisses.
 * The consumer owns the boolean and toggles it on a disabled click.
 */
export default function FilterHint({
  show,
  message,
  onDismiss,
  align = "left",
}: {
  show: boolean;
  message: string;
  onDismiss: () => void;
  align?: "left" | "right";
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 2600);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  if (!show) return null;
  return (
    <div
      role="status"
      className={[
        "pointer-events-none absolute top-full z-[60] mt-2 w-max max-w-[220px] rounded-xl px-3 py-2",
        "bg-gop-ink text-[12px] leading-4 text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55)]",
        "animate-in fade-in slide-in-from-top-1 duration-150",
        align === "right" ? "right-0" : "left-0",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
