/**
 * Filter-option counts, straight from `meta.total`.
 *
 * There is no `/api/library/facets` endpoint (it isn't in the spec and 400s —
 * see facets.ts). We don't need one: `GET /api/library/prompts` already
 * returns `meta.total` for whatever filter you pass, so `limit=1` +
 * `meta.total` IS the count.
 *
 *   /api/library/prompts?limit=1&categorySlug=marketing  -> meta.total 734
 *
 * Requests go DIRECTLY to api-dev (see lib/api/client.ts) — one request per
 * option, run with bounded concurrency. No same-origin proxy route.
 *
 * ⚠️ Filters do NOT compose server-side yet (categorySlug + tools returns the
 * categorySlug total), so these are per-option totals, not true faceted counts
 * narrowed by the other active filters. Honest either way — the number shown
 * is exactly what that option yields on its own.
 */
import { fetchCounts } from "./client";

export type CountAxis = "category" | "subcategory" | "tool" | "audience";

/** Counts for a batch of options on one axis. Never throws. */
export async function fetchOptionCountMap(
  axis: CountAxis,
  slugs: string[],
): Promise<Record<string, number | null>> {
  if (slugs.length === 0) return {};
  try {
    return await fetchCounts(axis, slugs);
  } catch {
    return {};
  }
}

/**
 * Fetches a batch and streams each result to `onCount` so the UI can animate
 * numbers in as they resolve.
 */
export async function fetchOptionCounts(
  axis: CountAxis,
  slugs: string[],
  onCount: (slug: string, count: number | null) => void,
): Promise<void> {
  const counts = await fetchOptionCountMap(axis, slugs);
  for (const slug of slugs) onCount(slug, counts[slug] ?? null);
}
