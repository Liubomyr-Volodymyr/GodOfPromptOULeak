"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import PromptGrid from "./PromptGrid";
import Pagination from "@/components/blocks/Pagination";
import PseoFilterRow, { type ClientFormat, type PseoSort } from "./PseoFilterRow";
import { selectionQuery, type LibrarySelection } from "@/lib/library-selection";
import { fetchPrompts } from "@/lib/api/client";
import type { Facets, Prompt } from "@/lib/api";

/**
 * PseoResults — filter row + shared card grid + numbered pagination for the
 * combinatoric pages (Figma 1434:16236). The server renders the first page
 * (crawlable); sort, the free-axis format toggle, and paging re-query
 * api-dev directly with the route facets pinned (no URL change → SEO-safe). The
 * mosaic + in-grid Unlock CTA come from the shared PromptGrid; paging uses
 * the same numbered pager as the hub (LibraryResults).
 */
const BATCH = 24;

export default function PseoResults({
  selection,
  facets,
  initial,
  total,
  clientFormat,
  onClientFormatChange,
}: {
  selection: LibrarySelection;
  facets: Facets | null;
  initial: Prompt[];
  total: number;
  /** Controlled by PseoHeaderAndResults so the H1 reacts to the toggle too. */
  clientFormat: ClientFormat;
  onClientFormatChange: (f: ClientFormat) => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[]>(initial);
  const [sort, setSort] = useState<PseoSort>("popular");
  const [page, setPage] = useState(1);
  const [grandTotal, setGrandTotal] = useState(total);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);


  const fetchPage = useCallback(
    async (pageNo: number, s: PseoSort, fmt: ClientFormat, signal?: AbortSignal) => {
      setLoading(true);
      setFailed(false);
      try {
        const sel = selectionQuery(selection);
        const { prompts: ps, total: t } = await fetchPrompts({
          cat: sel.cat,
          subCat: sel.subCat,
          tool: sel.tool,
          role: sel.role,
          search: sel.search,
          offset: (pageNo - 1) * BATCH,
          limit: BATCH,
          sort: s === "newest" ? "newest" : "popular",
          // Route-pinned format wins (sel.type); otherwise the free-axis toggle.
          type: sel.type ?? (fmt || undefined),
          signal,
        });
        setPrompts(ps ?? []);
        // Don't overwrite the SSR total with the pool-limited type count.
        // Every axis (incl. output type) is a real server filter now, so the
        // returned total IS the corpus count for this narrowing — it used to be
        // a pool-limited tally and had to be ignored when a format was active.
        if (t > 0) setGrandTotal(t);
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return; // superseded re-query
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [selection],
  );

  // Re-query from page 1 when sort or the client-side format changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const ctrl = new AbortController();
    setPage(1);
    void fetchPage(1, sort, clientFormat, ctrl.signal);
    return () => ctrl.abort();
  }, [sort, clientFormat, fetchPage]);

  const onPage = useCallback(
    (p: number) => {
      setPage(p);
      void fetchPage(p, sort, clientFormat);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [fetchPage, sort, clientFormat],
  );

  // No numbered pager for output-type-filtered views (page 2 can't be served).
  const pageCount = Math.max(1, Math.ceil(grandTotal / BATCH));

  return (
    // Paginated (no appends) — dock always parks at this region's end.
    <div className="flex flex-col gap-9 max-[640px]:gap-6" data-prompt-dock-boundary data-dock-park>
      <div ref={topRef} className="scroll-mt-24">
        <PseoFilterRow
          selection={selection}
          facets={facets}
          sort={sort}
          onSortChange={setSort}
          clientFormat={clientFormat}
          onClientFormatChange={onClientFormatChange}
        />
      </div>

      {/* card mosaic (shared PromptGrid) */}
      <PromptGrid prompts={prompts} loading={loading} />

      {/* numbered pagination (the shared block — Figma 1617:22409) + a visible
          retry when a sort/format/page fetch fails (no silent stale grid). */}
      <div className="mt-3 flex min-h-8 items-center justify-center gap-3" aria-live="polite">
        {loading && <Loader2 size={16} className="animate-spin text-gop-ink-soft" aria-label="Loading" />}
        {failed && !loading ? (
          <button
            type="button"
            onClick={() => fetchPage(page, sort, clientFormat)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-gop-ink-hairline bg-white px-4 text-[14px] font-medium text-gop-ink-muted transition-colors hover:border-gop-ink-faint hover:text-gop-ink"
          >
            Couldn&apos;t load — Retry
          </button>
        ) : (
          <Pagination page={page} pageCount={pageCount} onPage={onPage} disabled={loading} ariaLabel="Prompt pages" />
        )}
      </div>
    </div>
  );
}
