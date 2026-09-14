import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { getCategoryBySlug } from "@/lib/categories";
import { getPromptsPage, getPromptsByCategory, getFacets, getToolBySlug } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/tool/[slug]/[category] — Tool × Category combo
 * ("ChatGPT prompts for marketing"). A BUILD combo (classic, real demand).
 * Self-canonical, one H1, 3-level breadcrumb. Tool×Type is intentionally NOT
 * a route (tools are modality-locked); the audience combos use /for/.
 */
export const revalidate = 300;

type Params = { slug: string; category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, category } = await params;
  const tool = (await getToolBySlug(slug))?.name;
  const cat = getCategoryBySlug(category);
  if (!tool || !cat) return { title: "Prompts" };
  return {
    title: pseoTitle({ tool: { slug, name: tool }, category: { slug: cat.slug, name: cat.name } }),
    description: `Engineered ${tool} prompts for ${cat.name}: copy, customize, and run.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/tool/${slug}/${category}` },
  };
}

export default async function ToolCategoryPage({ params }: { params: Promise<Params> }) {
  const { slug, category } = await params;
  const tool = (await getToolBySlug(slug))?.name;
  const cat = getCategoryBySlug(category);
  if (!tool || !cat) notFound();

  // Independent fetches → one round-trip (matches the sibling combo routes).
  const [facets, combo] = await Promise.all([
    getFacets({ tools: [slug], categorySlug: cat.slug }),
    getPromptsPage({ tools: [slug], categorySlug: cat.slug, limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
  ]);
  const hasCombo = combo.prompts.length > 0;
  // Empty Tool × Category → show the category set as a stand-in, but omit the
  // count (null) instead of rendering "0" over a non-empty fallback grid.
  const prompts = hasCombo ? combo.prompts : await getPromptsByCategory(cat.slug, 36);
  const total: number | null = facets?.total ?? (hasCombo ? combo.total : null);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `${tool} Prompts`, item: `${SITE_ORIGIN}/prompt-library/tool/${slug}` },
      { "@type": "ListItem", position: 3, name: `${tool} Prompts for ${cat.name}`, item: `${SITE_ORIGIN}/prompt-library/tool/${slug}/${category}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PseoLibraryView
        selection={{ tool: { slug, name: tool }, category: { slug: cat.slug, name: cat.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
