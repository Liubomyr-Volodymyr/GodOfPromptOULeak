"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/components/ui/Link";
import { ChevronDown, Image as ImageIcon, Loader2, Type } from "lucide-react";
import FilterDropdowns, { type LibraryDropdownData, type DropdownRow } from "./FilterDropdowns";
import PromptGrid from "./PromptGrid";
import { GLASS_PANEL } from "@/components/blocks/GlassMenu";
import { fetchPrompts } from "@/lib/api/client";
import type { Prompt } from "@/lib/api";

/**
 * LibraryResults — the hub's filter row + card mosaic with INFINITE SCROLL.
 * The server renders the first page into this component so the cards are in
 * the SSR HTML (crawlable); scrolling appends further batches from
 * api-dev directly (an IntersectionObserver sentinel ~600px ahead, so cards are
 * usually there before the user is). Sort re-queries from the top. No URL
 * change → SEO-safe. Category/Models/Roles dropdowns and the format toggle
 * are real links to canonical pages. The pSEO pages keep the numbered
 * Pagination block; infinite scroll is the hub's browsing mode.
 */

type Sort = "popular" | "newest";
const BATCH = 24;
const SORTS: { key: Sort; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "newest", label: "Newest" },
];

/** Where the "Unlock Full Experience" card sits in the mosaic (after the
 *  5th prompt — the design's row-2, column-1 bottom slot). */
const CTA_AFTER_INDEX = 4;

/** Append-mode prompt feed: batches keyed by the current sort, deduped by
 *  id (popularity can shuffle between requests). */
function useInfinitePrompts(initial: Prompt[], total: number, query: Record<string, string>) {
  const [prompts, setPrompts] = useState<Prompt[]>(initial);
  const [sort, setSortState] = useState<Sort>("popular");
  const [grandTotal, setGrandTotal] = useState(total);
  const [loading, setLoading] = useState(false); // appending
  const [replacing, setReplacing] = useState(false); // sort switch
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  const fetchBatch = useCallback(
    async (offset: number, sortKey: Sort, replace: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setFailed(false);
      (replace ? setReplacing : setLoading)(true);
      try {
        const { prompts: ps, total: t } = await fetchPrompts({
          cat: query.cat,
          tool: query.tool,
          role: query.role,
          type: query.type,
          search: query.search,
          offset,
          limit: BATCH,
          sort: sortKey === "newest" ? "newest" : "popular",
        });
        setPrompts((prev) => {
          if (replace) return ps ?? [];
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...(ps ?? []).filter((x) => !seen.has(x.id))];
        });
        if (t > 0) setGrandTotal(t);
      } catch {
        setFailed(true);
      } finally {
        inFlight.current = false;
        setLoading(false);
        setReplacing(false);
      }
    },
    [query],
  );

  const loadMore = useCallback(() => {
    if (inFlight.current || prompts.length >= grandTotal) return;
    void fetchBatch(prompts.length, sort, false);
  }, [fetchBatch, prompts.length, grandTotal, sort]);

  const setSort = useCallback(
    (s: Sort) => {
      if (s === sort) return;
      setSortState(s);
      void fetchBatch(0, s, true);
    },
    [sort, fetchBatch],
  );

  const done = prompts.length >= grandTotal;
  return { prompts, sort, setSort, grandTotal, loading, replacing, failed, done, loadMore };
}

export default function LibraryResults({
  initial,
  total,
  query,
  chipsSlot,
  dropdowns,
  formats,
}: {
  initial: Prompt[];
  total: number;
  query: Record<string, string>;
  chipsSlot?: ReactNode;
  dropdowns: LibraryDropdownData;
  formats: DropdownRow[];
}) {
  const { prompts, sort, setSort, grandTotal, loading, replacing, failed, done, loadMore } =
    useInfinitePrompts(initial, total, query);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sentinel-driven loading — fires ~600px before the grid's end so the next
  // batch is usually in place before the user reaches it.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done || failed) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && loadMore(),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, done, failed]);

  return (
    // `data-dock-park` only once everything's loaded — while more is streaming
    // in, the sticky dock stays pinned to the viewport bottom so it never jumps
    // as batches append; when done it parks at this region's end.
    <div className="flex flex-col gap-5" data-prompt-dock-boundary {...(done ? { "data-dock-park": "" } : {})}>
      {/* filter row: dropdown pills (left) + sort & format (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 scroll-mt-24">
        <FilterDropdowns data={dropdowns} />
        <div className="flex items-center gap-2">
          <SortPill sort={sort} onSort={setSort} />
          <FormatToggle formats={formats} />
        </div>
      </div>

      {chipsSlot && <div className="-mt-1">{chipsSlot}</div>}

      {/* card mosaic (shared PromptGrid) — dims only while a sort replaces */}
      <PromptGrid prompts={prompts} loading={replacing} ctaAfter={CTA_AFTER_INDEX} animateAppends />

      {/* infinite-scroll foot: sentinel + status (real counts only) */}
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div className="flex min-h-10 items-center justify-center" aria-live="polite">
        {loading && <Loader2 size={18} className="animate-spin text-gop-ink-soft" aria-label="Loading more prompts" />}
        {failed && !loading && (
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex h-9 items-center rounded-full border border-gop-ink-hairline bg-white px-4 text-[14px] font-medium text-gop-ink-muted transition-colors hover:border-gop-ink-faint hover:text-gop-ink"
          >
            Load more
          </button>
        )}
        {done && !loading && grandTotal > BATCH && (
          <p className="m-0 text-[13px] text-gop-ink-soft">
            That&apos;s all {grandTotal.toLocaleString("en-US")} prompts.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── sort pill (Figma 1617:24754) ─────────────────────────────────── */

function SortPill({ sort, onSort }: { sort: Sort; onSort: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const label = SORTS.find((s) => s.key === sort)!.label;

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[14px] leading-5 text-[#4F4E4F] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:text-gop-ink"
      >
        Sort by: <span className="text-gop-ink">{label}</span>
        <ChevronDown size={14} className={`text-gop-dark transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-[29] cursor-default" onClick={() => setOpen(false)} />
          <ul role="listbox" className={`absolute right-0 z-30 mt-1.5 min-w-[150px] list-none ${GLASS_PANEL}`}>
            {SORTS.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.key === sort}
                  onClick={() => { onSort(s.key); setOpen(false); }}
                  className={`flex h-9 w-full items-center rounded-full px-3 text-left text-[14px] transition-colors ${
                    s.key === sort ? "bg-white/[0.16] text-white" : "text-[#F7F7F7] hover:bg-white/[0.08]"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ── format toggle: All / Text / Image (Figma 1617:24662) ─────────── */

function FormatToggle({ formats }: { formats: DropdownRow[] }) {
  const seg = (active: boolean, disabled?: boolean) =>
    [
      "group/fmt inline-flex h-7 items-center rounded-full px-2.5 text-[14px] leading-5 no-underline",
      "transition-[background-color,color,box-shadow] duration-200",
      disabled
        ? "cursor-not-allowed text-gop-ink-faint"
        : active
          ? "bg-white text-gop-ink shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          : "text-gop-ink-muted hover:text-gop-ink",
    ].join(" ");

  // Output-type segments idle as icon-only; the label unrolls on hover and
  // stays out while active (Figma 1617:24662 — only the live segment is
  // expanded). Collapse is visual (max-width) so the name stays in the
  // accessibility tree.
  const unroll = (active: boolean) =>
    [
      "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-200 ease-out",
      active
        ? "ml-1 max-w-[72px] opacity-100"
        : "ml-0 max-w-0 opacity-0 group-hover/fmt:ml-1 group-hover/fmt:max-w-[72px] group-hover/fmt:opacity-100",
    ].join(" ");

  return (
    <div className="inline-flex items-center rounded-full bg-gop-capsule p-0.5" role="group" aria-label="Output format">
      {formats.map((f) => {
        const icon =
          f.slug === "text" ? <Type size={14} strokeWidth={1.9} /> :
          f.slug === "image" ? <ImageIcon size={14} strokeWidth={1.9} /> : null;
        return f.disabled ? (
          <span key={f.slug} className={seg(false, true)} title="Not available with the current selection">
            {icon}
            <span className="sr-only">{f.name}</span>
          </span>
        ) : (
          <Link key={f.slug} href={f.href} aria-current={f.active ? "true" : undefined} className={seg(f.active)}>
            {icon}
            {icon ? <span className={unroll(f.active)}>{f.name}</span> : f.name}
          </Link>
        );
      })}
    </div>
  );
}
