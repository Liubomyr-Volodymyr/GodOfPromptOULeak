import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import {
  getCategoryBySlug,
  mintableCategories,
  parentOf,
  filterFor,
  isThin,
  getPromptedOutputTypes,
  type Category,
} from "@/lib/categories";
import { pageRobots } from "@/lib/seo/robots";
import { getPromptsPage, getFacets, getOutputTypeCountForCategory } from "@/lib/api";
import type { LibrarySelection } from "@/lib/library-selection";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/category/[slug] — prompts filtered by category.
 *
 * ONE ROUTE, TWO DEPTHS: roots (`/category/finance`) and subcategories
 * (`/category/financial-modeling`) share this flat namespace. Slugs are
 * globally unique, so the tree lives in the breadcrumb rather than the path —
 * `for` stays unambiguous as a route segment, and no subcategory URL needs a
 * redirect when it moves between parents.
 *
 * THE FILTER IS NOT THE SAME FOR BOTH. `categorySlug` matches roots only;
 * a subcategory must query `subCategorySlug`. This page previously sent
 * `categorySlug` for every slug, so all 142 subcategory pages returned zero
 * prompts. `filterFor()` picks the right one.
 *
 * Self-canonical, one H1, breadcrumb JSON-LD that always names the parent.
 */
export const revalidate = 300;

type Params = { slug: string };

export function generateStaticParams() {
  // Roots + subcategories clearing the substance floor (see MIN_PROMPTS_FOR_PAGE).
  return mintableCategories().map((c) => ({ slug: c.slug }));
}

/** Root → {category}; subcategory → {category: parent, subcategory}. */
function selectionFor(cat: Category): LibrarySelection {
  const parent = parentOf(cat.slug);
  return parent
    ? { category: { slug: parent.slug, name: parent.name }, subcategory: { slug: cat.slug, name: cat.name } }
    : { category: { slug: cat.slug, name: cat.name } };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Prompts" };
  const parent = parentOf(slug);
  // A subcategory says what it's part of — "…prompts for Finance" — so the
  // snippet carries the parent keyword too instead of repeating the H1.
  const desc = parent
    ? `Engineered ${cat.name} prompts for ChatGPT, Claude, Gemini and more — part of the ${parent.name} library. Copy, customize, and run.`
    : `Engineered ${cat.name} prompts for ChatGPT, Claude, Gemini and more — copy, customize, and run.`;
  return {
    title: pseoTitle(selectionFor(cat)),
    description: desc,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/category/${slug}` },
    // A page below the floor renders and links out, but doesn't ask to rank.
    // Both branches go through pageRobots so the environment gate still wins:
    // on dev everything is noindex,nofollow, and a thin page must not end up
    // LESS restricted than a normal one.
    robots: pageRobots({ index: !isThin(slug), follow: true }),
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const filter = filterFor(cat);

  const [{ prompts, total }, facets] = await Promise.all([
    getPromptsPage({ ...filter, limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
    getFacets(filter),
  ]);

  const selection = selectionFor(cat);

  // True "N Text/Image Prompts for <category>" for the format toggle. Read
  // from the cached corpus scan (same pass as the /type page counts), so the
  // H1 shows a real number instead of the unfiltered category total. The scan
  // tallies subcategory slugs alongside roots, so this is exact at both depths.
  const types = getPromptedOutputTypes();
  const counts = await Promise.all(types.map((t) => getOutputTypeCountForCategory(t.slug, slug)));
  const formatTotals = Object.fromEntries(types.map((t, i) => [t.slug, counts[i]]));

  const parent = parentOf(slug);
  const trail = [
    { name: "Prompts", url: `${SITE_ORIGIN}/prompt-library` },
    ...(parent ? [{ name: parent.name, url: `${SITE_ORIGIN}/prompt-library/category/${parent.slug}` }] : []),
    { name: cat.name, url: `${SITE_ORIGIN}/prompt-library/category/${slug}` },
  ];
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: t.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <PseoLibraryView
        selection={selection}
        prompts={prompts}
        total={total}
        facets={facets}
        formatTotals={formatTotals}
      />
    </>
  );
}
