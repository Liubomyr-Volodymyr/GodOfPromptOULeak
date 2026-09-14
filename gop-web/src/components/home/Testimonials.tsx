import testimonialsJson from "@/content/testimonials.json";
import { getReviews } from "@/lib/api";
import TestimonialGrid, { type Testimonial } from "./TestimonialGrid";

/**
 * Testimonials — "Trusted by inspiring people and leading brands"
 * (Figma 2033:19820). Six show by default, "Show more" reveals the rest.
 *
 * SOURCE: the backend `GET /api/reviews` is the source of truth. It returns
 * `total: 0` as of 2026-07-25, so until it is populated this falls back to the
 * curated set in src/content/testimonials.json — 37 REAL named customers
 * (35 Trustpilot-verified) ported from the old repo. Backend rows take over
 * automatically the moment any exist; nothing here is invented.
 *
 * NO Review/AggregateRating schema and NO star row — the curated source has no
 * rating field, and we never ship a fabricated one. (The backend does carry
 * `stars_amount`; wire the star row once real reviews land.)
 */
const CURATED = testimonialsJson as Testimonial[];

export default async function Testimonials() {
  const reviews = await getReviews({ limit: 48 });

  const TESTIMONIALS: Testimonial[] = reviews.length
    ? reviews.map((r) => ({
        slug: r.id,
        name: r.authorName,
        avatar: r.avatarUrl ?? "",
        highlight: r.title ?? "",
        body: r.body,
        occupation: null,
        platform: null,
        username: null,
        trustpilot: false,
      }))
    : CURATED;

  if (!TESTIMONIALS.length) return null;

  return (
    <section aria-label="Customer stories" className="mx-auto w-full max-w-[1180px] px-6 py-14 max-[640px]:px-4 max-[640px]:py-10">
      <div className="mb-9 text-center">
        <span className="inline-flex items-center rounded-full border border-gop-ink-hairline bg-white px-3.5 py-1 text-[13px] font-medium text-gop-ink-muted">
          Success Stories
        </span>
        <h2 className="m-0 mt-4 text-[clamp(26px,3.2vw,38px)] font-semibold tracking-[-0.02em] text-gop-ink">
          Trusted by inspiring people and leading brands.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[16px] leading-6 text-gop-ink-muted">
          See how entrepreneurs across industries are using our AI prompts and automations to
          transform their businesses.
        </p>
      </div>

      <TestimonialGrid items={TESTIMONIALS} />
    </section>
  );
}
