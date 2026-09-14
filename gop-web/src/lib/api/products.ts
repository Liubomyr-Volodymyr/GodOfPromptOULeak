import { API_BASE } from "./base";

/**
 * Products — the canonical GOP catalogue (`/api/products`, the {items} envelope).
 * Every product landing page sources its name, copy, PRICES, features, checkout
 * and delivery from here, so changing a product in the backend updates every
 * page that renders it. Nothing about a product is hardcoded on the page.
 *
 * Prices: `fullPrice` is the anchor (shown struck-through), `lifetimePrice` is
 * what actually charges (shown as the live price). Both come from the backend.
 *
 * Images: the backend returns bucket KEYS ("Products/foo.avif"), not full URLs.
 * They live in the `gop` bucket on the storage CDN, so the public URL is
 * `https://cdn.godofprompt.dev/gop/<key>`. We construct that directly (no
 * mockups). NOTE: that bucket currently answers anonymous GETs with 403
 * AccessDenied — the images only render once the `gop` bucket (or its
 * `Products/` prefix) is set to public-read. Override via env if it moves.
 */

const ASSET_BASE = (
  process.env.NEXT_PUBLIC_PRODUCT_ASSETS_BASE?.trim() || "https://cdn.godofprompt.dev/gop"
).replace(/\/+$/, "");
const asset = (path: string | null | undefined): string | null => {
  const p = (path ?? "").trim();
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return ASSET_BASE ? `${ASSET_BASE}/${p.replace(/^\/+/, "")}` : null;
};

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};
const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

/** landingPageUrl comes as an absolute godofprompt.ai URL (mixed www/non-www).
 *  Normalize to a relative path so links stay in-app once those landing
 *  pages exist here; foreign hosts pass through untouched. */
const landing = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  const m = s.match(/^https?:\/\/(?:www\.)?godofprompt\.ai(\/[^\s]*|$)/i);
  return m ? (m[1] || "/") : s;
};

export type Product = {
  slug: string;
  name: string;
  description: string | null;
  type: string | null;
  status: string | null;
  /** The `llm` axis — a model (Grok/Claude/…) or a format (Text/Image). */
  llm: string | null;
  /** Backend product categories — null until the CMS field is populated. */
  categories: string[] | null;
  /** Anchor price (struck-through). */
  fullPrice: number | null;
  /** Live price that actually charges. */
  lifetimePrice: number | null;
  features: string[];
  /**
   * Stripe product id (`prod_…`) — the ONLY thing that should start a
   * checkout. Pass it to startCheckout(), which asks gop-back to mint a
   * session. Pricing then lives in Stripe, not in the frontend.
   */
  stripeProductId: string | null;
  /**
   * ⚠️ DEAD. The backend's `checkoutUrl` points at checkout.godofprompt.ai,
   * a custom Stripe payment-link domain with NO DNS record — every one of
   * these links fails to resolve. Kept only so `hasCheckout` can tell a paid
   * product from a free one. NEVER render it as an href.
   */
  checkoutUrl: string | null;
  /** "Delivered via Notion" access link. */
  notionUrl: string | null;
  /** The product's landing page URL (the URL truth — may differ from slug). */
  landingUrl: string | null;
  ogImage: string | null;
  iconImage: string | null;
  /** Product card / hero image (productTabImageUrl). */
  tabImage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type RawProduct = Record<string, unknown>;


/**
 * Strip unverifiable catalogue-size claims out of backend copy.
 *
 * The CMS description and feature list for several products still say
 * "30,000+ AI prompts". The real library is ~6.6k, so that number renders a
 * claim we can't back — and because it lives in the product record it leaks
 * anywhere product copy is shown (the homepage timeline and the bundle
 * landing page both surfaced it).
 *
 * This drops the count and keeps the sentence: "with 30,000+ AI prompts" →
 * "with AI prompts". It is a guard at the boundary, not a fix: the real fix
 * is correcting the copy in the CMS, after which this becomes a no-op.
 */
function stripInflatedCounts(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/\b[\d][\d,.]*\s*\+?\s*(?=(AI\s+)?prompts\b)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toProduct(r: RawProduct): Product | null {
  const slug = str(r.slug);
  const name = str(r.name);
  if (!slug || !name) return null;
  const features = Array.isArray(r.features)
    ? (r.features as unknown[])
        .map(str)
        .map(stripInflatedCounts)
        .filter((f): f is string => f !== null && f !== "")
    : [];
  const categories = Array.isArray(r.categories)
    ? (r.categories as unknown[]).map(str).filter((c): c is string => c !== null)
    : [];
  return {
    slug,
    name,
    description: stripInflatedCounts(str(r.description)),
    type: str(r.type),
    status: str(r.status),
    llm: str(r.llm),
    categories: categories.length ? categories : null,
    fullPrice: num(r.fullPrice),
    lifetimePrice: num(r.lifetimePrice),
    features,
    stripeProductId: str(r.stripeProductId),
    checkoutUrl: str(r.checkoutUrl),
    notionUrl: str(r.notionProductAccessUrl),
    landingUrl: landing(r.landingPageUrl),
    ogImage: asset(str(r.opengraphImageUrl)),
    iconImage: asset(str(r.iconUrl)),
    tabImage: asset(str(r.productTabImageUrl)),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  };
}

/** All published products. `[]` on failure. */
export async function getProducts(revalidate: number | false = 3600): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products?limit=100`, {
      next: { revalidate: revalidate === false ? undefined : revalidate },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: RawProduct[]; data?: RawProduct[] } | null;
    const rows = json?.items ?? json?.data ?? [];
    return rows.map(toProduct).filter((p): p is Product => p !== null);
  } catch {
    return [];
  }
}

/** A single product by slug (resolved from the cached list — one fetch). */
export async function getProductBySlug(
  slug: string,
  revalidate: number | false = 3600,
): Promise<Product | null> {
  const products = await getProducts(revalidate);
  return products.find((p) => p.slug === slug) ?? null;
}
