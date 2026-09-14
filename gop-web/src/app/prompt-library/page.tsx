import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { getHubSeo, getCategoryGrid, buildItemListSchema, type HubGrid } from "@/lib/seo/hub";
import { getPrompts, getPromptCount, getFacets, getPosts, getBlogCategories } from "@/lib/api";
import LibraryView from "@/components/prompts/LibraryView";
import BlogTopicRow from "@/components/prompts/BlogTopicRow";
import LibraryFaq from "@/components/prompts/LibraryFaq";
import { pageRobots, OG_IMAGE } from "@/lib/seo/robots";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library — the library hub + browse experience + SEO surface.
 * The single highest-leverage URL after the homepage.
 *
 * Layout (Figma 1617:13017): hero (h1 + tagline + ⌘K search pill), category
 * icon rail, compact filter row (Category/Models/Roles dropdowns + sort +
 * format toggle), the dark card mosaic with the in-grid "Unlock Full
 * Experience" CTA, numbered pagination, then the SEO zone: blog topic row,
 * FAQ accordion, editorial body, and the category/tool/type link columns.
 *
 * SEO invariants (the April-17 prevention — do not regress):
 *   - exactly ONE <h1> — the hub headline (LibraryView `heading` +
 *     `headingAccent`, NOT the dynamic "{N} AI Prompts")
 *   - all grid/dropdown items are real <Link> (<a href>) — crawlers follow
 *     these (dropdown panels are hidden, not unmounted)
 *   - first 24 prompt cards server-rendered (paging is client)
 *   - canonical absolute + self-referencing
 *   - server-rendered (RSC); ISR revalidate 300
 *   - 3 JSON-LD blocks (CollectionPage + BreadcrumbList + ItemList)
 *   - FAQs as plain HTML Q&A — NO FAQPage schema (deprecated)
 */

export const revalidate = 300;

const INITIAL_PROMPTS = 24;

/** Round a true count down to a clean "N,000+" for prose. */
function flooredLabel(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000).toLocaleString()},000+`;
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
  return String(n);
}

/** Swap the inflated "30,000+" claims in the curated SEO copy for the real
 *  count — keeps the editorial coherent + honest. */
/** The curated SEO JSON hardcodes the production origin in its JSON-LD
 *  (@id, url, breadcrumb items). Rewrite it to the build's origin so a domain
 *  swap via NEXT_PUBLIC_SITE_URL reaches this content too — otherwise a dev
 *  build emits 18 URLs pointing at the live site. */
function reorigin(text: string): string {
  return text.split("https://godofprompt.ai").join(SITE_ORIGIN);
}

function deflate(html: string, realLabel: string): string {
  return html.replace(/30,000\+?/g, realLabel);
}

export async function generateMetadata(): Promise<Metadata> {
  const hub = getHubSeo();
  const realLabel = flooredLabel(await getPromptCount());
  const d = (s: string) => deflate(s, realLabel);
  return {
    title: d(hub.head.title),
    description: d(hub.head.description),
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library` },
    robots: pageRobots({
      index: true, follow: true,
      "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1,
    }),
    openGraph: {
    images: [OG_IMAGE],
      title: d(hub.head.og.title),
      description: d(hub.head.og.description),
      url: `${SITE_ORIGIN}/prompt-library`,
      siteName: hub.head.og.site_name,
      type: "website",
      // No `images` override on purpose. The curated JSON points at
      // https://godofprompt.ai/og-prompt-library.png, which 404s on every host
      // (public/ contains no PNG at all), so shares rendered with no image.
      // Omitting it lets the generated app/opengraph-image.tsx serve this page.
    },
    twitter: {
      card: "summary_large_image",
      title: d(hub.head.og.title),
      description: d(hub.head.og.description),
    },
  };
}

export default async function PromptLibraryHubPage() {
  const hub = getHubSeo();

  const [count, firstPrompts, facets, blogCats] = await Promise.all([
    getPromptCount(),
    getPrompts({ limit: INITIAL_PROMPTS, offset: 0 }),
    getFacets({}),
    getBlogCategories(),
  ]);
  const realLabel = flooredLabel(count);
  // Latest three Prompt Engineering posts from the blog (real WP content).
  const peCat = blogCats.find((c) => c.slug === "prompt-engineering");
  const { posts: blogPosts } = await getPosts({ categoryId: peCat?.id, perPage: 3, revalidate: 900 });

  const jsonLd = [hub.schema.collection_page, hub.schema.breadcrumb_list, buildItemListSchema(hub)];

  const seoBelow = (
    <div className="flex flex-col gap-14">
      {/* Blog topic row (Figma 1675:6405) */}
      <BlogTopicRow topic="Prompt Engineering" posts={blogPosts} />

      {/* FAQ accordion (Figma 1617:22420) — plain HTML Q&A, no FAQPage schema */}
      <LibraryFaq
        items={hub.faqs.map((f) => ({ id: f.id, question: f.question, html: deflate(f.answer_html, realLabel) }))}
      />

      {/* Editorial body — the long-form SEO text (Figma 1674:4542) */}
      <div
        className={[
          "max-w-[880px] text-[13px] leading-[1.75] text-gop-ink-soft",
          "[&_p]:m-0 [&_p]:mb-3",
          "[&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-gop-ink-muted [&_h2:first-child]:mt-0",
          "[&_h3]:mb-1.5 [&_h3]:mt-5 [&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:text-gop-ink-muted",
          "[&_ul]:mb-3 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-5",
          "[&_ol]:mb-3 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-5",
          "[&_strong]:font-semibold [&_strong]:text-gop-ink-muted",
          "[&_a]:text-gop-ink-muted [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-gop-ink",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: deflate(hub.body_sections_html, realLabel) }}
      />

      {/* Browse columns — the internal-link lattice feeding every pSEO page */}
      <div className="flex flex-col gap-10 border-t border-gop-ink-hairline pt-10">
        <LinkColumns grid={getCategoryGrid()} hrefBase="/prompt-library/category" />
        <LinkColumns grid={hub.tool_grid} hrefBase="/prompt-library/tool" />
        <LinkColumns grid={hub.type_grid} hrefBase="/prompt-library/type" />
      </div>
    </div>
  );

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: reorigin(deflate(JSON.stringify(block), realLabel)) }}
        />
      ))}
      <LibraryView
        selection={{}}
        prompts={firstPrompts}
        total={count}
        facets={facets}
        heading="The #1 Most Powerful"
        headingAccent="Open Prompt Library"
        tagline="Free, curated AI prompts for ChatGPT, Claude, Gemini, Midjourney & every major model — browse by category, tool, or use case."
        seoBelow={seoBelow}
      />
    </>
  );
}

/* ── Compact link columns — category / tool / type (SEO internal links).
     Every live item keeps its crawlable <Link>; "Soon" items render muted
     and unlinked. Quieter than cards so the SEO zone reads as one flow. ── */
function LinkColumns({ grid, hrefBase }: { grid: HubGrid; hrefBase: string }) {
  return (
    <section id={grid.section_id}>
      <h2 className="m-0 mb-4 text-[15px] font-semibold tracking-[-0.01em] text-gop-ink">
        {grid.heading}
      </h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-8 gap-y-2 p-0 sm:grid-cols-3 lg:grid-cols-4">
        {grid.items.map((item) =>
          item.live === false ? (
            <li key={item.slug} className="text-[13px] leading-5 text-gop-ink-faint">
              {item.name} <span className="text-[11px] uppercase tracking-wide">soon</span>
            </li>
          ) : (
            <li key={item.slug}>
              <Link
                href={`${hrefBase}/${item.slug}`}
                className="text-[13px] leading-5 text-gop-ink-muted no-underline transition-colors hover:text-gop-ink hover:underline hover:underline-offset-2"
              >
                {item.name}
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
