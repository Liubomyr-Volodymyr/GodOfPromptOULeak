/**
 * Browser-side data calls — DIRECT to api-dev.godofprompt.dev.
 *
 * api-dev is the one and only backend for gop-web. The browser talks to it
 * straight, with no same-origin Next route in between: the /api/prompts,
 * /api/search and /api/counts proxy routes that used to sit here are gone.
 *
 * That means CORS is load-bearing. The backend must return
 * `access-control-allow-origin` for the deploy's origin — see gop-back
 * main.ts (FIRST_PARTY_ORIGINS). If a call here fails with "Failed to fetch"
 * and no status, it's CORS, not the query.
 *
 * Every function degrades to an empty result instead of throwing, so a
 * backend blip narrows the grid rather than blanking the page.
 */
import { API_BASE } from "./base";
import { FEED, buildUrl, transformPrompt, type FeedResponse } from "./prompts-shared";
import { qdrantSearch } from "./qdrant";
import type { Prompt } from "./types";

/* ─────────── Prompt feed ─────────── */

export type PromptFeedParams = {
  offset?: number;
  limit?: number;
  cat?: string;
  tool?: string;
  role?: string;
  /** Output type — "text" | "image". Filtered client-side (see below). */
  /** Subcategory slug — a DIFFERENT backend filter from `cat`. */
  subCat?: string;
  type?: string;
  search?: string;
  sort?: "newest" | "popular";
  signal?: AbortSignal;
};

async function feed(
  q: Parameters<typeof buildUrl>[0],
  signal?: AbortSignal,
): Promise<{ prompts: Prompt[]; total: number }> {
  const res = await fetch(buildUrl(q), { signal });
  if (!res.ok) throw new Error(`prompts feed ${res.status}`);
  const json = (await res.json()) as FeedResponse;
  return {
    prompts: (json.data ?? []).map(transformPrompt),
    total: json.meta?.total ?? 0,
  };
}

/**
 * Paged prompt list for the hub grid / pSEO narrowing.
 *
 * EVERY axis is a server-side filter now — category, subcategory, tool,
 * audience, output type, search — and they compose (verified: coding × code =
 * 236, coding × image = 0). So this is one request with a real `meta.total`.
 *
 * WHAT WAS HERE BEFORE: output type was mapped to a numeric id with
 * `p.type === "text" ? 1 : p.type === "image" ? 2 : null`, then filtered
 * client-side over a 100-item pool. Two failures fell out of that. `code` and
 * `presentation` mapped to null, so selecting them silently returned the
 * UNFILTERED feed; and the "total" was pool-limited, not the corpus count.
 */
export async function fetchPrompts(p: PromptFeedParams = {}): Promise<{ prompts: Prompt[]; total: number }> {
  const offset = Math.max(0, p.offset ?? 0);
  const limit = Math.min(48, Math.max(1, p.limit ?? 24));
  const sort = p.sort === "newest" ? ("date_published" as const) : ("views_count" as const);
  const base = {
    categorySlug: p.cat,
    subCategorySlug: p.subCat,
    tools: p.tool ? [p.tool] : undefined,
    audienceTypeSlug: p.role,
    outputType: p.type,
    search: p.search,
    sort,
    order: "DESC" as const,
  };

  try {
    return await feed({ ...base, limit, offset }, p.signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { prompts: [], total: 0 };
  }
}

/* ─────────── Command-palette search ─────────── */

export type SearchResult = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  isPremium: boolean;
  views?: number;
};

function slim(p: Prompt): SearchResult {
  return { id: String(p.id), slug: p.slug, title: p.title, icon: p.icon, isPremium: p.isPremium, views: p.views };
}

/**
 * Palette search. Empty query → a few popular prompts for the empty state;
 * otherwise Qdrant semantic search, falling back to the feed's substring
 * search when Qdrant is empty or down.
 */
export async function fetchSearch(
  query: string,
  signal?: AbortSignal,
): Promise<{ results: SearchResult[]; suggested: SearchResult[] }> {
  const q = query.trim();
  try {
    if (!q) {
      const { prompts } = await feed({ limit: 5, sort: "views_count", order: "DESC" }, signal);
      return { results: [], suggested: prompts.map(slim) };
    }

    const hits = await qdrantSearch(q, 8);
    if (hits.length > 0) {
      return {
        results: hits.map((h) => ({
          id: h.id,
          slug: h.slug,
          title: h.title,
          icon: null,
          isPremium: h.isPremium,
        })),
        suggested: [],
      };
    }

    const { prompts } = await feed({ limit: 8, search: q }, signal);
    return { results: prompts.map(slim), suggested: [] };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { results: [], suggested: [] };
  }
}

/* ─────────── Filter-option counts ─────────── */

/** Dropdown axis → the backend's query param for that axis. */
const COUNT_PARAM: Record<string, string> = {
  category: "categorySlug",
  subcategory: "subCategorySlug",
  tool: "tools",
  audience: "audienceTypeSlug",
};

const COUNT_CONCURRENCY = 6;

/**
 * Option counts for the library dropdowns, read from `meta.total` on a
 * limit=1 feed request per slug. There is no facets endpoint — this IS the
 * honest count. Slugs the backend can't answer for resolve to null and the
 * UI renders no number rather than a wrong one.
 */
export async function fetchCounts(
  axis: string,
  slugs: string[],
  signal?: AbortSignal,
): Promise<Record<string, number | null>> {
  const param = COUNT_PARAM[axis];
  const list = slugs.map((s) => s.trim()).filter(Boolean).slice(0, 120);
  if (!param || list.length === 0) return {};

  const counts: Record<string, number | null> = {};
  const queue = [...list];

  const one = async (slug: string): Promise<number | null> => {
    try {
      const res = await fetch(`${FEED}?limit=1&${param}=${encodeURIComponent(slug)}`, { signal });
      if (!res.ok) return null;
      const json = (await res.json()) as FeedResponse;
      return typeof json?.meta?.total === "number" ? json.meta.total : null;
    } catch {
      return null;
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(COUNT_CONCURRENCY, queue.length) }, async () => {
      for (;;) {
        const slug = queue.shift();
        if (!slug) return;
        counts[slug] = await one(slug);
      }
    }),
  );

  return counts;
}

/* ─────────── Stripe checkout ─────────── */

export type CheckoutTracking = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referral_code?: string;
};

/**
 * Start a Stripe checkout session and send the browser to the hosted page.
 *
 * POSTs straight to gop-back, which owns the Stripe credentials and returns
 * a session URL. Resolves only on failure — on success the page navigates
 * away and this promise never settles.
 *
 * We pass the backend's own `product_id` / `price_id` (the products API's
 * `stripeProductId`) rather than a hardcoded price map, so pricing changes in
 * Stripe need no frontend deploy. The old `checkoutUrl` field on the products
 * API points at checkout.godofprompt.ai, a custom Stripe payment-link domain
 * that NO LONGER RESOLVES (no DNS record) — never link to it.
 */
export async function startCheckout(
  opts: { productId?: string | null; priceId?: string | null; tracking?: CheckoutTracking },
): Promise<never | void> {
  if (typeof window === "undefined") return;
  const { productId, priceId, tracking } = opts;
  if (!productId && !priceId) throw new Error("startCheckout: productId or priceId is required");

  const origin = window.location.origin;
  const res = await fetch(`${API_BASE}/api/billing/stripe/purchase-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Checkout is unauthenticated by design — don't send cookies.
    credentials: "omit",
    body: JSON.stringify({
      ...(priceId ? { price_id: priceId } : {}),
      ...(productId ? { product_id: productId } : {}),
      success_url: `${origin}/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/prompt-library`,
      ...(tracking ?? {}),
    }),
  });

  // The endpoint answers 201 with { success: false, error } on Stripe errors,
  // so a 2xx is not enough — check the body.
  const data = (await res.json().catch(() => null)) as
    | { success?: boolean; url?: string; error?: string }
    | null;

  if (!res.ok || data?.success === false || !data?.url) {
    throw new Error(data?.error || `Checkout failed (${res.status})`);
  }
  // Only follow https URLs our API returned — guards against an open redirect.
  if (!/^https:\/\//i.test(data.url)) throw new Error("Checkout returned an invalid URL");

  window.location.assign(data.url);
}
