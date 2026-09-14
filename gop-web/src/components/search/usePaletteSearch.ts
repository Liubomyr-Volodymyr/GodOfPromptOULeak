"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadRecentPrompts,
  rememberRecentPrompt,
  type RecentPrompt,
} from "@/lib/recent-prompts";
import { fetchSearch } from "@/lib/api/client";

export type Hit = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  isPremium: boolean;
  views?: number;
};

/** Query the palette panel's focusable descendants (for the Tab trap). */
function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

/** A keydown that is an IME composition commit/cancel — never navigate on it. */
function isComposing(e: { isComposing: boolean; keyCode: number }): boolean {
  return e.isComposing || e.keyCode === 229;
}

/**
 * usePaletteSearch — all the stateful wiring for the ⌘K command palette:
 * open/close (⌘K / Ctrl+K / gop:open-search / Escape), debounced same-origin
 * api-dev search (abortable), focus trap + restore + inert background, the flat
 * navigable rows list, and keyboard nav. Presentational JSX stays in
 * CommandPalette; the sub-rows live in PaletteRows.
 */
export function usePaletteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [suggested, setSuggested] = useState<Hit[]>([]);
  const [recent, setRecent] = useState<RecentPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  /* ── Open / close wiring (⌘K toggle, event, Escape) ──────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Ignore IME commit/cancel so composing CJK text doesn't close it.
      if (e.key === "Escape" && !isComposing(e)) setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("gop:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("gop:open-search", onOpen);
    };
  }, []);

  /* ── On open: scroll-lock, focus, inert background, load data ─────── */
  useEffect(() => {
    if (!open) {
      setMounted(false);
      setQuery("");
      setResults([]);
      setActive(0);
      return;
    }
    // Remember what had focus so we can restore it on close.
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Make every top-level sibling of the palette root inert (a11y: the
    // page behind a modal must not be reachable by AT or Tab). The palette
    // is the last child of <body>; we skip its own root element.
    const inerted: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === rootRef.current) continue;
      const node = el as HTMLElement;
      inerted.push(node);
      node.dataset.gopPrevInert = node.inert ? "1" : "0";
      node.inert = true;
    }

    requestAnimationFrame(() => {
      setMounted(true);
      inputRef.current?.focus();
    });
    setRecent(loadRecentPrompts());

    const controller = new AbortController();
    fetchSearch("", controller.signal)
      .then((j) => setSuggested(j.suggested ?? []))
      .catch(() => setSuggested([]));

    return () => {
      document.body.style.overflow = prevOverflow;
      controller.abort();
      // Restore inert state on the background siblings.
      for (const node of inerted) {
        node.inert = node.dataset.gopPrevInert === "1";
        delete node.dataset.gopPrevInert;
      }
      // Restore focus to whatever was focused before opening.
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
      restoreRef.current = null;
    };
  }, [open]);

  /* ── Debounced search (abortable — no stale-response overwrite) ───── */
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setActive(0);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const json = await fetchSearch(q, controller.signal);
        setResults((json.results ?? []) as Hit[]);
        setActive(0);
        setLoading(false);
      } catch (err) {
        // An aborted (superseded) request must never touch state.
        if ((err as Error)?.name === "AbortError") return;
        setResults([]);
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  const searching = query.trim().length > 0;

  /* Flat list of navigable rows. Recent + suggested when idle; results
   * when searching. */
  const rows = useMemo<Hit[]>(() => {
    if (searching) return results;
    const rec: Hit[] = recent.map((r) => ({ ...r, id: `recent-${r.slug}` }));
    const recentSlugs = new Set(recent.map((r) => r.slug));
    return [...rec, ...suggested.filter((s) => !recentSlugs.has(s.slug))];
  }, [searching, results, recent, suggested]);

  const recentCount = searching ? 0 : recent.length;

  // Clamp active into range for render + Enter (never -1 / out of range).
  const activeIndex = rows.length ? Math.min(active, rows.length - 1) : -1;

  /** The canonical prompt URL for a hit (rows are real links to this). */
  const hrefFor = useCallback((hit: Hit | RecentPrompt) => `/prompt-library/${hit.slug}`, []);

  /** Keyboard Enter: navigate + remember + close (no anchor click involved). */
  const go = useCallback(
    (hit: Hit | RecentPrompt) => {
      rememberRecentPrompt(hit);
      setOpen(false);
      router.push(hrefFor(hit));
    },
    [router, hrefFor],
  );

  /** Plain click on a row's <a>: the Link navigates — we only record it as
   *  recent and close the palette (no router.push, or it double-navigates). */
  const pick = useCallback((hit: Hit | RecentPrompt) => {
    rememberRecentPrompt(hit);
    setOpen(false);
  }, []);

  // Keep the active row in view as the user arrows through.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-row="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, rows.length]);

  const onListKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (rows.length ? Math.min(i + 1, rows.length - 1) : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (rows.length ? Math.max(i - 1, 0) : 0));
      } else if (e.key === "Enter") {
        if (isComposing(e.nativeEvent)) return; // don't navigate on IME commit
        e.preventDefault();
        const hit = activeIndex >= 0 ? rows[activeIndex] : undefined;
        if (hit) go(hit);
      } else if (e.key === "Tab") {
        // Trap focus within the panel; wrap last↔first.
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = getFocusable(panel);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (activeEl === first || !panel.contains(activeEl))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [rows, activeIndex, go],
  );

  return {
    open,
    setOpen,
    mounted,
    query,
    setQuery,
    results,
    recent,
    loading,
    active: activeIndex,
    setActive,
    searching,
    rows,
    recentCount,
    go,
    pick,
    hrefFor,
    onListKey,
    inputRef,
    listRef,
    panelRef,
    rootRef,
  };
}
