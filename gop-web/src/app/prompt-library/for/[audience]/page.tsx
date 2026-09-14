import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { getRoleBySlug, getRoles } from "@/lib/roles";
import { getPromptsPage, getPrompts, getFacets } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/for/[audience] — "AI prompts for [profession]".
 *
 * The audience axis: the high buyer-intent, Western-converting pattern from
 * the SEO/GEO analysis ("[anything] for [profession]"), where chatgpt.com and
 * the .edu sites don't compete. Audiences are a curated taxonomy (lib/roles).
 * Per-prompt audience tags aren't live yet → getPromptsByRole falls back to
 * the popular set as a stand-in. Self-canonical, one H1, breadcrumb JSON-LD.
 */
export const revalidate = 300;

type Params = { audience: string };

export function generateStaticParams() {
  return getRoles().map((r) => ({ audience: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { audience } = await params;
  const r = getRoleBySlug(audience);
  if (!r) return { title: "Prompts" };
  return {
    title: pseoTitle({ role: { slug: audience, name: r.name } }),
    description: `Engineered prompts for ${r.name}: copy, customize, and run them in ChatGPT, Claude, Gemini and more.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/for/${audience}` },
  };
}

export default async function AudiencePage({ params }: { params: Promise<Params> }) {
  const { audience } = await params;
  const r = getRoleBySlug(audience);
  if (!r) notFound();

  // facets + the role feed are independent → fetch in parallel (one round-trip
  // instead of two). The feed is server-filtered by audienceTypeSlug and its
  // meta.total is the REAL audience count. Popular fallback only when the role
  // feed is empty — and then the count is null (we omit it rather than pass off
  // a popular-set size as the audience total).
  const [facets, rolePage] = await Promise.all([
    getFacets({ audienceTypeSlug: audience }),
    getPromptsPage({ audienceTypeSlug: audience, limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
  ]);
  const hasRolePrompts = rolePage.prompts.length > 0;
  const prompts = hasRolePrompts
    ? rolePage.prompts
    : await getPrompts({ limit: 36, sort: "views_count", order: "DESC" });
  const total = facets?.total ?? (hasRolePrompts ? rolePage.total : null);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `Prompts for ${r.name}`, item: `${SITE_ORIGIN}/prompt-library/for/${audience}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PseoLibraryView
        selection={{ role: { slug: audience, name: r.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
