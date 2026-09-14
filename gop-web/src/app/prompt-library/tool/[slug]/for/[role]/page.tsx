import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { getPromptsPage, getPromptsByTool, getFacets, getToolBySlug } from "@/lib/api";
import { getRoleBySlug } from "@/lib/roles";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/tool/[slug]/for/[role] — the flagship Audience × Tool
 * combo page ("ChatGPT Prompts for Solopreneurs"). Dynamic H1, dynamic
 * count, breadcrumb back to the tool hub. Tool resolved from the backend
 * `tools` collection, so every tool's audience combos work.
 */
export const revalidate = 300;

type Params = { slug: string; role: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, role } = await params;
  const tool = (await getToolBySlug(slug))?.name;
  const r = getRoleBySlug(role);
  if (!tool || !r) return { title: "Prompts" };
  return {
    title: pseoTitle({ tool: { slug, name: tool }, role: { slug: role, name: r.name } }),
    description: `Engineered ${tool} prompts built for ${r.name}: copy, paste, done.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/tool/${slug}/for/${role}` },
  };
}

export default async function ToolRoleComboPage({ params }: { params: Promise<Params> }) {
  const { slug, role } = await params;
  const tool = (await getToolBySlug(slug))?.name;
  const r = getRoleBySlug(role);
  if (!tool || !r) notFound();

  // The feed filters by tool AND audienceTypeSlug together, so meta.total is
  // the REAL Tool × Audience count. The combo can be empty → fall back to the
  // tool's prompts as a stand-in (count omitted) so the page isn't barren.
  const [facets, comboPage] = await Promise.all([
    getFacets({ tools: [slug], audienceTypeSlug: role }),
    getPromptsPage({ tools: [slug], audienceTypeSlug: role, limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
  ]);
  const hasCombo = comboPage.prompts.length > 0;
  const prompts = hasCombo ? comboPage.prompts : await getPromptsByTool(slug, 36);
  const total = facets?.total ?? (hasCombo ? comboPage.total : null);

  const title = `${tool} Prompts for ${r.name}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `${tool} Prompts`, item: `${SITE_ORIGIN}/prompt-library/tool/${slug}` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE_ORIGIN}/prompt-library/tool/${slug}/for/${role}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PseoLibraryView
        selection={{ tool: { slug, name: tool }, role: { slug: role, name: r.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
