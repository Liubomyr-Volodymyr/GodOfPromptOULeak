import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { getRoleBySlug } from "@/lib/roles";
import { getPromptsByType, getFacets } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/type/[type]/for/[audience] — Type × Audience combo
 * ("text prompts for lawyers"). A BUILD combo (clean, buyer-intent). Output
 * type is the live filter; per-prompt audience tags aren't live yet, so the
 * type-filtered set stands in. Self-canonical, one H1, 3-level breadcrumb.
 */
export const revalidate = 300;

const TYPES: Record<string, { id: number; name: string }> = {
  text: { id: 1, name: "Text" },
  image: { id: 2, name: "Image" },
};

type Params = { type: string; audience: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { type, audience } = await params;
  const t = TYPES[type];
  const r = getRoleBySlug(audience);
  if (!t || !r) return { title: "Prompts" };
  return {
    title: pseoTitle({
      format: { slug: type, name: t.name },
      role: { slug: audience, name: r.name },
    }),
    description: `Engineered ${t.name.toLowerCase()} prompts for ${r.name}: copy, customize, and run.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/type/${type}/for/${audience}` },
  };
}

export default async function TypeAudiencePage({ params }: { params: Promise<Params> }) {
  const { type, audience } = await params;
  const t = TYPES[type];
  const r = getRoleBySlug(audience);
  if (!t || !r) notFound();

  const [prompts, facets] = await Promise.all([
    getPromptsByType(type, 36),
    getFacets({ outputType: type, audienceTypeSlug: audience }),
  ]);
  // Output type isn't a server-side filter, so a true Type × Audience count
  // can't be computed until the facets endpoint ships → omit the count (null)
  // rather than pass off the fetch-limit as a total.
  const total = facets?.total ?? null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `${t.name} Prompts`, item: `${SITE_ORIGIN}/prompt-library/type/${type}` },
      { "@type": "ListItem", position: 3, name: `${t.name} Prompts for ${r.name}`, item: `${SITE_ORIGIN}/prompt-library/type/${type}/for/${audience}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PseoLibraryView
        selection={{ format: { slug: type, name: t.name }, role: { slug: audience, name: r.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
