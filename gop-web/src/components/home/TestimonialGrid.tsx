"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * TestimonialGrid — the client half of the Testimonials section: a masonry-ish
 * 3-column grid that starts at 6 cards and expands on "Show More"
 * (Figma 2033:19820). Quotes/avatars/names are REAL customers (37 of them,
 * 35 Trustpilot-verified) — see src/content/testimonials.json.
 *
 * The design shows a 5-star row per card; the source data has NO rating
 * field, so stars are omitted rather than fabricated. Trustpilot-verified
 * entries carry an honest "Verified review" label instead.
 */
export type Testimonial = {
  slug: string;
  name: string;
  avatar: string;
  highlight: string;
  body: string;
  occupation: string | null;
  platform: string | null;
  username: string | null;
  trustpilot: boolean;
};

const INITIAL = 6;
const STEP = 6;

function roleLabel(t: Testimonial): string {
  if (t.occupation) return t.occupation;
  if (t.platform && t.username) return `${t.username} on ${t.platform}`;
  return t.trustpilot ? "Verified review" : "Customer";
}

export default function TestimonialGrid({ items }: { items: Testimonial[] }) {
  const [shown, setShown] = useState(INITIAL);
  const visible = items.slice(0, shown);
  const more = items.length - shown;

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => (
          <figure
            key={t.slug}
            className="m-0 flex flex-col rounded-2xl border border-gop-ink-hairline bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <figcaption className="flex items-center gap-3">
              <Image
                src={t.avatar}
                alt={t.name}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <span className="min-w-0 text-[14px] leading-5">
                <span className="block truncate font-semibold text-gop-ink">{t.name}</span>
                <span className="block truncate text-gop-ink-soft">{roleLabel(t)}</span>
              </span>
            </figcaption>

            {t.highlight && (
              <p className="m-0 mt-4 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-gop-ink">
                {t.highlight}
              </p>
            )}
            <blockquote className="m-0 mt-2 flex-1 text-[15px] leading-6 text-gop-ink-muted">
              {t.body}
            </blockquote>
          </figure>
        ))}
      </div>

      {more > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + STEP)}
            className="inline-flex h-11 items-center rounded-full bg-gop-ink px-6 text-[15px] font-medium text-white transition-colors hover:bg-gop-dark active:translate-y-px"
          >
            Show more
          </button>
        </div>
      )}
    </>
  );
}
