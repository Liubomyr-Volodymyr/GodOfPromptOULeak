import { API_BASE } from "./base";

/**
 * Qdrant semantic search — POST /api/qdrant/search { search }.
 *
 * Returns LEAN hits (no body/tools/views — just identity + taxonomy):
 *   { id (uuid), page_name, slug, premium|is_premium,
 *     category{id,name,slug}, sub_category{id,name,slug}, output_type? }
 * (`premium` on dev, `is_premium` on prod — both handled.)
 *
 * The uuid is the valuable part: it unlocks GET /api/library/{uuid}
 * (the detail route is uuid-only), so search doubles as the slug→record
 * resolver. POST fetches are not stored in Next's data cache — callers
 * should debounce (the palette does) or treat this as a live lookup.
 */

export type SearchTaxonomy = { id: number; name: string; slug: string };

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  isPremium: boolean;
  outputType: string | null;
  category: SearchTaxonomy | null;
  subcategory: SearchTaxonomy | null;
};

type RawHit = {
  id: string;
  slug: string;
  page_name?: string | null;
  title?: string | null;
  premium?: boolean;
  is_premium?: boolean;
  output_type?: string | null;
  category?: SearchTaxonomy | null;
  sub_category?: SearchTaxonomy | null;
};

function normalizeTaxonomy(t: SearchTaxonomy | null | undefined): SearchTaxonomy | null {
  if (!t || !t.slug) return null;
  return { id: t.id, name: t.name, slug: String(t.slug).trim() };
}

function normalizeHit(h: RawHit): SearchHit | null {
  if (!h?.id || !h?.slug) return null;
  return {
    id: h.id,
    slug: h.slug,
    title: (h.page_name ?? h.title ?? "").replace(/\s+/g, " ").trim(),
    isPremium: !!(h.is_premium ?? h.premium),
    outputType: h.output_type ?? null,
    category: normalizeTaxonomy(h.category),
    subcategory: normalizeTaxonomy(h.sub_category),
  };
}

/** Semantic prompt search. Returns [] on any failure — callers fall back. */
export async function qdrantSearch(query: string, limit = 10): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${API_BASE}/api/qdrant/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: q }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as RawHit[] | { data?: RawHit[] };
    const data = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(data)) return [];
    return data.map(normalizeHit).filter((h): h is SearchHit => h !== null).slice(0, limit);
  } catch {
    return [];
  }
}
