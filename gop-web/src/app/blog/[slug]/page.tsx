import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import Image from "next/image";
import Breadcrumb from "@/components/prompts/Breadcrumb";
import { Avatar, Meta, CategoryTag, PostCard } from "@/components/blog/blog-ui";
import ProseArticle from "@/components/blog/ProseArticle";
import NewsletterBand from "@/components/blog/NewsletterBand";
import { getPostBySlug, getRelatedPosts, getPosts } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /blog/[slug] — a single blog article, rendered from headless WordPress in
 * the GOP brand. Same URL as the WP permalink so it's a drop-in migration.
 *
 *   - ISR, 10-min window. Top ~30 recent posts prebuilt; the long tail builds
 *     on demand (dynamicParams default).
 *   - Metadata + canonical come from the post's Yoast SEO.
 *   - Article + BreadcrumbList JSON-LD.
 */
export const revalidate = 600;

const SITE = SITE_ORIGIN;
type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const { posts } = await getPosts({ perPage: 30 });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  const url = post.seo.canonical || `${SITE}/blog/${post.slug}`;
  const description = post.seo.description || post.excerpt || undefined;
  return {
    // Yoast title already carries the brand — use it verbatim (no template).
    title: { absolute: post.seo.title || `${post.title} — God of Prompt` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: post.seo.ogImage ? [post.seo.ogImage] : undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE}/blog` },
          ...(post.category
            ? [{ "@type": "ListItem", position: 2, name: post.category.name, item: `${SITE}/blog/category/${post.category.slug}` }]
            : []),
          { "@type": "ListItem", position: post.category ? 3 : 2, name: post.title, item: `${SITE}/blog/${post.slug}` },
        ],
      },
      {
        "@type": "BlogPosting",
        headline: post.title.length > 110 ? `${post.title.slice(0, 107)}…` : post.title,
        description: post.seo.description || post.excerpt || undefined,
        ...(post.heroImage ? { image: post.heroImage } : {}),
        datePublished: post.date,
        dateModified: post.modified,
        author: {
          "@type": "Person",
          name: post.author,
          ...(post.authorSlug ? { url: `${SITE}/blog/author/${post.authorSlug}` } : {}),
        },
        publisher: { "@type": "Organization", name: "God of Prompt", url: SITE },
        mainEntityOfPage: `${SITE}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-[1120px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Header (reading column) ─────────────────────────────────── */}
      <header className="mx-auto flex max-w-[760px] flex-col gap-5">
        <Breadcrumb
          items={[
            { label: "Blog", href: "/blog" },
            ...(post.category ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }] : []),
            { label: post.title },
          ]}
        />
        <div className="flex flex-col gap-4">
          <CategoryTag category={post.category} />
          <h1 className="m-0 font-sans text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-gop-ink max-[900px]:text-[34px] max-[640px]:text-[28px]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="m-0 text-[18px] leading-[1.55] text-gop-ink-soft max-[640px]:text-[16px]">{post.excerpt}</p>
          )}
          {post.authorSlug ? (
            // Byline links to the author's profile page (E-E-A-T).
            <Link
              href={`/blog/author/${post.authorSlug}`}
              className="group flex w-fit items-center gap-3 pt-1 no-underline"
            >
              <Avatar name={post.author} size={40} />
              <Meta author={post.author} date={post.dateLabel} readMins={post.readMins} />
            </Link>
          ) : (
            <div className="flex items-center gap-3 pt-1">
              <Avatar name={post.author} size={40} />
              <Meta author={post.author} date={post.dateLabel} readMins={post.readMins} />
            </div>
          )}
        </div>
      </header>

      {/* ── Hero image ──────────────────────────────────────────────── */}
      {post.heroImage && (
        <div className="mx-auto my-10 max-w-[960px] overflow-hidden rounded-[20px] ring-1 ring-inset ring-gop-ink-hairline max-[640px]:my-7">
          <Image
            src={post.heroImage}
            alt={post.title}
            width={post.heroWidth ?? 1200}
            height={post.heroHeight ?? 675}
            priority
            sizes="(max-width: 960px) 100vw, 960px"
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-2 max-w-[720px]">
        <ProseArticle html={post.contentHtml} />
      </div>

      {/* ── Related ─────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section aria-label="Related articles" className="mx-auto mt-20 max-w-[1120px] border-t border-gop-ink-hairline pt-12 max-[640px]:mt-14">
          <h2 className="m-0 mb-6 font-sans text-[22px] font-bold tracking-[-0.01em] text-gop-ink">Keep reading</h2>
          <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Newsletter ──────────────────────────────────────────────── */}
      <div className="mt-16 max-[640px]:mt-12">
        <NewsletterBand />
      </div>
    </article>
  );
}
