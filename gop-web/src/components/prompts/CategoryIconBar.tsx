import CategoryRail from "@/components/blocks/CategoryRail";

/**
 * CategoryIconBar — the prompt library's configured instance of the shared
 * CategoryRail block: tiles link to /prompt-library/category/[slug], "More"
 * goes to the full browse (/prompt-library/all), and the combinatoric pages
 * append the "Search ⌘K" pill (`showSearch`). All the visuals live in the
 * block (@/components/blocks/CategoryRail) so guides and future pages reuse
 * them instead of re-implementing the rail.
 */
export default function CategoryIconBar({
  activeSlug,
  showSearch = false,
}: {
  activeSlug?: string;
  showSearch?: boolean;
}) {
  return (
    <CategoryRail
      activeSlug={activeSlug}
      hrefFor={(slug) => `/prompt-library/category/${slug}`}
      moreHref="/prompt-library/all"
      showSearch={showSearch}
    />
  );
}
