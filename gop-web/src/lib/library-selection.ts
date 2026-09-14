import { canonicalHref, type Selection } from "@/lib/taxonomy-graph";

/**
 * The library's active filter selection — the shared shape that drives the
 * title, the active sidebar rows, the chips, and the grid query. Each facet
 * carries both slug (for URLs/queries) and name (for display).
 *
 * Facet links stay SEO-safe: hrefs are built with `canonicalHref` so every
 * row/chip points at a real canonical page (single-axis hub or the minted
 * tool×role combo); axes without a minted combo collapse to the closest hub.
 */

export type Facetish = { slug: string; name: string };

export type LibrarySelection = {
  category?: Facetish;     // root category
  subcategory?: Facetish;  // child category (a category with a parent)
  tool?: Facetish;
  role?: Facetish;
  format?: Facetish;       // { slug: "text" | "image" }
  search?: string;
};

export type FacetAxis = "category" | "subcategory" | "tool" | "role" | "format";

/** Selection → the taxonomy-graph Selection used by canonicalHref. */
function toGraph(sel: LibrarySelection): Selection {
  return {
    tool: sel.tool?.slug,
    role: sel.role?.slug,
    // a subcategory is just a category with a parent — both filter via /category/[slug]
    category: sel.subcategory?.slug ?? sel.category?.slug,
    type: sel.format?.slug,
  };
}

export function hrefForSelection(sel: LibrarySelection): string {
  return canonicalHref(toGraph(sel));
}

/** URL after ADDING/REPLACING a facet on an axis. */
export function hrefWith(sel: LibrarySelection, axis: FacetAxis, item: Facetish): string {
  return canonicalHref(toGraph({ ...sel, [axis]: item }));
}

/** URL after REMOVING a facet (dropping a chip). Clearing a root category
 *  clears its subcategory too. */
export function hrefWithout(sel: LibrarySelection, axis: FacetAxis): string {
  const next: LibrarySelection = { ...sel };
  delete next[axis];
  if (axis === "category") delete next.subcategory;
  return canonicalHref(toGraph(next));
}

/** The /api/prompts query params for the current selection (load-more/sort). */
export function selectionQuery(sel: LibrarySelection): Record<string, string> {
  const q: Record<string, string> = {};
  // Root and subcategory are DISJOINT backend filters (categorySlug matches
  // roots only). Collapsing both into `cat` meant a subcategory selection was
  // sent as categorySlug and matched nothing.
  if (sel.subcategory) q.subCat = sel.subcategory.slug;
  else if (sel.category) q.cat = sel.category.slug;
  if (sel.tool) q.tool = sel.tool.slug;
  if (sel.role) q.role = sel.role.slug;
  if (sel.format) q.type = sel.format.slug;
  if (sel.search) q.search = sel.search;
  return q;
}
