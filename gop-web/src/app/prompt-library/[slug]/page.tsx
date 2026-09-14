import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb, { type Crumb } from "@/components/prompts/Breadcrumb";
import PromptArticle from "@/components/prompts/PromptArticle";
import PromptRelated from "@/components/prompts/PromptRelated";
import RememberVisit from "@/components/prompts/RememberVisit";
import { getPromptBySlug, getRelatedPrompts, getPrompts } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/[slug] — single prompt detail page (Figma 1266:4591).
 *
 * Rendering strategy:
 *   - ISR, 5-min window (`revalidate = 300`).
 *   - Top ~30 prompts by views are prebuilt (`generateStaticParams`);
 *     the long tail builds on demand (`dynamicParams` default).
 *   - The related row streams inside <Suspense> — the article paints as
 *     soon as the prompt itself resolves; the second fetch fills in.
 *   - BreadcrumbList + Article JSON-LD.
 */
export const revalidate = 300;

type Params = { slug: string };

const SITE = SITE_ORIGIN;
/** Prebuild the head of the traffic curve. Kept to 30 so 13 parallel
 *  build workers don't trip the API rate limit; the long tail builds on
 *  demand (dynamicParams default). try/catch → an API outage degrades to
 *  all-on-demand instead of failing the build. */
export async function generateStaticParams(): Promise<Params[]> {
  try {
    const top = await getPrompts({ limit: 30, sort: "views_count", order: "DESC" });
    return top.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);
  if (!prompt) return { title: "Prompt not found" };
  // Empty string would emit an empty meta description — omit instead.
  const description = prompt.seoDescription || prompt.description || undefined;
  const url = `${SITE}/prompt-library/${prompt.slug}`;
  return {
    title: prompt.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: prompt.title,
      description,
      url,
      images: prompt.heroImage ? [prompt.heroImage] : undefined,
      type: "article",
    },
  };
}

/** Streams independently of the main article (second API round-trip). */
async function RelatedPrompts({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string | null;
  excludeSlug: string;
}) {
  const related = await getRelatedPrompts({ categorySlug, excludeSlug, limit: 8 });
  return <PromptRelated items={related} />;
}

export default async function PromptDetailPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);
  if (!prompt) notFound();

  // The trail is always Prompts › Category › Subcategory › this prompt, and
  // the same array feeds both the visible crumbs and the BreadcrumbList — one
  // definition, so the two can't drift. The subcategory hop is the one that
  // matters for search: it's the specific head term ("Financial Modeling"),
  // and until now the prompt page linked only to the broad parent.
  const trail: Crumb[] = [
    { label: "Prompts", href: "/prompt-library" },
    ...(prompt.category
      ? [{ label: prompt.category.name, href: `/prompt-library/category/${prompt.category.slug}` }]
      : []),
    ...(prompt.subcategory && prompt.subcategory.slug !== prompt.category?.slug
      ? [{ label: prompt.subcategory.name, href: `/prompt-library/category/${prompt.subcategory.slug}` }]
      : []),
    { label: prompt.title },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: trail.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          item: `${SITE}${c.href ?? `/prompt-library/${prompt.slug}`}`,
        })),
      },
      {
        "@type": "Article",
        // schema.org guidance caps headline at 110 chars
        headline: prompt.title.length > 110 ? `${prompt.title.slice(0, 107)}…` : prompt.title,
        description: prompt.seoDescription || prompt.description || undefined,
        ...(prompt.heroImage ? { image: prompt.heroImage } : {}),
        ...(prompt.publishedAt
          ? { datePublished: prompt.publishedAt, dateModified: prompt.publishedAt }
          : {}),
        author: { "@type": "Organization", name: "God of Prompt", url: SITE },
        publisher: { "@type": "Organization", name: "God of Prompt", url: SITE },
        mainEntityOfPage: `${SITE}/prompt-library/${prompt.slug}`,
        interactionStatistic: [
          { "@type": "InteractionCounter", interactionType: "https://schema.org/WatchAction", userInteractionCount: prompt.views },
          { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: prompt.likes },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-20 max-[900px]:py-12 max-[640px]:px-4 max-[640px]:py-6">
      {/* <-escape so CMS text containing "</script>" can't break out */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Records this prompt into the command-palette Recent list */}
      <RememberVisit
        slug={prompt.slug}
        title={prompt.title}
        icon={prompt.icon}
        isPremium={prompt.isPremium}
      />

      {/* Breadcrumbs (Figma 1552:4710 — 13px trail, ">_" terminal separator,
          ink current). Prompts → category → subcategory → this prompt. */}
      <Breadcrumb items={trail} />

      <PromptArticle
        prompt={prompt}
        relatedSlot={
          <Suspense fallback={<RelatedSkeleton />}>
            <RelatedPrompts categorySlug={prompt.category?.slug ?? null} excludeSlug={prompt.slug} />
          </Suspense>
        }
      />
    </article>
  );
}

/** Placeholder row while the related fetch streams in — mirrors the
 *  3-up 230px-tall card row so the swap doesn't shift layout. */
function RelatedSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="h-7 w-52 animate-pulse rounded-lg bg-gop-ink/10 motion-reduce:animate-none" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[230px] w-[calc((100%-2rem)/3)] min-w-[280px] flex-shrink-0 animate-pulse rounded-[20px] bg-gop-ink/5 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
