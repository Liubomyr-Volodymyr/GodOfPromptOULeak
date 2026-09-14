import CategoryIconBar from "./CategoryIconBar";
import SubcategoryChips from "./SubcategoryChips";
import PseoHeaderAndResults from "./PseoHeaderAndResults";
import PseoSeoSections from "./PseoSeoSections";
import type { LibrarySelection } from "@/lib/library-selection";
import type { Facets, Prompt } from "@/lib/api";

/**
 * PseoLibraryView — THE combinatoric programmatic-SEO template (Figma
 * 1434:16236), one parameterised layout for every facet-combination route:
 *
 *   /category/[slug] (+ /for/[audience])   /tool/[slug] (+ /[category],
 *   /for/[role])   /for/[audience]   /type/[type] (+ /for/[audience])
 *
 * Vertical rhythm at 1440 (from the frame): H1 → 48 → category icon rail
 * (+ ⌘K search inside the shared bar) → 64 → seeded filter row → 36 →
 * card grid → 64 → accordion SEO body. Content column is 1200px.
 * The page wrapper stays transparent — only cards carry surface colors.
 */
export default function PseoLibraryView({
  selection,
  prompts,
  total,
  facets,
  formatTotals,
  deck,
}: {
  selection: LibrarySelection;
  prompts: Prompt[];
  /** output-type slug -> true total within this route (see PseoHeaderAndResults). */
  formatTotals?: Record<string, number | null>;
  // `null` when a real total isn't available (output-type pages) — the H1
  // omits the count rather than fabricate one; pagination and SEO prose fall
  // back to the rendered page size.
  total: number | null;
  facets: Facets | null;
  /** One-line description rendered under the H1 (tool pages). */
  deck?: string | null;
}) {
  // On a category route the subcategory chips sit directly under the H1 —
  // after the page has said what it is, before the grid they filter. The root
  // icon rail stays below the results, as the way back out to the library.
  const subSlug = selection.subcategory?.slug ?? selection.category?.slug;

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6 pb-20 pt-14 max-[640px]:px-4 max-[640px]:pb-12 max-[640px]:pt-8">
      <PseoHeaderAndResults
        selection={selection}
        facets={facets}
        prompts={prompts}
        total={total}
        formatTotals={formatTotals}
        deck={deck}
        subnav={subSlug ? <SubcategoryChips slug={subSlug} /> : undefined}
      />

      <div className="mt-12 max-[640px]:mt-8">
        <CategoryIconBar activeSlug={selection.category?.slug} showSearch />
      </div>

      <div className="mt-16 max-[900px]:mt-12">
        <PseoSeoSections selection={selection} total={total} />
      </div>
    </div>
  );
}
