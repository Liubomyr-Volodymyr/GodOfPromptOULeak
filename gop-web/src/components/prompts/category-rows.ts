import { getRootCategories, getSubcategories } from "@/lib/categories";
import { hrefWith, hrefWithout, type LibrarySelection } from "@/lib/library-selection";
import { facetCount, type Facets } from "@/lib/api";
import type { CategoryDropRow, DropdownRow } from "./FilterDropdowns";

/**
 * Rows for the Category dropdown — roots, each with its subcategories nested
 * underneath (Figma x-gop-design-system 1725:7425).
 *
 * Lives here rather than inside LibraryView because BOTH category dropdowns
 * need it. The hub rendered the designed panel while every pSEO page
 * (/category, /tool, /for, /type) fell back to a flat list with no roots, no
 * icons and no counts — the same filter, two different shapes, depending on
 * which page you happened to be on.
 *
 * COUNTS come from the taxonomy snapshot, which holds a real per-term total.
 * `facets` still wins when present: once the backend ships /api/library/facets
 * those numbers narrow by the OTHER active filters, which a static snapshot
 * cannot do. Until then the snapshot count is honest on its own terms — it is
 * the number of prompts that term has, which is what the panel claims.
 */
export function buildCategoryRows(
  selection: LibrarySelection,
  facets: Facets | null,
): CategoryDropRow[] {
  return getRootCategories().map((root) => {
    const rootItem = { slug: root.slug, name: root.name };
    const active = selection.category?.slug === root.slug && !selection.subcategory;
    const withRoot: LibrarySelection = { ...selection, category: rootItem, subcategory: undefined };

    const subs: DropdownRow[] = getSubcategories(root.slug).map((sub) => {
      const subActive = selection.subcategory?.slug === sub.slug;
      return {
        slug: sub.slug,
        name: sub.name,
        href: subActive
          ? hrefWithout(selection, "subcategory")
          : hrefWith(withRoot, "subcategory", { slug: sub.slug, name: sub.name }),
        count: facetCount(facets?.subcategories, sub.slug) ?? sub.count,
        active: subActive,
      };
    });

    return {
      slug: root.slug,
      name: root.name,
      href: active ? hrefWithout(selection, "category") : hrefWith(selection, "category", rootItem),
      count: facetCount(facets?.subcategories, root.slug) ?? root.count,
      active,
      subs,
    };
  });
}
