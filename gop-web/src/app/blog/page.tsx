import { OG_IMAGE } from "@/lib/seo/robots";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getPosts, getBlogCategories } from "@/lib/api";
import { PostCard, CategoryChip, categoryIcon } from "@/components/blog/blog-ui";
import FeaturedCard from "@/components/blog/FeaturedCard";
import NewsletterBand from "@/components/blog/NewsletterBand";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /blog — editorial index for the God of Prompt blog (headless WordPress).
 * A dark featured lead, a real category rail, the latest-articles grid, and a
 * newsletter capture — GOP brand over the global dots background.
 *
 * Server-rendered from the live WP REST API; ISR 10-min window. The featured
 * story is the latest post; the grid is the next dozen. Category chips are the
 * real taxonomy and route to /blog/category/[slug] for deep browsing.
 */
export const revalidate = 600;

const SITE = SITE_ORIGIN;
export const metadata: Metadata = {
  // Bare title — the root layout template appends " — God of Prompt" (avoid double-brand).
  title: "Blog",
  description:
    "Field notes on getting more out of AI: prompt engineering, the workflows that actually stick, and the tools worth your time.",
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    images: [OG_IMAGE],
    title: "The God of Prompt Blog",
    description: "Prompt engineering, workflows, and the AI tools worth your time.",
    url: `${SITE}/blog`,
    type: "website",
  },
};

export default async function BlogPage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ perPage: 13 }),
    getBlogCategories(),
  ]);

  const featured = posts[0] ?? null;
  const grid = posts.slice(1);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 pb-10 max-[640px]:pb-8">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-gop-gold-dark">
          <Sparkles size={14} strokeWidth={2.4} aria-hidden />
          The God of Prompt blog
        </span>
        <h1 className="m-0 max-w-[16ch] font-sans text-[52px] font-bold leading-[1.04] tracking-[-0.02em] text-gop-ink max-[900px]:text-[42px] max-[640px]:text-[34px]">
          Prompting, decoded.
        </h1>
        <p className="m-0 max-w-[58ch] text-gop-body-lg text-gop-ink-muted max-[640px]:text-gop-body">
          Field notes on getting more out of AI: prompt engineering, the workflows that
          actually stick, and the tools worth your time.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-gop-xl border border-gop-ink-hairline bg-gop-surface px-6 py-16 text-center text-gop-ink-muted">
          Articles are loading — check back in a moment.
        </p>
      ) : (
        <>
          {/* ── Featured ───────────────────────────────────────────── */}
          {featured && <FeaturedCard post={featured} />}

          {/* ── Category rail (real taxonomy) ──────────────────────── */}
          {categories.length > 0 && (
            <nav
              aria-label="Blog categories"
              className="-mx-6 flex gap-2 overflow-x-auto px-6 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[640px]:py-6"
            >
              <CategoryChip label="All" href="/blog" active />
              {categories.map((c) => (
                <CategoryChip key={c.id} label={c.name} href={`/blog/category/${c.slug}`} icon={categoryIcon(c.slug)} />
              ))}
            </nav>
          )}

          {/* ── Latest grid ────────────────────────────────────────── */}
          <section aria-label="Latest articles" className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
            {grid.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>

          {/* ── Newsletter ─────────────────────────────────────────── */}
          <div className="mt-16 max-[640px]:mt-12">
            <NewsletterBand />
          </div>
        </>
      )}
    </main>
  );
}
