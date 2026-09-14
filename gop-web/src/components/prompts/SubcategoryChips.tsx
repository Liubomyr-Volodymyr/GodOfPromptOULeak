import ChipRotator, { type Chip } from "@/components/blocks/ChipRotator";
import { getSubcategories, parentOf, MIN_PROMPTS_FOR_PAGE } from "@/lib/categories";

/**
 * SubcategoryChips — the children of the active category, as one rotating line.
 *
 * Subcategories are the specific head terms in the library ("Ad Copy",
 * "Financial Modeling", "Portrait & Avatar") and were reachable only through a
 * dropdown. This is the homepage chip row (blocks/ChipRotator) pointed at the
 * relevant slice of the taxonomy: one line, same rhythm, chips cycling in and
 * out so a category with 16 children shows them all over time instead of
 * wrapping into a block.
 *
 * Shown on a root category page (its children) AND on a subcategory page (its
 * siblings) — so you can move sideways within a topic without going back up.
 *
 * Interactive mode: these chips ARE the navigation, so unlike the homepage they
 * are focusable, open in the same tab, and mark the current page. The two chips
 * that must never rotate away — "All <parent>" and the page you're on — are
 * pinned to the front.
 *
 * Chips are NOT gated on MIN_PROMPTS_FOR_PAGE. That floor decides what earns an
 * indexable page; a page that exists should still be reachable by someone
 * browsing the topic. Small children carry their count so the size is honest
 * before the click.
 */
export default function SubcategoryChips({ slug }: { slug: string }) {
  // On a subcategory page the useful row is its siblings, not its (empty) children.
  const parent = parentOf(slug);
  const rootSlug = parent?.slug ?? slug;
  const siblings = getSubcategories(rootSlug);
  if (siblings.length === 0) return null;

  const toChip = (c: { slug: string; name: string; count: number }): Chip => ({
    key: c.slug,
    label: c.name,
    href: `/prompt-library/category/${c.slug}`,
    badge: c.count < MIN_PROMPTS_FOR_PAGE ? c.count : undefined,
  });

  const pinned: Chip[] = [];
  if (parent) {
    // Escape hatch back to the unfiltered parent, mirroring the "All <category>"
    // row the filter dropdown already offers.
    pinned.push({ key: `all:${parent.slug}`, label: `All ${parent.name}`, href: `/prompt-library/category/${parent.slug}` });
    const self = siblings.find((c) => c.slug === slug);
    if (self) pinned.push(toChip(self));
  }

  const pool = siblings.filter((c) => c.slug !== slug).map(toChip);
  if (pool.length === 0) return null;

  const label = parent ? `Browse ${parent.name} subcategories` : "Browse subcategories";

  return (
    <nav aria-label={label}>
      <ChipRotator
        pool={pool}
        pinned={pinned}
        // Leave room for the pinned pair so the line still fits at 1200.
        visible={Math.min(pool.length, pinned.length ? 7 : 9)}
        interactive
        activeKey={slug}
        ariaLabel={label}
      />

      {/* Only `visible` chips are in the markup at any moment, and rotation is
          client-side — so without this the other subcategories would be
          invisible to a crawler, and these pages exist precisely to be found.
          Same pattern the homepage rail uses. */}
      <ul className="sr-only">
        {siblings.map((c) => (
          <li key={c.slug}>
            <a href={`/prompt-library/category/${c.slug}`}>{c.name} prompts</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
