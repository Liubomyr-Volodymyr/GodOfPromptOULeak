"use client";

import { useEffect, useState } from "react";
import NewsletterCard from "./NewsletterCard";

/**
 * NewsletterPopup — the timed-modal placement of NewsletterCard. Drop it once
 * (e.g. in the root layout or a specific page) and it opens itself after
 * `delayMs`, then never again once the visitor dismisses or subscribes
 * (persisted in localStorage under `storageKey`). Not mounted anywhere yet —
 * ready for when we turn it on.
 *
 *   <NewsletterPopup source="popup-homepage" delayMs={25000} />
 *
 * Honesty + reuse come free: it renders the exact same NewsletterCard, so the
 * copy, illustration, and real /api/lead/capture wiring stay in one place.
 */
export default function NewsletterPopup({
  source = "timed-popup",
  delayMs = 25000,
  storageKey = "gop_newsletter_popup_dismissed",
}: {
  source?: string;
  delayMs?: number;
  storageKey?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(storageKey) === "1";
    } catch {
      /* private mode — treat as not dismissed */
    }
    if (dismissed) return;
    const t = window.setTimeout(() => setOpen(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, storageKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div className="relative w-full max-w-[880px]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gop-ink shadow-md transition-transform hover:scale-105"
        >
          ✕
        </button>
        <NewsletterCard source={source} />
      </div>
    </div>
  );
}
