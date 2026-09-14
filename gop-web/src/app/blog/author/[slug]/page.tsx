import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { Globe, AtSign, ExternalLink, type LucideIcon } from "lucide-react";
import Breadcrumb from "@/components/prompts/Breadcrumb";
import { Avatar, PostCard } from "@/components/blog/blog-ui";
import ProseArticle from "@/components/blog/ProseArticle";
import Pagination from "@/components/blocks/Pagination";
import NewsletterBand from "@/components/blog/NewsletterBand";
import { getBlogAuthors, getBlogAuthorBySlug, getPosts, type BlogAuthor } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /blog/author/[slug] — a blog author's profile + archive (E-E-A-T surface).
 * Same URL as the WP author permalink (drop-in migration). All data is the
 * real WordPress user record: name, long-form bio, website, and the PERSONAL
 * Person sameAs links from Yoast — nothing invented, no photo until a real
 * one exists (initials avatar meanwhile).
 *
 * Layout: breadcrumb → hero (avatar, name, role line + real article count,
 * social chips) → bio prose → "Articles by X" grid with URL pagination →
 * newsletter. ProfilePage + Person JSON-LD; canonical per page.
 */
export const revalidate = 600;

const SITE = SITE_ORIGIN;
const PER = 12;
type Params = { slug: string };
type Search = { page?: string };

export async function generateStaticParams(): Promise<Params[]> {
  const authors = await getBlogAuthors();
  return authors.map((a) => ({ slug: a.slug }));
}

function pageNum(sp: Search): number {
  const n = parseInt(sp.page ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function bioText(a: BlogAuthor, max = 200): string {
  const t = a.bioHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> },
): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const a = await getBlogAuthorBySlug(slug);
  if (!a) return { title: "Author — Blog" };
  const page = pageNum(sp);
  const base = `${SITE}/blog/author/${slug}`;
  return {
    // Bare title — the root layout template appends " — God of Prompt".
    title: `${a.name}${page > 1 ? ` — Page ${page}` : ""}`,
    description: bioText(a) || `Articles by ${a.name} on the God of Prompt blog.`,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
  };
}

export default async function BlogAuthorPage(
  { params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> },
) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const author = await getBlogAuthorBySlug(slug);
  if (!author) notFound();

  const page = pageNum(sp);
  const { posts, total, totalPages } = await getPosts({ authorId: author.id, page, perPage: PER });
  if (page > 1 && posts.length === 0) notFound();

  const url = `${SITE}/blog/author/${slug}`;
  const hrefFor = (n: number) => (n <= 1 ? `/blog/author/${slug}` : `/blog/author/${slug}?page=${n}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.name,
      description: bioText(author, 500) || undefined,
      url,
      ...(author.sameAs.length ? { sameAs: author.sameAs } : {}),
      worksFor: { "@type": "Organization", name: "God of Prompt", url: SITE },
    },
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-6 pb-10 max-[640px]:pb-8">
        <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: author.name }]} />
        <div className="flex items-start gap-6 max-[640px]:flex-col max-[640px]:gap-4">
          <Avatar name={author.name} size={96} />
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="m-0 font-sans text-[40px] font-bold leading-[1.08] tracking-[-0.02em] text-gop-ink max-[640px]:text-[30px]">
                {author.name}
              </h1>
              <p className="m-0 text-gop-body text-gop-ink-soft">
                Author at God of Prompt · {total.toLocaleString("en-US")} article{total === 1 ? "" : "s"}
              </p>
            </div>
            {(author.website || author.sameAs.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {author.website && <SocialChip href={author.website} />}
                {author.sameAs
                  .filter((u) => u !== author.website)
                  .map((u) => (
                    <SocialChip key={u} href={u} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Bio (real profile description) ───────────────────────── */}
      {author.bioHtml && (
        <section aria-label={`About ${author.name}`} className="max-w-[720px] border-t border-gop-ink-hairline pt-8">
          <ProseArticle html={author.bioHtml} />
        </section>
      )}

      {/* ── Articles ─────────────────────────────────────────────── */}
      <section aria-label={`Articles by ${author.name}`} className="mt-14 max-[640px]:mt-10">
        <h2 className="m-0 mb-6 font-sans text-[22px] font-bold tracking-[-0.01em] text-gop-ink">
          Articles by {author.name}
        </h2>
        {posts.length === 0 ? (
          <p className="rounded-gop-xl border border-gop-ink-hairline bg-gop-surface px-6 py-16 text-center text-gop-ink-muted">
            No articles yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
            <div className="mt-12 max-[640px]:mt-10">
              <Pagination page={page} pageCount={totalPages} hrefFor={hrefFor} ariaLabel="Article pages" />
            </div>
          </>
        )}
      </section>

      <div className="mt-16 max-[640px]:mt-12">
        <NewsletterBand />
      </div>
    </main>
  );
}

/* ── Social chip — real links only; icon by host, label by handle/host ── */
// This lucide version ships no brand glyphs — neutral icons, the label
// carries the identity (@handle / LinkedIn / hostname).
const HOSTS: Array<{ match: RegExp; Icon: LucideIcon; label?: (u: URL) => string }> = [
  { match: /(^|\.)x\.com$|(^|\.)twitter\.com$/, Icon: AtSign, label: (u) => `@${u.pathname.split("/").filter(Boolean)[0] ?? "x"}` },
  { match: /(^|\.)linkedin\.com$/, Icon: ExternalLink, label: () => "LinkedIn" },
];

function SocialChip({ href }: { href: string }) {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const hit = HOSTS.find((h) => h.match.test(u.hostname));
  const Icon = hit?.Icon ?? Globe;
  const label = hit?.label?.(u) ?? u.hostname.replace(/^www\./, "");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener me"
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gop-ink-hairline bg-white px-3 text-[13px] font-medium text-gop-ink-muted no-underline transition-colors hover:border-gop-ink-faint hover:text-gop-ink"
    >
      <Icon size={14} strokeWidth={1.9} aria-hidden />
      {label}
    </a>
  );
}
