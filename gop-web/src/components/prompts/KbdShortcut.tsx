"use client";

import { useEffect, useState } from "react";

/**
 * KbdShortcut — a platform-aware ⌘K / Ctrl K chip. The palette listens for
 * both Meta+K (Mac) and Ctrl+K (Windows/Linux), so the glyph should match
 * the user's platform. Hydration-safe: renders "⌘K" on the server and on
 * first paint, then corrects to "Ctrl K" after mount on non-Mac platforms
 * (so the server/client markup matches on first render — no mismatch).
 *
 * `className` carries the caller's existing kbd styling verbatim so the
 * visual stays identical across the search buttons that use it.
 */
export default function KbdShortcut({ className }: { className?: string }) {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ||
      navigator.platform ||
      "";
    setIsMac(/mac/i.test(platform));
  }, []);

  return (
    <kbd aria-hidden className={className}>
      {isMac ? "⌘K" : "Ctrl K"}
    </kbd>
  );
}
