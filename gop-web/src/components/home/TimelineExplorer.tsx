"use client";

import { useState } from "react";
import Link from "@/components/ui/Link";
import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "@/components/products/CheckoutButton";

/**
 * TimelineExplorer — the interactive half of the AI Evolution Timeline
 * (Figma 2033:19013). Left: the numbered, scrollable product-release list;
 * right: the detail panel for the selected release. All content arrives
 * from the server component (real backend products) — this owns ONLY the
 * selection state. Product screenshots are omitted until the `gop` asset
 * bucket goes public-read (403 today).
 */
export type TimelineItem = {
  slug: string;
  name: string;
  /** DD.MM.YY, from the real createdAt. */
  dateShort: string;
  /** "December 2025", for the detail caption. */
  dateLong: string;
  description: string | null;
  stripeProductId: string | null;
  landingUrl: string | null;
  notionUrl: string | null;
  image: string | null;
};

export default function TimelineExplorer({ items }: { items: TimelineItem[] }) {
  const [active, setActive] = useState(0);
  const sel = items[active];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] max-[900px]:grid-cols-1">
      {/* Release list — masked scroll like the Figma list */}
      <ol
        className="relative m-0 max-h-[420px] list-none overflow-y-auto p-0 pr-1 [mask-image:linear-gradient(to_bottom,black_82%,transparent)]"
        aria-label="Product releases"
      >
        {items.map((item, i) => (
          <li key={item.slug}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                i === active
                  ? "border-white/15 bg-black/45"
                  : "border-transparent bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-medium ${
                  i === active ? "bg-gop-accent-yellow text-gop-ink" : "bg-white/10 text-white/60"
                }`}
              >
                {i + 1}
              </span>
              <span className={`min-w-0 flex-1 truncate text-[15px] ${i === active ? "text-white" : "text-white/70"}`}>
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-[12px] tabular-nums text-white/40">{item.dateShort}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Detail panel */}
      <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl ring-1 ring-inset ring-white/10 bg-white/[0.04] text-center">
        <div className="flex flex-1 flex-col justify-center px-8 py-8 max-[640px]:px-5">
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-white/45">
            Released {sel.dateLong}
          </p>
          <h3 className="m-0 mt-2 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.01em] text-white">
            {sel.name}
          </h3>
          {sel.description && (
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/60">{sel.description}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {sel.stripeProductId && (
              <CheckoutButton variant="gold" size="sm" productId={sel.stripeProductId} href={sel.landingUrl}>
                Unlock
              </CheckoutButton>
            )}
            {sel.landingUrl && (
              <Link
                href={sel.landingUrl}
                className="inline-flex h-9 items-center rounded-full bg-white/10 px-4 text-[14px] font-medium text-white no-underline transition-colors hover:bg-white/15"
              >
                Explore
              </Link>
            )}
            {!sel.stripeProductId && !sel.landingUrl && sel.notionUrl && (
              <CtaButton variant="gold" size="sm" href={sel.notionUrl}>
                Get Free Access
              </CtaButton>
            )}
          </div>
        </div>
        {sel.image && (
          <div className="relative flex h-[190px] items-end justify-center overflow-hidden border-t border-white/10 bg-black/20 px-8 pt-5">
            <span
              aria-hidden
              className="absolute inset-x-[20%] bottom-[-45%] h-full rounded-full bg-gop-gold-tint blur-3xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sel.image}
              alt=""
              className="relative z-10 max-h-[178px] max-w-full object-contain object-bottom"
            />
          </div>
        )}
      </div>
    </div>
  );
}
