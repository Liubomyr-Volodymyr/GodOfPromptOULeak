"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * Sheet — a docked bottom panel that opens over the page WITHOUT taking it
 * over (Figma 2073:24525).
 *
 * NON-MODAL ON PURPOSE. Unlike a dialog, the page behind stays fully alive:
 * no backdrop that swallows clicks, no scroll lock, no `inert`, no focus
 * trap. Both surfaces are usable at once — you can keep reading the bento
 * while the generator sits at the bottom. That is why this is
 * `role="dialog"` WITHOUT `aria-modal` (claiming aria-modal here would lie to
 * screen readers about the page being unavailable).
 *
 * IT COUNTS AS A PAGE VIEW. Opening pushes `path` into history and reports a
 * page_view, so the sheet earns analytics the same as a navigation would —
 * necessary because the GTM container forwards only page_view (see
 * lib/analytics.ts). It also means the URL is shareable, the back button
 * closes the sheet, and a visitor who lands on `path` directly gets the real
 * full page instead of a dead link.
 *
 * `onExpand` promotes the sheet to that full page — the "Full Screen"
 * affordance in the design.
 */
export default function Sheet({
  open,
  onClose,
  path,
  title,
  heading,
  subheading,
  children,
  /** Share of the viewport height the sheet occupies. Design is ~45%. */
  height = "46vh",
}: {
  open: boolean;
  onClose: () => void;
  /** Real, linkable route this sheet stands in for, e.g. "/prompt-generator". */
  path: string;
  /** Document title to report with the page view. */
  title: string;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  children: React.ReactNode;
  height?: string;
}) {
  const router = useRouter();
  // Where the user was before opening, so closing restores it exactly.
  const returnTo = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;

    returnTo.current = window.location.pathname + window.location.search;
    window.history.pushState({ gopSheet: path }, "", path);
    trackPageView(path, title);

    // Back button closes the sheet rather than leaving the site.
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // Intentionally keyed on `open` only: re-running on prop identity would
    // push a duplicate history entry and double-count the page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => {
    // Restore the URL we came from without adding another history entry.
    if (returnTo.current && window.location.pathname === path) {
      window.history.replaceState({}, "", returnTo.current);
      trackPageView(returnTo.current, document.title);
    }
    onClose();
  }, [onClose, path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <section
      role="dialog"
      aria-label={typeof heading === "string" ? heading : title}
      style={{ height }}
      className={
        "fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-[20px] " +
        "border-t border-white/12 bg-[rgba(36,34,35,0.92)] backdrop-blur-xl " +
        "shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.65)] " +
        // enters from the bottom; ease-out so it feels immediate
        "motion-safe:animate-[gop-sheet-in_260ms_cubic-bezier(0.32,0.72,0,1)]"
      }
    >
      <style>{`@keyframes gop-sheet-in{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      <header className="relative shrink-0 px-6 pb-3 pt-5 text-center max-[640px]:px-4">
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em] text-white">{heading}</h2>
        {subheading && (
          <p className="mx-auto m-0 mt-1 max-w-[560px] text-[13px] leading-5 text-white/55">{subheading}</p>
        )}

        <div className="absolute right-4 top-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => router.push(path)}
            aria-label="Open full screen"
            className="grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Maximize2 size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 max-[640px]:px-4">{children}</div>

      <footer className="shrink-0 px-6 pb-4 text-right max-[640px]:px-4">
        <button
          type="button"
          onClick={() => router.push(path)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          Full Screen
          <Maximize2 size={13} aria-hidden />
        </button>
      </footer>
    </section>,
    document.body,
  );
}
