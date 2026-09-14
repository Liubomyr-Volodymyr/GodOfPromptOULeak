/**
 * Blog API — the God of Prompt blog is headless WordPress (the Hetzner box,
 * fronted at godofprompt.ai/blog). We read its REST API and render the posts
 * in the GOP brand; WordPress stays the CMS, gop-web is the presentation.
 *
 *   Posts:      GET /wp/v2/posts?_embed   (title, excerpt, content, author,
 *               featured image, category terms, Yoast SEO)
 *   Categories: GET /wp/v2/categories
 *
 * Base is env-overridable so the CMS host can move (staging / a wp. subdomain)
 * after the /blog cutover without a code change. All content is first-party.
 *
 * CUTOVER PATH → api-dev: the backend exposes a WP-shaped mirror at
 * api-dev.godofprompt.dev/api/blog/posts (title.rendered / yoast_head_json,
 * `{data, meta}` envelope + audience/tools relations instead of `_embedded`).
 * As of 2026-07-06 it holds ONE test post, so WordPress stays the content
 * source; once the real posts are mirrored, swap this client to that route —
 * everything else in gop-web already talks only to api-dev (see api/base.ts).
 */

import { API_BASE } from "./base";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * Blog content source.
 *
 *   "backend"   (DEFAULT) — api-dev `/api/blog/*`, the single backend.
 *   "wordpress" — the legacy Hetzner WP REST API. Escape hatch only.
 *
 * Flip with NEXT_PUBLIC_BLOG_SOURCE=wordpress.
 *
 * ⚠️ Volume check when you flip this (2026-07-25): the backend mirror holds
 * 1 post; WordPress holds 1,006. On the noindexed dev deploy that is the
 * point — it surfaces what still needs mirroring. Do NOT point a public,
 * indexable host at the backend until the posts are migrated.
 */
export const BLOG_SOURCE =
  process.env.NEXT_PUBLIC_BLOG_SOURCE?.trim() === "wordpress" ? "wordpress" : "backend";

const USE_BACKEND = BLOG_SOURCE === "backend";

/** Legacy WordPress REST base (only used when BLOG_SOURCE=wordpress). */
export const WP_API = (
  process.env.NEXT_PUBLIC_WP_API_BASE?.trim() ||
  `${SITE_ORIGIN}/blog/wp-json/wp/v2`
).replace(/\/+$/, "");

/** api-dev blog base — WP-shaped payloads in a `{ data, meta }` envelope. */
const BLOG_API = `${API_BASE}/api/blog`;

/** Public site base for canonical/OG URLs (the blog lives under /blog). */
const SITE = SITE_ORIGIN;
export type BlogCategory = { id: number; slug: string; name: string; count: number };

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** Rendered article HTML — only populated by getPostBySlug (list calls skip it). */
  contentHtml: string;
  date: string; // ISO
  modified: string; // ISO
  dateLabel: string; // "Jul 2, 2026"
  author: string;
  /** WP author slug — bylines link to /blog/author/[slug] when present. */
  authorSlug: string | null;
  readMins: number;
  category: BlogCategory | null; // primary (first) category
  categoryIds: number[];
  heroImage: string | null;
  heroWidth: number | null;
  heroHeight: number | null;
  seo: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    ogImage: string | null;
  };
};

/* ── HTML-entity + tag helpers (server-side, no DOM) ─────────────────── */

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…",
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“",
  rdquo: "”", laquo: "«", raquo: "»", copy: "©", reg: "®", trade: "™",
};

/** Decode the HTML entities WordPress returns in titles/names/excerpts. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name] ?? NAMED[name.toLowerCase()] ?? m);
}

/** Strip tags → decode → collapse whitespace. For excerpts and previews. */
function toPlainText(html: string): string {
  const noTags = html.replace(/<[^>]*>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

/** WP excerpts carry a "[…]" / "Read more" tail and a trailing hellip. */
function cleanExcerpt(html: string): string {
  return toPlainText(html)
    .replace(/\s*(\[[…\.]+\]|\[\s*&hellip;\s*\]|Read More.*|Continue reading.*)$/i, "")
    .replace(/[…\s]+$/, "")
    .trim();
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Raw WP shapes (only the fields we read) ─────────────────────────── */

type WpRendered = { rendered: string };
type WpMediaSize = { source_url: string; width: number; height: number };
type WpTerm = { id: number; slug: string; name: string; taxonomy: string };
type WpRaw = {
  id: number;
  slug: string;
  title: WpRendered;
  excerpt: WpRendered;
  content?: WpRendered;
  date: string;
  modified: string;
  categories?: number[];
  yoast_head_json?: {
    title?: string;
    description?: string;
    canonical?: string;
    og_image?: Array<{ url: string }>;
    twitter_misc?: Record<string, string>;
  };
  _embedded?: {
    author?: Array<{ name?: string; slug?: string }>;
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { width?: number; height?: number; sizes?: Record<string, WpMediaSize> };
    }>;
    "wp:term"?: WpTerm[][];
  };
};

type WpFeaturedMedia = NonNullable<NonNullable<WpRaw["_embedded"]>["wp:featuredmedia"]>;

/** Pick the best featured-image URL at (or below) a target width. */
function pickImage(
  media: WpFeaturedMedia | undefined,
  targetW = 1200,
): { url: string | null; width: number | null; height: number | null } {
  const m = media?.[0];
  if (!m?.source_url) return { url: null, width: null, height: null };
  const sizes = m.media_details?.sizes ?? {};
  const ordered = Object.values(sizes)
    .filter((s) => s?.source_url && s.width)
    .sort((a, b) => a.width - b.width);
  const fit = ordered.find((s) => s.width >= targetW) ?? ordered[ordered.length - 1];
  if (fit) return { url: fit.source_url, width: fit.width, height: fit.height };
  return { url: m.source_url, width: m.media_details?.width ?? null, height: m.media_details?.height ?? null };
}

function readingMinutes(raw: WpRaw): number {
  const est = raw.yoast_head_json?.twitter_misc?.["Est. reading time"];
  if (est) {
    const n = parseInt(est, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const words = raw.content?.rendered ? toPlainText(raw.content.rendered).split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}

function primaryCategory(raw: WpRaw): BlogCategory | null {
  const terms = (raw._embedded?.["wp:term"] ?? []).flat().filter((t) => t.taxonomy === "category");
  const t = terms.find((x) => x.slug !== "uncategorized") ?? terms[0];
  return t ? { id: t.id, slug: t.slug, name: decodeEntities(t.name), count: 0 } : null;
}

function toPost(raw: WpRaw, opts: { full?: boolean } = {}): BlogPost {
  const y = raw.yoast_head_json ?? {};
  const img = pickImage(raw._embedded?.["wp:featuredmedia"]);
  return {
    id: raw.id,
    slug: raw.slug,
    title: decodeEntities(raw.title.rendered),
    excerpt: cleanExcerpt(raw.excerpt.rendered),
    contentHtml: opts.full ? raw.content?.rendered ?? "" : "",
    date: raw.date,
    modified: raw.modified,
    dateLabel: dateLabel(raw.date),
    author: raw._embedded?.author?.[0]?.name ?? "God of Prompt",
    authorSlug: raw._embedded?.author?.[0]?.slug ?? null,
    readMins: readingMinutes(raw),
    category: primaryCategory(raw),
    categoryIds: raw.categories ?? [],
    heroImage: img.url,
    heroWidth: img.width,
    heroHeight: img.height,
    seo: {
      title: y.title ?? null,
      description: y.description ?? null,
      canonical: y.canonical ?? `${SITE}/blog/${raw.slug}`,
      ogImage: y.og_image?.[0]?.url ?? img.url,
    },
  };
}

/* ── Fetch layer ─────────────────────────────────────────────────────── */

async function wpFetch(path: string, revalidate = 600): Promise<Response> {
  const url = `${WP_API}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`WP fetch ${res.status} ${url}`);
  return res;
}

export type PostsQuery = {
  page?: number;
  perPage?: number;
  categoryId?: number;
  authorId?: number;
  search?: string;
  revalidate?: number;
};

/** api-dev blog fetch → the `{ data, meta }` envelope. */
async function blogFetch(
  path: string,
  revalidate = 600,
): Promise<{ data: WpRaw[]; meta: { total?: number } }> {
  const url = `${BLOG_API}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`blog fetch ${res.status} ${url}`);
  const json = (await res.json()) as unknown;
  // Tolerate a bare array, a single object, or the documented envelope.
  if (Array.isArray(json)) return { data: json as WpRaw[], meta: {} };
  const o = (json ?? {}) as { data?: unknown; meta?: { total?: number } };
  if (Array.isArray(o.data)) return { data: o.data as WpRaw[], meta: o.meta ?? {} };
  return { data: o.data ? [o.data as WpRaw] : [json as WpRaw], meta: o.meta ?? {} };
}

/** Paged posts (embedded) → { posts, total, totalPages }. */
export async function getPosts(q: PostsQuery = {}): Promise<{ posts: BlogPost[]; total: number; totalPages: number }> {
  const perPage = Math.min(100, Math.max(1, q.perPage ?? 12));
  const page = Math.max(1, q.page ?? 1);

  if (USE_BACKEND) {
    const p = new URLSearchParams({
      limit: String(perPage),
      offset: String((page - 1) * perPage),
    });
    if (q.categoryId) p.set("categoryId", String(q.categoryId));
    if (q.search?.trim()) p.set("search", q.search.trim());
    try {
      const { data, meta } = await blogFetch(`/posts?${p.toString()}`, q.revalidate ?? 600);
      const total = Number(meta.total ?? data.length);
      return {
        posts: data.map((r) => toPost(r)),
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      };
    } catch {
      return { posts: [], total: 0, totalPages: 0 };
    }
  }

  const p = new URLSearchParams({
    _embed: "1",
    page: String(Math.max(1, q.page ?? 1)),
    per_page: String(Math.min(100, Math.max(1, q.perPage ?? 12))),
    orderby: "date",
    order: "desc",
    _fields: "id,slug,title,excerpt,date,modified,categories,yoast_head_json,_links,_embedded",
  });
  if (q.categoryId) p.set("categories", String(q.categoryId));
  if (q.authorId) p.set("author", String(q.authorId));
  if (q.search?.trim()) p.set("search", q.search.trim());
  try {
    const res = await wpFetch(`/posts?${p.toString()}`, q.revalidate ?? 600);
    const raw = (await res.json()) as WpRaw[];
    return {
      posts: raw.map((r) => toPost(r)),
      total: Number(res.headers.get("x-wp-total") ?? raw.length),
      totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
    };
  } catch {
    return { posts: [], total: 0, totalPages: 0 };
  }
}

/** One post by slug, with full rendered content. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (USE_BACKEND) {
    try {
      const { data } = await blogFetch(`/posts/${encodeURIComponent(slug)}`, 600);
      const hit = data.find((r) => r?.slug === slug) ?? data[0];
      return hit ? toPost(hit, { full: true }) : null;
    } catch {
      return null;
    }
  }
  try {
    const res = await wpFetch(`/posts?slug=${encodeURIComponent(slug)}&_embed=1`, 600);
    const raw = (await res.json()) as WpRaw[];
    const hit = raw.find((r) => r.slug === slug) ?? raw[0];
    return hit ? toPost(hit, { full: true }) : null;
  } catch {
    return null;
  }
}

/** Recent posts sharing the post's primary category, excluding itself. */
export async function getRelatedPosts(post: BlogPost, n = 3): Promise<BlogPost[]> {
  const catId = post.category?.id;

  if (USE_BACKEND) {
    try {
      const { posts } = await getPosts({
        perPage: n + 1,
        categoryId: catId ?? undefined,
        revalidate: 900,
      });
      return posts.filter((x) => x.slug !== post.slug).slice(0, n);
    } catch {
      return [];
    }
  }

  const p = new URLSearchParams({
    _embed: "1",
    per_page: String(n + 1),
    exclude: String(post.id),
    orderby: "date",
    order: "desc",
    _fields: "id,slug,title,excerpt,date,modified,categories,yoast_head_json,_links,_embedded",
  });
  if (catId) p.set("categories", String(catId));
  try {
    const res = await wpFetch(`/posts?${p.toString()}`, 900);
    const raw = (await res.json()) as WpRaw[];
    return raw.map((r) => toPost(r)).filter((x) => x.slug !== post.slug).slice(0, n);
  } catch {
    return [];
  }
}

/** All non-empty categories, decoded, most-populated first. Cached 1h. */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  if (USE_BACKEND) {
    // api-dev exposes taxonomy at /api/blog/tags (WP-shaped). It is empty
    // until the posts are mirrored — callers already treat [] as "no chips".
    try {
      const { data } = await blogFetch(`/tags`, 3600);
      const raw = data as unknown as Array<{ id: number; slug: string; name: string; count?: number }>;
      return raw
        .filter((c) => c && c.slug && c.slug !== "uncategorized")
        .map((c) => ({ id: c.id, slug: c.slug, name: decodeEntities(c.name), count: c.count ?? 0 }))
        .sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  }
  try {
    const res = await wpFetch(`/categories?per_page=100&orderby=count&order=desc&_fields=id,slug,name,count`, 3600);
    const raw = (await res.json()) as Array<{ id: number; slug: string; name: string; count: number }>;
    return raw
      .filter((c) => c.count > 0 && c.slug !== "uncategorized")
      .map((c) => ({ id: c.id, slug: c.slug, name: decodeEntities(c.name), count: c.count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/** A single category by slug (null if unknown) — for /blog/category/[slug]. */
export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const all = await getBlogCategories();
  return all.find((c) => c.slug === slug) ?? null;
}
