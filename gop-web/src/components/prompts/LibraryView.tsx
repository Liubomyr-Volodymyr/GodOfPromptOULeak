import type { ReactNode } from "react";
import type { Prompt, Facets, Facet } from "@/lib/api";
import { getRoles } from "@/lib/roles";
import { getPromptedOutputTypes } from "@/lib/categories";
import {
  hrefWith, hrefWithout, selectionQuery,
  type LibrarySelection, type FacetAxis, type Facetish,
} from "@/lib/library-selection";
import { getToolFacets } from "@/lib/api";
import { facetEnabled, type Axis, type Selection } from "@/lib/taxonomy-graph";
import CategoryIconBar from "./CategoryIconBar";
import LibraryTitle from "./LibraryTitle";
import LibrarySearchButton from "./LibrarySearchButton";
import ActiveFilterChips from "./ActiveFilterChips";
import LibraryResults from "./LibraryResults";
import type { LibraryDropdownData, DropdownRow } from "./FilterDropdowns";
import { buildCategoryRows } from "./category-rows";

/**
 * LibraryView — the unified library layout (Figma 1617:13017). Powers both
 * the /prompt-library hub (empty selection) and every filtered SEO page:
 * hero (headline / dynamic title + tagline + ⌘K search pill), category icon
 * rail, then the filter row + card mosaic. Dropdown rows are built here on
 * the server as real <Link>s (crawlable); the client only owns open/close,
 * sort, and paging. Counts come from `facets` (null until the backend
 * endpoint is live → rows render without numbers).
 */

const AXIS_MAP: Record<FacetAxis, Axis> = {
  category: "category",
  subcategory: "category",
  tool: "tool",
  role: "role",
  format: "type",
};

/** Rows for one flat facet axis: toggle-aware hrefs, counts, and the
 *  Tool↔Type modality lock. When the facets endpoint is live its list IS
 *  the "has prompts here" set, so it replaces the static fallback. */
function buildRows(
  selection: LibrarySelection,
  graphSel: Selection,
  axis: FacetAxis,
  facetList: Facet[] | undefined,
  fallback: Facetish[],
  activeSlug: string | undefined,
): DropdownRow[] {
  const items: Array<Facetish & { count: number | null }> =
    facetList && facetList.length
      ? facetList.map((f) => ({ slug: f.slug, name: f.name, count: f.count }))
      : fallback.map((f) => ({ slug: f.slug, name: f.name, count: null }));

  return items.map((item) => {
    const active = item.slug === activeSlug;
    const disabled = !active && !facetEnabled(AXIS_MAP[axis], item.slug, graphSel);
    return {
      slug: item.slug,
      name: item.name,
      href: active ? hrefWithout(selection, axis) : hrefWith(selection, axis, item),
      count: item.count,
      active,
      disabled,
    };
  });
}


/** All / Text / Image rows for the format toggle. */
function buildFormatRows(selection: LibrarySelection, graphSel: Selection, facets: Facets | null): DropdownRow[] {
  const rows = buildRows(
    selection, graphSel, "format",
    // Every backend output type with >=1 prompt (was text+image literals).
    facets?.formats, getPromptedOutputTypes().map((t) => ({ slug: t.slug, name: t.name })),
    selection.format?.slug,
  );
  const all: DropdownRow = {
    slug: "all",
    name: "All",
    href: hrefWithout(selection, "format"),
    count: null,
    active: !selection.format,
  };
  return [all, ...rows];
}

export default async function LibraryView({
  selection,
  prompts,
  total,
  facets,
  heading,
  headingAccent,
  tagline,
  seoBelow,
}: {
  selection: LibrarySelection;
  prompts: Prompt[];
  total: number;
  facets: Facets | null;
  /** Fixed h1 phrase (the hub's SEO head term) — overrides the dynamic title. */
  heading?: string;
  /** Optional italic-emphasis tail of the fixed h1 (Figma "Open Prompt Library"). */
  headingAccent?: string;
  /** Muted subline under the h1 (hub only). */
  tagline?: string;
  seoBelow?: ReactNode;
}) {
  // Graph selection (for the Tool↔Type modality lock on facet rows).
  const graphSel: Selection = {
    tool: selection.tool?.slug,
    role: selection.role?.slug,
    category: (selection.subcategory ?? selection.category)?.slug,
    type: selection.format?.slug,
  };

  // Tool options come from the backend `tools` collection (all of them), not
  // a hardcoded list — falls back to whatever's cached; empty is harmless.
  const toolFacets = await getToolFacets();

  const dropdowns: LibraryDropdownData = {
    categories: buildCategoryRows(selection, facets),
    models: buildRows(selection, graphSel, "tool", facets?.models, toolFacets, selection.tool?.slug),
    roles: buildRows(
      selection, graphSel, "role",
      facets?.roles, getRoles().map((r) => ({ slug: r.slug, name: r.name })),
      selection.role?.slug,
    ),
  };
  const formats = buildFormatRows(selection, graphSel, facets);

  return (
    <div className="mx-auto w-full max-w-[1232px] px-4 py-10 sm:px-6 max-[640px]:py-6">
      {/* Hero: h1 + tagline + ⌘K search pill (Figma 1617:23115) */}
      <div className="mb-8 flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2.5">
          <LibraryTitle total={total} selection={selection} heading={heading} headingAccent={headingAccent} />
          {tagline && (
            <p className="m-0 mx-auto max-w-[520px] text-[14px] leading-5 text-[#A8A7A8]">{tagline}</p>
          )}
        </div>
        <div className="flex w-full justify-center">
          <LibrarySearchButton />
        </div>
      </div>

      {/* Category icon rail (Figma 1617:13029) */}
      <div className="mb-9 max-[640px]:mb-6">
        <CategoryIconBar activeSlug={selection.category?.slug} />
      </div>

      {/* Filter row + mosaic + pagination */}
      <LibraryResults
        initial={prompts}
        total={total}
        query={selectionQuery(selection)}
        chipsSlot={<ActiveFilterChips selection={selection} />}
        dropdowns={dropdowns}
        formats={formats}
      />

      {/* SEO editorial / FAQ (hub only) */}
      {seoBelow && <div className="mt-16">{seoBelow}</div>}
    </div>
  );
}
