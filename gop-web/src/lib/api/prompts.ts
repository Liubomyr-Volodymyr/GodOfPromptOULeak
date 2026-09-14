import { cache } from "react";
import { unstable_cache } from "next/cache";
import { API_BASE } from "./base";
import { qdrantSearch } from "./qdrant";
import type { Prompt } from "./types";

/* =========================================================================
   Library API (revamped backend, Nest `LibraryController`, prefix `api`).

   Feed:   GET /api/library/prompts   → { data: Raw[], meta: { total, limit, offset } }
   Filters are SERVER-SIDE by slug: categorySlug, subCategorySlug,
   audienceTypeSlug, tools (CSV), search, plus sort/order.

   The feed item is the FULL record (promptBody, tips, toolRelations,
   category…), so the detail page is served straight from the feed — the
   /:id detail route is not on dev yet, so getPromptBySlug resolves via
   search + a bounded scan, and tries the /:id route opportunistically.
   ========================================================================= */

import {
  FEED,
  MAX_LIMIT,
  buildUrl,
  transformPrompt,
  type FeedResponse,
  type RawPrompt,
  type Order,
  type PromptsQuery,
  type Sort,
} from "./prompts-shared";

export type { Order, PromptsQuery, Sort };


/** Raw feed fetch → { prompts, total }. Retries 429s with backoff — the
 *  build prerenders pages in parallel workers and the API rate-limits. */
export async function getPromptsPage(q: PromptsQuery = {}): Promise<{ prompts: Prompt[]; total: number }> {
  const url = buildUrl(q);
  const opts = {
    next: q.revalidate === false ? { revalidate: 0 } : { revalidate: q.revalidate ?? 300 },
  };
  // Retry transient upstream failures (rate-limit + gateway errors). Without
  // this, a single flaky 502 during a build prerender fails the whole build.
  const TRANSIENT = new Set([429, 500, 502, 503, 504]);
  let res = await fetch(url, opts);
  for (let attempt = 0; TRANSIENT.has(res.status) && attempt < 4; attempt++) {
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt + Math.random() * 500));
    // retry uncached (a transient error body must not poison the data cache)
    res = await fetch(url, { cache: "no-store" });
  }
  if (!res.ok) throw new Error(`getPrompts failed (${res.status}) ${url}`);
  const json = (await res.json()) as FeedResponse;
  return {
    prompts: (json.data ?? []).map(transformPrompt),
    total: json.meta?.total ?? 0,
  };
}

/** Paged prompt list (server-filtered). */
export async function getPrompts(q: PromptsQuery = {}): Promise<Prompt[]> {
  return (await getPromptsPage(q)).prompts;
}

/** True total — one request, reads `meta.total`. Cached 1h. */
const fetchTotal = unstable_cache(
  async () => (await getPromptsPage({ limit: 1, revalidate: 3600 })).total,
  ["prompt-count"],
  { revalidate: 3600, tags: ["prompt-count"] },
);
export async function getPromptCount(): Promise<number> {
  return fetchTotal();
}

/**
 * One prompt by slug. The feed has no slug filter and the detail route is
 * uuid-only, so the chain is: (1) Qdrant semantic search (in
 * case it ships), (2) Qdrant semantic search → exact slug → detail by uuid
 * (the primary resolver), (3) feed substring search, (4) bounded
 * popular-first scans (rare last resort).
 *
 * Wrapped in React cache() for intra-request dedup: generateMetadata and the
 * page render both call this for the same slug within one request → collapsed
 * to a single execution of the (multi-hop) resolver chain.
 *
 * NOTE: this route is dynamic (on-demand + ISR), not prebuilt. The resolver
 * reaches Qdrant via a no-store POST (step 2, since the dev /{slug} route
 * 404s), and a few long-tail slugs whose form diverges from their title fall
 * to the deep scan — too slow to prerender at build (>60s). Making it static
 * needs a backend slug filter (1 fast request); until then on-demand + the
 * 5-min ISR window is the robust choice. Do NOT wrap in unstable_cache: that
 * re-enables build-time prerender and the slow slugs time out the build.
 */
async function resolvePromptBySlug(slug: string): Promise<Prompt | null> {
  // NOTE: there is no slug detail route on this backend. We used to try
  // `GET /api/library/prompts/<slug>` first "opportunistically"; it 404s for
  // EVERY prompt, so it was a guaranteed wasted round-trip (~0.4s) on every
  // prompt page view. Removed. If the backend ever ships a slug route, put it
  // back here as the fast path — but only once it actually exists.
  //
  // The chain below still costs 3 calls (~5s, dominated by Qdrant at ~3.3s).
  // The real fix is a slug filter on the feed so this becomes one request.

  // 2) Qdrant semantic search → exact slug match → detail by uuid.
  // This is the primary resolver: the vector search finds prompts whose
  // titles drifted from their slugs (punctuation, "-2" dedup suffixes)
  // that the substring search below can't, and its uuid unlocks the
  // uuid-only GET /api/library/{id} detail route.
  const words = slug.replace(/[-_]+/g, " ");
  try {
    const hit = (await qdrantSearch(words, 10)).find((h) => h.slug === slug);
    if (hit) {
      const res = await fetch(`${API_BASE}/api/library/${encodeURIComponent(hit.id)}`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: RawPrompt } & RawPrompt;
        const raw = json.data ?? json;
        if (raw && raw.slug === slug) {
          const p = transformPrompt(raw);
          // The uuid detail route omits the category/subCategory relations
          // (list-only fields) — graft them from the search hit so
          // breadcrumbs, JSON-LD, and related-prompts keep working.
          return {
            ...p,
            category: p.category ?? hit.category,
            subcategory: p.subcategory ?? hit.subcategory,
          };
        }
      }
    }
  } catch {
    /* fall through */
  }

  // 3) feed substring search (cached GET; strict title substring match).
  // Feed items are ~60KB each; Next refuses to cache fetches over 2MB, so
  // page sizes here stay ≤ 24 to keep every request in the data cache.
  const hits = await getPrompts({ search: words, limit: 24, revalidate: 300 });
  const match = hits.find((p) => p.slug === slug);
  if (match) return match;

  // 4a) popular-first scan, small cacheable pages (covers ranks 1-600 —
  // the overwhelming share of real traffic — entirely from the data cache)
  const SCAN_PAGE = 24;
  for (let offset = 0; offset < 600; offset += SCAN_PAGE) {
    const page = await getPrompts({ limit: SCAN_PAGE, offset, sort: "views_count", order: "DESC", revalidate: 300 });
    const hit = page.find((p) => p.slug === slug);
    if (hit) return hit;
    if (page.length < SCAN_PAGE) return null; // catalog exhausted
  }

  // 4b) deep scan for the long tail (ranks 600-2400). Pages of 100 are
  // ~6MB — over the 2MB data-cache cap, so these run uncached — but a
  // slow hit beats a wrong 404 for a live URL. Batched ×3 to bound
  // wall-clock. The real fix is a backend slug filter on the feed.
  for (let base = 600; base < 2400; base += MAX_LIMIT * 3) {
    const batch = await Promise.all(
      [0, 1, 2].map((i) =>
        getPrompts({ limit: MAX_LIMIT, offset: base + i * MAX_LIMIT, sort: "views_count", order: "DESC", revalidate: 300 })
          .catch(() => [] as Prompt[]),
      ),
    );
    const hit = batch.flat().find((p) => p.slug === slug);
    if (hit) return hit;
    if (batch.some((page) => page.length < MAX_LIMIT)) break; // catalog exhausted
  }
  return null;
}

/** Best-effort: attach the prompt's audience types ("Perfect for") from the
 *  dedicated GET /api/library/{id}/audience-types route, populating
 *  role/roleSlug. Returns the prompt unchanged on any failure (optional UI). */
async function withAudiences(prompt: Prompt): Promise<Prompt> {
  try {
    const res = await fetch(
      `${API_BASE}/api/library/${encodeURIComponent(String(prompt.id))}/audience-types`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return prompt;
    const raw = (await res.json()) as Array<{ name?: string; slug?: string | null }>;
    const first = (Array.isArray(raw) ? raw : []).find((a) => a?.name);
    if (!first) return prompt;
    return { ...prompt, role: first.name ?? null, roleSlug: first.slug ?? null };
  } catch {
    return prompt;
  }
}

/** One prompt by slug, with its "Perfect for" audience attached. React
 *  cache() dedups the call across generateMetadata + the page render. */
export const getPromptBySlug = cache(async (slug: string): Promise<Prompt | null> => {
  const prompt = await resolvePromptBySlug(slug);
  return prompt ? withAudiences(prompt) : null;
});

/** Server-side search (command palette). */
export async function searchPrompts(query: string, limit = 8): Promise<Prompt[]> {
  const q = query.trim();
  if (!q) return [];
  return getPrompts({ search: q, limit, sort: "views_count", order: "DESC" });
}

/* ─────────── Faceted fetches (server-side now) ─────────── */

/** Prompts in a category (root or sub) by slug, popular-first. */
export async function getPromptsByCategory(slug: string, limit = 24): Promise<Prompt[]> {
  return getPrompts({ categorySlug: slug, limit, sort: "views_count", order: "DESC" });
}

/** Prompts compatible with a tool slug. */
export async function getPromptsByTool(slug: string, limit = 24): Promise<Prompt[]> {
  return getPrompts({ tools: [slug], limit, sort: "views_count", order: "DESC" });
}

/**
 * Prompts of an output type, by slug ("text" | "image" | "code").
 *
 * The backend now filters server-side on `output_type` (verified: text 5,654 ·
 * image 743 · code 236, every returned row carrying the requested type), so
 * this is one request. It used to page up to 600 prompts popular-first and
 * filter client-side on a numeric `outputTypeId`, because the param didn't
 * exist — which also meant a type whose id wasn't in the hardcoded map (code
 * is one) could never be served at all.
 */
export async function getPromptsByType(type: string, limit = 24): Promise<Prompt[]> {
  return getPrompts({ outputType: type, limit, sort: "views_count", order: "DESC", revalidate: 300 });
}

/** Related prompts from the same category, excluding the current slug. */
export async function getRelatedPrompts({
  categorySlug,
  excludeSlug,
  limit = 8,
}: {
  categorySlug?: string | null;
  excludeSlug?: string;
  limit?: number;
}): Promise<Prompt[]> {
  if (!categorySlug) return [];
  const pool = await getPrompts({ categorySlug, limit: limit + 6, sort: "views_count", order: "DESC" });
  return pool.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

/* ─────────── Output-type counts ─────────── */

/** App code (1 text / 2 image) → the backend's `output_types.tech_name`. */
/** Output types the app serves a page for. `code` was missing, so every count
 *  call for it returned null before it could even reach the backend. */
const TYPE_TECH_NAME: Record<string, number> = { text: 1, image: 2, code: 3, presentation: 4 };

/**
 * True number of prompts of an output type — the number shown on
 * /prompt-library/type/<type>.
 *
 * Two paths, in order:
 *
 *  1. `output_type` as a server filter (gop-back PR #246). When that ships,
 *     `meta.total` answers in ONE request. We detect support by comparing
 *     against the unfiltered total: a backend that ignores an unknown query
 *     param returns the whole corpus, so "same as unfiltered" means
 *     unsupported. The moment the PR merges this path lights up on its own —
 *     no frontend deploy.
 *
 *  2. Until then, count for real by paging the corpus and tallying
 *     `promptFormat.techName`. ~67 requests at 100/page, run ONCE a day and
 *     cached — never on a user request. It is all-or-nothing: if any page
 *     fails we return null and the UI omits the count rather than printing a
 *     partial tally as if it were the total.
 *
 * Both types are counted in a single pass so the two type pages share one
 * scan instead of triggering one each.
 */
type TypeCounts = {
  /** output_type slug -> total across the whole corpus */
  byType: Record<string, number>;
  /** `${categorySlug}:${outputType}` -> total. Same pass, no extra requests. */
  byCategoryType: Record<string, number>;
};

async function scanOutputTypeCounts(): Promise<TypeCounts | null> {
  const PAGE = 100;
  const byType: Record<string, number> = {};
  const byCategoryType: Record<string, number> = {};
  let offset = 0;
  let total = Infinity;

  // The API allows ~100 requests per ~50s window and advertises its budget on
  // every response (x-ratelimit-remaining / -reset). This scan needs ~67
  // requests and runs while the rest of the build is also calling the API, so
  // blind retries just burn the budget faster. Instead: read the budget and
  // wait out the window when it runs low. Slower, but it finishes — and a
  // scan that gives up means no count on the page at all.
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const TRANSIENT = new Set([429, 500, 502, 503, 504]);

  while (offset < total) {
    const url = `${FEED}?limit=${PAGE}&offset=${offset}&sort=date_published&order=DESC`;
    let json: FeedResponse | null = null;

    for (let attempt = 0; attempt < 6 && json === null; attempt++) {
      let resetSecs = 5;
      try {
        const res = await fetch(url, { next: { revalidate: 86400 } });
        const reset = Number(res.headers.get("x-ratelimit-reset"));
        if (Number.isFinite(reset) && reset > 0) resetSecs = reset;

        if (res.ok) {
          json = (await res.json()) as FeedResponse;
          // Yield the window before we hit zero rather than after.
          const left = Number(res.headers.get("x-ratelimit-remaining"));
          if (Number.isFinite(left) && left <= 5) await sleep((resetSecs + 1) * 1000);
          break;
        }
        if (!TRANSIENT.has(res.status)) return null;
      } catch {
        // network blip — fall through to the wait below
      }
      // 429 → the reset header says exactly how long the window has left.
      await sleep(Math.min(resetSecs + 1, 60) * 1000);
    }

    // Exhausted the window repeatedly: a partial tally would be a lie.
    if (json === null) return null;

    const rows = json.data ?? [];
    for (const raw of rows) {
      const t = raw.output_type;
      if (!t) continue;
      byType[t] = (byType[t] ?? 0) + 1;
      // Every row already carries its category, so the type x category matrix
      // is free here — it powers "N Text Prompts for Education" without a
      // second scan. Subcategory too, so /category/<sub> pages resolve.
      for (const slug of [raw.category?.slug, raw.subCategory?.slug]) {
        if (slug) byCategoryType[`${slug}:${t}`] = (byCategoryType[`${slug}:${t}`] ?? 0) + 1;
      }
    }

    total = json.meta?.total ?? 0;
    offset += PAGE;
    if (rows.length < PAGE) break;
  }
  return { byType, byCategoryType };
}

const cachedOutputTypeCounts = cache(
  unstable_cache(scanOutputTypeCounts, ["output-type-counts"], {
    revalidate: 86400,
    tags: ["output-type-counts"],
  }),
);

/** Count for one output type slug ("text" | "image"). Null when unknown. */
export async function getOutputTypeCount(type: string): Promise<number | null> {
  if (!TYPE_TECH_NAME[type]) return null;

  // 1. Server-side filter, if the backend has it.
  try {
    const [filtered, all] = await Promise.all([
      getPromptsPage({ limit: 1, revalidate: 3600, outputType: type }),
      getPromptsPage({ limit: 1, revalidate: 3600 }),
    ]);
    if (filtered.total > 0 && filtered.total !== all.total) return filtered.total;
  } catch {
    // fall through to the scan
  }

  // 2. Honest full count.
  const counts = await cachedOutputTypeCounts();
  return counts?.byType?.[type] ?? null;
}

/**
 * Count for one output type WITHIN a category — the honest number behind
 * "N Text Prompts for Education" when the format toggle is used on a
 * category page. Read from the same cached scan; no extra requests.
 */
export async function getOutputTypeCountForCategory(
  type: string,
  categorySlug: string,
): Promise<number | null> {
  if (!TYPE_TECH_NAME[type] || !categorySlug) return null;
  const counts = await cachedOutputTypeCounts();
  return counts?.byCategoryType?.[`${categorySlug}:${type}`] ?? null;
}
