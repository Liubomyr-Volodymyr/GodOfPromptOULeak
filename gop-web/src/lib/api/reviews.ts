import { API_BASE } from "./base";

/**
 * Customer reviews — `GET /api/reviews` on api-dev.
 *
 * Schema (from the OpenAPI spec):
 *   { data: [{ id, review: { title, description },
 *              user: { name, avatar_url }, stars_amount, createdAt }],
 *     meta: { total, limit, offset } }
 *
 * Params: offset, limit, sort, order, min_stars.
 *
 * ⚠️ The endpoint returns `total: 0` as of 2026-07-25. Until it is populated,
 * the homepage keeps rendering the curated real customer reviews in
 * src/content/testimonials.json (37 real reviews, 35 Trustpilot-verified) —
 * see Testimonials.tsx. The instant the backend has rows they take over.
 */
export type Review = {
  id: string;
  title: string | null;
  body: string;
  authorName: string;
  avatarUrl: string | null;
  stars: number | null;
  createdAt: string | null;
};

type RawReview = {
  id?: string;
  review?: { title?: string | null; description?: string | null } | null;
  user?: { name?: string | null; avatar_url?: string | null } | null;
  stars_amount?: number | null;
  createdAt?: string | null;
};

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

function toReview(r: RawReview, i: number): Review | null {
  const body = str(r.review?.description);
  if (!body) return null; // a review with no text is not renderable
  return {
    id: str(r.id) ?? `review-${i}`,
    title: str(r.review?.title),
    body,
    authorName: str(r.user?.name) ?? "Verified customer",
    avatarUrl: str(r.user?.avatar_url),
    stars: typeof r.stars_amount === "number" ? r.stars_amount : null,
    createdAt: str(r.createdAt),
  };
}

/**
 * Published reviews, newest first. Returns `[]` on any failure or while the
 * endpoint is empty — callers decide what to render in that case.
 */
export async function getReviews(
  { limit = 48, minStars }: { limit?: number; minStars?: number } = {},
  revalidate = 1800,
): Promise<Review[]> {
  const p = new URLSearchParams({ limit: String(Math.min(100, Math.max(1, limit))) });
  if (minStars != null) p.set("min_stars", String(minStars));
  try {
    const res = await fetch(`${API_BASE}/api/reviews?${p.toString()}`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: RawReview[] } | RawReview[];
    const rows = Array.isArray(json) ? json : (json.data ?? []);
    return rows.map(toReview).filter((r): r is Review => r !== null);
  } catch {
    return [];
  }
}
