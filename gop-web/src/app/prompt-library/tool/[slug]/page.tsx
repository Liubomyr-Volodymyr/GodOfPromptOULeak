import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { pageRobots } from "@/lib/seo/robots";
import { getPromptsPage, getFacets, getTools, getToolBySlug, toolHasSubstance, type Tool } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/tool/[slug] — the per-tool page. Every AI tool in the
 * backend `tools` collection gets one (all sourced from the API — no
 * hardcoded list), so the set grows as the backend adds tools. Prompts
 * filtered by the tool are ONE section; the page also carries the tool's
 * own resource copy (About / How to use / Best for / Pricing) as the backend
 * fills those fields. Thin pages (no public copy AND no prompts) are noindexed
 * until they have substance — existence is never gated.
 */
export const revalidate = 3600;
export const dynamicParams = true; // new backend tools resolve without a rebuild

type Params = { slug: string };

export async function generateStaticParams() {
  const tools = await getTools();
  return tools.map((t) => ({ slug: t.slug }));
}

const CANON = (slug: string) => `${SITE_ORIGIN}/prompt-library/tool/${slug}`;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Prompts" };

  // Same query the page renders → Next dedupes it to a single fetch (no extra
  // API hit just to decide indexability).
  const total =
    (await getPromptsPage({ tools: [slug], limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }).catch(
      () => null,
    ))?.total ?? 0;
  const indexable = toolHasSubstance(tool, total);

  return {
    title: tool.title ?? pseoTitle({ tool: { slug, name: tool.name } }),
    description:
      tool.seoDescription ??
      tool.description ??
      `Engineered, ready-to-run prompts for ${tool.name} — copy, customize and run.`,
    alternates: { canonical: CANON(slug) },
    // Don't index a tool page until it has real copy or prompts.
    // `undefined` here OVERRODE the layout's site-wide noindex instead of
    // inheriting it, so all 50 tool pages were indexable on the dev deploy
    // while every other page was noindex. pageRobots() applies the env gate;
    // the thin-page case stays noindex regardless of environment.
    robots: indexable ? pageRobots({ index: true, follow: true }) : { index: false, follow: true },
  };
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const [{ prompts, total }, facets] = await Promise.all([
    getPromptsPage({ tools: [slug], limit: 36, sort: "views_count", order: "DESC", revalidate: 300 }),
    getFacets({ tools: [slug] }),
  ]);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: `${tool.name} Prompts`, item: CANON(slug) },
    ],
  };
  // SoftwareApplication only when we actually have a URL/description to assert.
  const appLd =
    tool.url || tool.description
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "AIApplication",
          ...(tool.url ? { url: tool.url } : {}),
          ...(tool.description ? { description: tool.description } : {}),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {appLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />}
      <PseoLibraryView
        selection={{ tool: { slug, name: tool.name } }}
        prompts={prompts}
        // 0 prompts → omit the count in the H1 ("Cursor AI Prompts", not
        // "0 … Prompts"); prompts are a separate axis from the tool resource.
        total={total || null}
        facets={facets}
        // The tool's own description, rendered as the deck UNDER the H1.
        // It used to render above it, so the page opened with an orphan
        // sentence floating over the title.
        deck={tool.description}
      />
      {/* How to use / Best for / Pricing — reference material about the tool,
          which belongs after the prompts someone came for, not before the H1. */}
      <ToolAbout tool={tool} />
    </>
  );
}

/* ── Tool resource copy — renders only the backend fields that exist, so the
 *    section grows as copy is filled and never shows fabricated text. ────── */

function ToolAbout({ tool }: { tool: Tool }) {
  const sections: { heading: string; body: string }[] = [
    tool.howToUse ? { heading: `How to use ${tool.name}`, body: tool.howToUse } : null,
    tool.bestFor ? { heading: "Best for", body: tool.bestFor } : null,
    tool.pricingSummary ? { heading: "Pricing", body: tool.pricingSummary } : null,
  ].filter((s): s is { heading: string; body: string } => s !== null);

  // Nothing substantive yet → render nothing (the prompt list stands alone).
  // The description is NOT a reason to render: it is the H1's deck now.
  if (sections.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1248px] px-6 pb-20 max-[640px]:px-4 max-[640px]:pb-12">
      {sections.length > 0 && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {sections.map((s) => (
            <div key={s.heading} className="rounded-gop-lg border border-gop-ink-hairline bg-white p-5">
              <h2 className="m-0 text-[15px] font-semibold text-gop-ink">{s.heading}</h2>
              <p className="mt-2 mb-0 whitespace-pre-line text-[15px] leading-6 text-gop-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
