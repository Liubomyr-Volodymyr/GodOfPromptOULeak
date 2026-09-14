import { API_BASE } from "./base";

/**
 * Faceted counts for the library filter sidebar.
 *
 * ⚠️ THE ENDPOINT DOES NOT EXIST YET. `GET /api/library/facets` is not in the
 * api-dev OpenAPI spec; the path falls through to `GET /api/library/{id}` and
 * the backend answers `400 Validation failed (uuid is expected)`.
 *
 * getFacets is called from NINE library page templates (category, tool,
 * audience, type + every combo), so actually issuing the request meant every
 * build/ISR pass fired hundreds of guaranteed-400s at the API for a result
 * that is thrown away. It is now short-circuited: no request is made until the
 * endpoint is real.
 *
 * TO ENABLE once the backend ships it: set NEXT_PUBLIC_FACETS=1. Every
 * consumer already treats `null` as "show the rows, hide the numbers", so
 * counts light up with zero UI changes.
 *
 * Contract (to implement backend-side):
 *   GET /api/library/facets?categorySlug=&tools=&audienceTypeSlug=&outputType=&search=
 *   → { total, subcategories[], models[], formats[], roles[] }
 *   Each facet count reflects the OTHER active filters (true faceted search).
 */
const FACETS_ENABLED = process.env.NEXT_PUBLIC_FACETS === "1";

export type Facet = { slug: string; name: string; count: number };

export type Facets = {
  total: number;
  subcategories: Facet[];
  models: Facet[];
  formats: Facet[];
  roles: Facet[];
};

export type FacetsQuery = {
  categorySlug?: string;
  tools?: string[];
  audienceTypeSlug?: string;
  outputType?: string; // "text" | "image"
  search?: string;
  revalidate?: number | false;
};

function buildQuery(q: FacetsQuery): string {
  const p = new URLSearchParams();
  if (q.categorySlug) p.set("categorySlug", q.categorySlug);
  if (q.tools?.length) p.set("tools", q.tools.join(","));
  if (q.audienceTypeSlug) p.set("audienceTypeSlug", q.audienceTypeSlug);
  if (q.outputType) p.set("outputType", q.outputType);
  if (q.search) p.set("search", q.search);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Returns faceted counts, or `null` if the endpoint isn't available yet. */
export async function getFacets(q: FacetsQuery = {}): Promise<Facets | null> {
  // No endpoint yet — don't spend a request (and a backend 400) to learn that.
  if (!FACETS_ENABLED) return null;
  try {
    const res = await fetch(`${API_BASE}/api/library/facets${buildQuery(q)}`, {
      next: { revalidate: q.revalidate === false ? undefined : q.revalidate ?? 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Partial<Facets> | null;
    if (!json || typeof json.total !== "number") return null;
    return {
      total: json.total,
      subcategories: json.subcategories ?? [],
      models: json.models ?? [],
      formats: json.formats ?? [],
      roles: json.roles ?? [],
    };
  } catch {
    return null;
  }
}

/** Quick lookup of a facet's count by slug (null-safe). */
export function facetCount(facets: Facet[] | undefined, slug: string): number | null {
  if (!facets) return null;
  const f = facets.find((x) => x.slug === slug);
  return f ? f.count : null;
}
