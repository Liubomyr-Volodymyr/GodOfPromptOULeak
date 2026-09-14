import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/prompts/Breadcrumb";
import { PostCard, categoryIcon } from "@/components/blog/blog-ui";
import Pagination from "@/components/blocks/Pagination";
import NewsletterBand from "@/components/blog/NewsletterBand";
import { getBlogCategories, getBlogCategoryBySlug, getPosts } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /blog/category/[slug] — a blog category archive (headless WordPress).
 * Real taxonomy; URL-based pagination (?page=N) so every post is crawlable.
 * Page 1 of each category is prebuilt; deeper pages build on demand (ISR).
 */
export const revalidate = 600;

const SITE = SITE_ORIGIN;
const PER = 12;
type Params = { slug: string };
type Search = { page?: string };

export async function generateStaticParams(): Promise<Params[]> {
  const cats = await getBlogCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

function pageNum(sp: Search): number {
  const n = parseInt(sp.page ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> },
): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getBlogCategoryBySlug(slug);
  if (!cat) return { title: "Category — God of Prompt Blog" };
  const page = pageNum(sp);
  const base = `${SITE}/blog/category/${slug}`;
  return {
    // Bare title — the root layout template appends " — God of Prompt".
    title: `${cat.name} Blog${page > 1 ? ` — Page ${page}` : ""}`,
    description: `Articles on ${cat.name} from the God of Prompt blog — prompt engineering, workflows, and the tools worth your time.`,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
  };
}

export default async function BlogCategoryPage(
  { params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> },
) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getBlogCategoryBySlug(slug);
  if (!cat) notFound();

  const page = pageNum(sp);
  const { posts, total, totalPages } = await getPosts({ categoryId: cat.id, page, perPage: PER });
  if (page > 1 && posts.length === 0) notFound();

  const Icon = categoryIcon(cat.slug);
  const hrefFor = (n: number) => (n <= 1 ? `/blog/category/${slug}` : `/blog/category/${slug}?page=${n}`);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      <header className="flex flex-col gap-4 pb-10 max-[640px]:pb-8">
        <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: cat.name }]} />
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-gop-dark text-white">
            <Icon size={22} strokeWidth={1.9} aria-hidden />
          </span>
          <h1 className="m-0 font-sans text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-gop-ink max-[640px]:text-[30px]">
            {cat.name}
          </h1>
        </div>
        <p className="m-0 text-gop-body text-gop-ink-soft">
          {total.toLocaleString("en-US")} article{total === 1 ? "" : "s"}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-gop-xl border border-gop-ink-hairline bg-gop-surface px-6 py-16 text-center text-gop-ink-muted">
          No articles in this category yet.
        </p>
      ) : (
        <>
          <section aria-label={`${cat.name} articles`} className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>
          <div className="mt-12 max-[640px]:mt-10">
            <Pagination page={page} pageCount={totalPages} hrefFor={hrefFor} ariaLabel="Article pages" />
          </div>
        </>
      )}

      <div className="mt-16 max-[640px]:mt-12">
        <NewsletterBand />
      </div>
    </main>
  );
}
