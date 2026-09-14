import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { getCategoryBySlug } from "@/lib/categories";
import { getRoleBySlug } from "@/lib/roles";
import { getPromptsPage, getPromptsByCategory, getFacets } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/category/[slug]/for/[audience] — Category × Audience combo
 * ("marketing prompts for lawyers"). A BUILD combo (buyer-intent). Deduped:
 * when category.slug === audience.slug it's redundant ("lawyers prompts for
 * lawyers") → redirect to the audience page. Category is the live filter;
 * audience tags aren't live yet, so the category set stands in.
 */
export const revalidate = 300;

type Params = { slug: string; audience: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, audience } = await params;
  const cat = getCategoryBySlug(slug);
  const r = getRoleBySlug(audience);
  if (!cat || !r) return { title: "Prompts" };
  return {
    title: pseoTitle({
      category: { slug: cat.slug, name: cat.name },
      role: { slug: audience, name: r.name },
    }),
    description: `Engineered ${cat.name} prompts for ${r.name}: copy, customize, and run.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/category/${slug}/for/${audience}` },
  };
}

export default async function CategoryAudiencePage({ params }: { params: Promise<Params> }) {
  const { slug, audience } = await params;
  const cat = getCategoryBySlug(slug);
  const r = getRoleBySlug(audience);
  if (!cat || !r) notFound();
  // Dedup: "lawyers prompts for lawyers" is redundant → the audience page.
  if (cat.slug === audience) permanentRedirect(`/prompt-library/for/${audience}`);

  // The feed filters by categorySlug AND audienceTypeSlug together, so
  // meta.total is the REAL Category × Audience count. Fall back to the
  // category-only set (count omitted) only when the combo is empty.
  const [facets, comboPage] = await Promise.all([
    getFacets({ categorySlug: cat.slug, audienceTypeSlug: audience }),
    getPromptsPage({ categorySlug: cat.slug, audienceTypeSlug: audience, limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
  ]);
  const hasCombo = comboPage.prompts.length > 0;
  const prompts = hasCombo ? comboPage.prompts : await getPromptsByCategory(cat.slug, 36);
  const total = facets?.total ?? (hasCombo ? comboPage.total : null);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `${cat.name} Prompts`, item: `${SITE_ORIGIN}/prompt-library/category/${slug}` },
      { "@type": "ListItem", position: 3, name: `${cat.name} Prompts for ${r.name}`, item: `${SITE_ORIGIN}/prompt-library/category/${slug}/for/${audience}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PseoLibraryView
        selection={{ category: { slug: cat.slug, name: cat.name }, role: { slug: audience, name: r.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
