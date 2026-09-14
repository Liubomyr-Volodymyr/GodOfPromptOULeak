import { API_BASE } from "./base";

/**
 * Live taxonomy lookups — the raw category/audience lists from the backend.
 *
 * ⚠️ For the browse surface, prefer `@/lib/categories`. That module reads the
 * generated taxonomy snapshot: it knows the root↔subcategory tree (which these
 * flat endpoints do NOT expose — no parent field on any row) and carries real
 * prompt counts, so callers can gate on substance without a request.
 *
 * WHAT WAS REMOVED HERE: a `getPromptedTaxonomy()` that verified each term by
 * firing `limit=1` probes — one per tool, category and audience. That was ~270
 * requests against a backend that rate-limits at ~100/50s, repeated on every
 * ISR pass, to rediscover facts the snapshot now holds. It also needed a
 * hardcoded fallback list for when those probes flaked mid-build, which is how
 * the chip rail could silently shrink to six categories.
 *
 * These two remain for the rare caller that wants the unfiltered live list,
 * including terms with zero prompts. Resilient: `[]` on failure.
 */

export type TaxonomyTerm = { slug: string; name: string };

type Raw = { slug?: unknown; name?: unknown };

function toTerms(rows: Raw[]): TaxonomyTerm[] {
  return rows
    .map((r) => ({ slug: typeof r.slug === "string" ? r.slug : "", name: typeof r.name === "string" ? r.name : "" }))
    .filter((t) => t.slug && t.name);
}

function unwrap(json: unknown): Raw[] {
  if (Array.isArray(json)) return json as Raw[];
  const o = json as { data?: unknown; items?: unknown } | null;
  if (o && Array.isArray(o.data)) return o.data as Raw[];
  if (o && Array.isArray(o.items)) return o.items as Raw[];
  return [];
}

/** Every library category row, flat — roots and subcategories undifferentiated. */
export async function getLibraryCategories(revalidate = 3600): Promise<TaxonomyTerm[]> {
  try {
    const res = await fetch(`${API_BASE}/api/library/categories`, { next: { revalidate } });
    if (!res.ok) return [];
    return toTerms(unwrap(await res.json()));
  } catch {
    return [];
  }
}

/** Every library audience type. `[]` if the endpoint isn't serving a list. */
export async function getLibraryAudiences(revalidate = 3600): Promise<TaxonomyTerm[]> {
  try {
    const res = await fetch(`${API_BASE}/api/library/audience-types`, { next: { revalidate } });
    if (!res.ok) return [];
    return toTerms(unwrap(await res.json()));
  } catch {
    return [];
  }
}
