import { getProducts, type Product } from "./products";

/**
 * Guides — the God of Prompt "AI Guides" surface (Figma 1689:9458).
 *
 * Guides are a SUBSET of the canonical product catalogue (`products.ts`, one
 * fetch, one asset helper — no parallel client). Every guide is a free
 * lead-magnet product, but NOT every lead-magnet is a guide: the catalogue
 * also holds mega-prompts, free prompt packs, and generators, which belong to
 * their own product landing pages, not /guides.
 *
 * Guide gate: the backend `categories` field is the intended discriminator,
 * but it is currently null on every product. Until the CMS populates it,
 * a guide is a lead-magnet whose real backend NAME says it's a guide
 * ("… Mastery Guide", "Starter Guide", "Prompt Engineering Guide"). Derived
 * from backend data — never a hardcoded list, so renaming a product in the
 * backend moves it in/out of /guides automatically.
 * TODO(backend): switch isGuide() to `categories` once the field ships.
 *
 * NB: products have NO rating — the card omits it (never fabricated).
 */

export type GuideBadge = "new" | "updated" | null;

export type Guide = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** The `llm` axis — a model (Grok/Claude/…) or a format (Text/Image); null if unset. */
  model: string | null;
  features: string[];
  previewImage: string | null;
  landingUrl: string | null;
  accessUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  badge: GuideBadge;
};

/** New within ~45d of creation; Updated within ~30d of a modification that
 *  post-dates creation by a week+. `nowMs` is passed so the mapping is pure. */
function badgeFor(p: Product, nowMs: number): GuideBadge {
  const day = 86_400_000;
  const created = p.createdAt ? Date.parse(p.createdAt) : NaN;
  const modified = p.updatedAt ? Date.parse(p.updatedAt) : NaN;
  if (Number.isFinite(created) && nowMs - created <= 45 * day) return "new";
  if (
    Number.isFinite(modified) &&
    nowMs - modified <= 30 * day &&
    (!Number.isFinite(created) || modified - created > 7 * day)
  ) {
    return "updated";
  }
  return null;
}

/** Is this lead-magnet a guide? Backend-derived (see module doc). */
function isGuide(p: Product): boolean {
  // Preferred gate once the backend populates it:
  // if (p.categories) return p.categories.includes(<guide category>);
  return /guide/i.test(p.name);
}

function toGuide(p: Product, nowMs: number): Guide {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    description: p.description ?? "",
    model: p.llm,
    features: p.features,
    previewImage: p.tabImage ?? p.ogImage ?? p.iconImage,
    landingUrl: p.landingUrl,
    accessUrl: p.notionUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    badge: badgeFor(p, nowMs),
  };
}

/**
 * Published guides, newest first. `nowMs` (default: request time) seeds the
 * New/Updated badge from the real create/modify dates. Resilient — returns
 * [] on any failure so the page renders an empty state, never throws.
 */
export async function getGuides(nowMs: number = Date.now()): Promise<Guide[]> {
  const products = await getProducts(1800);
  const guides = products
    .filter((p) => p.type === "lead-magnet" && p.status === "published" && isGuide(p))
    .map((p) => toGuide(p, nowMs));

  // Newest first, on date alone. A cover-first order was tried and dropped: it
  // contradicted the New badge, which is date-driven, so a guide could be
  // labelled New while sitting below older ones. Order and badge now agree.
  // A guide with no artwork therefore leads if it is the newest — the fix for
  // that is a cover in the CMS, not a sort that hides it.
  const newest = (g: Guide) => Date.parse(g.createdAt ?? "") || 0;
  return guides.sort((a, b) => newest(b) - newest(a));
}

/**
 * The backend stores a model (Grok, Claude) OR an output format (Text, Image)
 * in the SAME `llm` field. These two helpers split that one field into the two
 * axes the UI actually has, so neither list contains the other's values.
 */
const FORMAT_LIKE = ["Text", "Image", "Code", "Presentation", "Video", "Audio"];

/** Real models only, in display order.
 *
 *  This used to append the format-like values, so the Models dropdown listed
 *  "Text" and "Image" underneath Grok and Claude as though they were models —
 *  while the format toggle right next to it offered the same two. */
export function guideModels(guides: Guide[]): string[] {
  const order = ["Grok", "Claude", "Gemini", "Perplexity", "OpenClaw", "ChatGPT", "Midjourney"];
  const present = new Set(
    guides.map((g) => g.model).filter((m): m is string => !!m && !FORMAT_LIKE.includes(m)),
  );
  const known = order.filter((m) => present.has(m));
  const extra = [...present].filter((m) => !order.includes(m)).sort();
  return [...known, ...extra];
}

/**
 * Output formats present across the guides — the other half of the `llm` split.
 *
 * Derived rather than hardcoded, so a Code or Video guide appears the day one
 * is tagged, with no deploy. Today the data yields Text and Image only: no
 * guide carries another format, and products have no `output_type` field.
 */
export function guideFormats(guides: Guide[]): string[] {
  const present = new Set(guides.map((g) => g.model).filter((m): m is string => !!m));
  return FORMAT_LIKE.filter((f) => present.has(f));
}

