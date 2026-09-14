"use client";

import { useState } from "react";
import PseoHeader from "./PseoHeader";
import PseoResults from "./PseoResults";
import type { ClientFormat } from "./PseoFilterRow";
import type { LibrarySelection } from "@/lib/library-selection";
import type { Facets, Prompt } from "@/lib/api";
import { getPromptedOutputTypes } from "@/lib/categories";

/** slug -> display name for every backend output type. A ternary here meant
 *  anything that wasn't "text" was labelled "Image", so a code-filtered grid
 *  would have read "236 Image Prompts". */
const TYPE_NAME: Record<string, string> = Object.fromEntries(
  getPromptedOutputTypes().map((t) => [t.slug, t.name]),
);

/**
 * Owns the format toggle so the H1 and the grid stay in sync.
 *
 * The toggle used to live inside PseoResults, which made the heading a
 * SIBLING of the state — so picking "Text" on /category/education filtered
 * the grid but left the H1 reading "493 AI Prompts for Education". Selecting
 * a format has to change the phrase (qualifier() already swaps "AI" for the
 * format name) AND the number.
 *
 * The count comes from `formatTotals`, computed server-side from the cached
 * corpus scan — the true "N Text Prompts for <category>", not the route total
 * and not the pool-limited length of the current page. When we have no honest
 * number for a combination the count is omitted rather than guessed.
 */
export default function PseoHeaderAndResults({
  selection,
  facets,
  prompts,
  total,
  formatTotals,
  subnav,
  deck,
}: {
  selection: LibrarySelection;
  facets: Facets | null;
  prompts: Prompt[];
  total: number | null;
  /** output-type slug -> true total within this route's facets. */
  formatTotals?: Record<string, number | null>;
  /** Rendered between the H1 and the grid — the subcategory chip row on
   *  category routes. A slot rather than a direct import because this is a
   *  client component and the chips read the taxonomy on the server. */
  subnav?: React.ReactNode;
  /** One-line description under the H1 — the tool's own copy. */
  deck?: string | null;
}) {
  const [clientFormat, setClientFormat] = useState<ClientFormat>("");

  // A route-pinned format (the /type/ pages) always wins over the toggle.
  const active = selection.format ? null : clientFormat || null;

  const shown: LibrarySelection = active
    ? { ...selection, format: { slug: active, name: TYPE_NAME[active] ?? active } }
    : selection;

  const shownTotal = active ? (formatTotals?.[active] ?? null) : total;

  return (
    <>
      <PseoHeader total={shownTotal} selection={shown} />

      {deck && (
        <p className="mx-auto mt-4 mb-0 max-w-[720px] text-center text-[17px] leading-7 text-gop-ink-muted">
          {deck}
        </p>
      )}

      {subnav && <div className="mt-10 max-[640px]:mt-7">{subnav}</div>}

      <div className="mt-16 max-[900px]:mt-10">
        <PseoResults
          selection={selection}
          facets={facets}
          initial={prompts}
          total={total ?? prompts.length}
          clientFormat={clientFormat}
          onClientFormatChange={setClientFormat}
        />
      </div>
    </>
  );
}
