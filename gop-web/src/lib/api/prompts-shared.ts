/**
 * Shared prompt-feed plumbing — URL building + raw→Prompt mapping.
 *
 * Lives apart from prompts.ts because that module imports `unstable_cache`
 * from next/cache, which cannot be pulled into a client bundle. The browser
 * calls api-dev.godofprompt.dev DIRECTLY (no same-origin proxy route), so the
 * client needs these exact helpers to build the same URL and map the same
 * payload the server does. One definition, two callers — the two can't drift.
 */
import { API_BASE } from "./base";
import { categorySlugExists } from "@/lib/categories";
import type { Prompt, PromptTool } from "./types";

export const FEED = `${API_BASE}/api/library/prompts`;
export const MAX_LIMIT = 100; // backend Max(100)

type RawTool = {
  id: number;
  name: string;
  slug: string;
  title?: string | null;
  type?: string | null;
  url?: string | null;
};
type RawCategory = { id: number; name: string; slug: string };
export type RawPrompt = {
  id: string;
  slug: string;
  pageName: string | null;
  promptName?: string | null;
  icon: string | null;
  description: string | null;
  isPremium: boolean;
  viewsCount: number;
  likesCount: number;
  bookmarksCount: number;
  rating?: number | null;
  exampleOutputUrl: string | null;
  exampleOutputEmbed?: string | null;
  datePublished: string | null;
  dateCreated?: string | null;
  categoryId: number | null;
  subCategoryId: number | null;
  outputTypeId: number | null;
  /** THE output type — snake_case, a plain slug ("text" | "image" |
   *  "presentation"), and 100% populated on every row. This is the field to
   *  read. `promptFormat` below is a DIFFERENT, partly-null field (it is the
   *  prompt's input format) — counting it undercounts image prompts 483 vs
   *  the real 743. */
  output_type?: string | null;
  promptFormat?: { id: number; name: string; techName: string } | null;
  category?: RawCategory | null;
  subCategory?: RawCategory | null;
  /** List route: tools wrapped in relations. */
  toolRelations?: Array<{ id: number; tool: RawTool }>;
  /** Detail route (GET /api/library/{uuid}): FLAT tool array instead. */
  tools?: RawTool[];
  promptBody: string | null;
  whatThisPromptDoes: string | null;
  tips: string | null;
  howToUseThePrompt: string | null;
  seoDescription: string | null;
};

export type FeedResponse = { data?: RawPrompt[]; meta?: { total?: number; limit?: number; offset?: number } };

function mapTool(t: RawTool): PromptTool {
  return { id: t.id, name: t.name, webName: t.name, techName: t.title ?? null, slug: t.slug, url: t.url ?? null, type: t.type ?? null };
}
function mapCategory(c?: RawCategory | null) {
  return c ? { id: c.id, name: c.name, slug: c.slug } : null;
}
/** Map a category only when its slug resolves to a real category page —
 *  dropping the chip beats linking it to a 404. The gate reads the generated
 *  taxonomy snapshot, which covers roots AND subcategories; while it was a
 *  stale mirror, live subcategory slugs (financial-modeling, go-to-market…)
 *  failed this check and their tags were silently dropped from every card.
 *  Run `pnpm sync:taxonomy` after the backend adds terms. */
function mapResolvableCategory(c?: RawCategory | null) {
  const m = mapCategory(c);
  return m && categorySlugExists(m.slug) ? m : null;
}

/** CMS titles can carry stray newlines/double spaces (worst live case is a
 *  113-char title with embedded \n) — normalize once at the boundary so
 *  <title>, h1, and JSON-LD headline all stay clean. */
function cleanText(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/** Example outputs must be OUR generated assets. Dev data contains stray
 *  stock-photo URLs (images.unsplash.com) — those aren't real example
 *  outputs, so the prompt renders as the no-image variant (full-width
 *  text, Figma 1282:3164) instead of showing a placeholder. Filtering at
 *  the boundary keeps junk out of the terminal, OG images, and JSON-LD. */
const EXAMPLE_IMAGE_HOSTS = new Set([
  "cdn.godofprompt.dev", // the storage CDN the api-dev payload links to
  "api-dev.godofprompt.dev",
]);

function trustedExampleUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  try {
    return EXAMPLE_IMAGE_HOSTS.has(new URL(u).hostname) ? u : null;
  } catch {
    return null;
  }
}

export function transformPrompt(raw: RawPrompt): Prompt {
  return {
    id: raw.id,
    slug: raw.slug,
    title: cleanText(raw.pageName ?? raw.promptName),
    promptName: raw.promptName ?? null,
    icon: raw.icon ?? null,
    description: raw.description ?? "",
    isPremium: !!raw.isPremium,
    views: raw.viewsCount ?? 0,
    likes: raw.likesCount ?? 0,
    bookmarks: raw.bookmarksCount ?? 0,
    // Real rating only — null until the backend ships the field (no fake
    // stars). When it lands, this line already surfaces it.
    rating: typeof raw.rating === "number" ? raw.rating : null,
    heroImage: trustedExampleUrl(raw.exampleOutputUrl),
    publishedAt: raw.datePublished ?? raw.dateCreated ?? null,
    category: mapResolvableCategory(raw.category),
    subcategory: mapResolvableCategory(raw.subCategory),
    categoryId: raw.categoryId ?? null,
    subCategoryId: raw.subCategoryId ?? null,
    // `outputTypeId` is null on every row; the real type is the snake_case
    // `output_type` slug. Map it to the app's 1 = text / 2 = image code so the
    // Text/Image filters and the /type/ pages match the corpus. promptFormat
    // is deliberately NOT used here — it is a different field and is null on
    // ~900 rows, which is what made image counts read 483 instead of 743.
    outputTypeId:
      raw.output_type === "text" ? 1 :
      raw.output_type === "image" ? 2 :
      (raw.outputTypeId ?? null),
    outputType: raw.output_type ?? null,
    promptFormat: raw.promptFormat?.techName ?? null,
    // audienceTypes aren't on the feed item; the per-prompt route fills these
    // when it ships. Null until then.
    role: null,
    roleSlug: null,
    // List route wraps tools in toolRelations; the detail route (/{uuid})
    // sends a flat `tools` array instead — accept both.
    tools: Array.isArray(raw.toolRelations)
      ? raw.toolRelations.filter((r) => r?.tool).map((r) => mapTool(r.tool))
      : Array.isArray(raw.tools)
        ? raw.tools.map(mapTool)
        : [],
    body: raw.promptBody,
    whatThisPromptDoes: raw.whatThisPromptDoes,
    tips: raw.tips,
    howToUse: raw.howToUseThePrompt,
    seoDescription: raw.seoDescription,
  };
}

/* ─────────── Core feed ─────────── */

export type Sort = "date_published" | "views_count";
export type Order = "ASC" | "DESC";

export type PromptsQuery = {
  limit?: number;
  offset?: number;
  sort?: Sort;
  order?: Order;
  categorySlug?: string;
  subCategorySlug?: string;
  audienceTypeSlug?: string;
  tools?: string[];
  search?: string;
  /** Output type tech name ("text" | "image"). Sent as `output_type` — the
   *  backend ignores it until gop-back PR #246 lands, which is exactly what
   *  getOutputTypeCount's support probe detects. */
  outputType?: string;
  revalidate?: number | false;
};

export function buildUrl(q: PromptsQuery): string {
  const p = new URLSearchParams();
  p.set("limit", String(Math.min(MAX_LIMIT, Math.max(1, q.limit ?? 24))));
  p.set("offset", String(Math.max(0, q.offset ?? 0)));
  if (q.sort) p.set("sort", q.sort);
  if (q.order) p.set("order", q.order);
  if (q.categorySlug) p.set("categorySlug", q.categorySlug);
  if (q.subCategorySlug) p.set("subCategorySlug", q.subCategorySlug);
  if (q.audienceTypeSlug) p.set("audienceTypeSlug", q.audienceTypeSlug);
  if (q.tools?.length) p.set("tools", q.tools.join(","));
  if (q.search?.trim()) p.set("search", q.search.trim());
  if (q.outputType) p.set("output_type", q.outputType);
  return `${FEED}?${p.toString()}`;
}
