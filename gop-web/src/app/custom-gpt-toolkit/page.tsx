import type { Metadata } from "next";
import { Check, Sparkles, Zap } from "lucide-react";
import { getProductBySlug, type Product } from "@/lib/api";
import CheckoutButton from "@/components/products/CheckoutButton";
import TrustBar from "@/components/home/TrustBar";
import { SITE } from "@/lib/home";
import { pageRobots, OG_IMAGE } from "@/lib/seo/robots";

/**
 * /custom-gpt-toolkit — Custom GPTs Toolkit landing page (Figma 2163:52715).
 *
 * ROUTE SLUG: `custom-gpt-toolkit` (singular "gpt"), confirmed by Robert. It
 * deliberately does NOT match the product slug (`custom-gpts-toolkit`) — the
 * backend's landingPageUrl is the URL truth and it says the singular form.
 * Keeping them aligned means the CMS link resolves instead of 404ing.
 *
 * Everything except the route comes from the backend record: name, copy,
 * prices, features and the Stripe id. Change the product, the page follows.
 */
const SLUG = "custom-gpts-toolkit";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Custom GPTs Toolkit — 100+ Mega-Instructions for ChatGPT",
  description:
    "Build custom versions of ChatGPT for your business in one click. 100+ ready-made mega-instructions you copy, paste and deploy — marketing, sales, content and ops. Lifetime access and updates.",
  alternates: { canonical: `${SITE.url}/custom-gpt-toolkit` },
  robots: pageRobots({ index: true, follow: true, "max-image-preview": "large" }),
  openGraph: {
    images: [OG_IMAGE],
    title: "Custom GPTs Toolkit — God of Prompt",
    description:
      "100+ mega-instructions that turn ChatGPT into a specialist for your business. Copy, paste, deploy.",
    url: `${SITE.url}/custom-gpt-toolkit`,
    type: "website",
  },
};

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export default async function CustomGptToolkitPage() {
  const product = await getProductBySlug(SLUG);
  const price = product?.lifetimePrice ?? null;
  const anchor = product?.fullPrice ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product?.name ?? "Custom GPTs Toolkit",
    description:
      product?.description ??
      "Create custom versions of ChatGPT for your business in one click with hundreds of ready-made mega-instructions.",
    brand: { "@type": "Brand", name: "God of Prompt" },
    ...(price != null
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE.url}/custom-gpt-toolkit`,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero product={product} price={price} anchor={anchor} />
      <TrustBar />
      <Outcomes />
      <Included product={product} />
      <Offer product={product} price={price} anchor={anchor} />
      <Faqs price={price} />
    </>
  );
}

/* ── hero ────────────────────────────────────────────────────────────── */

function Hero({
  product,
  price,
  anchor,
}: {
  product: Product | null;
  price: number | null;
  anchor: number | null;
}) {
  return (
    <section className="bg-gop-page px-6 pt-16 max-[640px]:px-4 max-[640px]:pt-10">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center text-center">
        <h1 className="m-0 flex flex-col items-center text-[clamp(32px,5vw,56px)] font-extralight leading-[1.08] tracking-[-0.03em] text-gop-ink">
          Create Hundreds of Advanced
          <span className="bg-gradient-to-b from-[#4b4949] to-[#1b1a1a] bg-clip-text font-bold italic tracking-[-0.035em] text-transparent">
            Custom GPTs in One Click
          </span>
        </h1>
        <p className="mx-auto mt-3.5 max-w-[540px] text-[18px] leading-[27px] tracking-[-0.01em] text-gop-ink/60">
          {product?.description ??
            "Build custom versions of ChatGPT for your business with hundreds of ready-made mega-instructions."}
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <CheckoutButton productId={product?.stripeProductId} variant="gold" size="md">
            {price != null ? `Get Lifetime Access — ${fmt(price)}` : "Get Lifetime Access"}
          </CheckoutButton>
          {price != null && anchor != null && anchor > price && (
            <p className="m-0 text-[13px] text-gop-ink-soft">
              <del className="opacity-70">{fmt(anchor)}</del> — one payment, lifetime updates
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── what it does ────────────────────────────────────────────────────── */

const OUTCOMES = [
  {
    title: "Stop re-explaining your business",
    body: "A custom GPT holds your context permanently. Brief it once and every future chat already knows your product, audience and tone.",
  },
  {
    title: "Copy, paste, deploy",
    body: "Each mega-instruction is a complete system prompt. Paste it into a new GPT, save, and it's ready — no prompt engineering required.",
  },
  {
    title: "One specialist per job",
    body: "A GPT for sales outreach, another for SEO briefs, another for support replies. Each one stays sharp instead of one assistant doing everything badly.",
  },
  {
    title: "Share them with your team",
    body: "Custom GPTs can be shared inside your workspace, so the whole team works from the same instructions instead of improvising.",
  },
];

function Outcomes() {
  return (
    <section className="px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="text-center">
          <h2 className="m-0 text-[clamp(24px,3vw,34px)] font-light tracking-[-0.03em] text-gop-ink">
            Automate in seconds, <span className="font-bold italic">not hours.</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {OUTCOMES.map((o) => (
            <div key={o.title} className="rounded-3xl bg-white p-6 ring-1 ring-inset ring-gop-ink-hairline">
              <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-gop-ink">{o.title}</h3>
              <p className="m-0 mt-2 text-[15px] leading-6 text-gop-ink-muted">{o.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── what's included (backend features) ──────────────────────────────── */

function Included({ product }: { product: Product | null }) {
  const features = product?.features ?? [];
  if (features.length === 0) return null;

  return (
    <section className="px-6 pb-4 max-[640px]:px-4">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="text-center">
          <h2 className="m-0 text-[clamp(24px,3vw,34px)] font-light tracking-[-0.03em] text-gop-ink">
            That&apos;s why we created <span className="font-bold italic">100+ Custom GPTs.</span>
          </h2>
        </div>
        <ul className="mx-auto mt-10 grid max-w-[860px] list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 rounded-2xl bg-white p-5 text-[15px] leading-6 text-gop-ink ring-1 ring-inset ring-gop-ink-hairline"
            >
              <Sparkles size={18} className="mt-0.5 shrink-0 text-gop-gold" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── offer ───────────────────────────────────────────────────────────── */

function Offer({
  product,
  price,
  anchor,
}: {
  product: Product | null;
  price: number | null;
  anchor: number | null;
}) {
  return (
    <section className="px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[32px] bg-gop-card px-6 py-16 text-center max-[640px]:px-4 max-[640px]:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(253,195,2,0.16),transparent_58%)]"
        />
        <div className="relative flex flex-col items-center">
          <h2 className="m-0 flex flex-col text-[clamp(26px,3.4vw,40px)] font-light leading-[1.12] tracking-[-0.03em] text-white">
            Import once.
            <span className="font-bold italic text-gop-gold">Run forever.</span>
          </h2>

          {price != null && (
            <div className="mt-8 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
              {anchor != null && anchor > price && (
                <del className="font-mono text-[24px] font-semibold leading-none text-white/40">{fmt(anchor)}</del>
              )}
              <span className="font-mono text-[40px] font-semibold leading-none text-white">{fmt(price)}</span>
              <span className="mb-1 text-[13px] text-white/60">/ lifetime</span>
            </div>
          )}

          <p className="m-0 mt-4 flex items-center gap-1.5 text-[13px] text-gop-gold">
            <Zap size={14} aria-hidden />
            One payment — updates included for life
          </p>

          <div className="mt-6">
            <CheckoutButton productId={product?.stripeProductId} variant="gold" size="lg">
              Get the Custom GPTs Toolkit
            </CheckoutButton>
          </div>

          <p className="m-0 mt-5 flex items-center gap-2 text-[13px] text-white/50">
            <Check size={14} aria-hidden />
            7-day risk-free guarantee
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── FAQs ────────────────────────────────────────────────────────────── */

function Faqs({ price }: { price: number | null }) {
  const faqs = [
    {
      q: "What exactly is a custom GPT?",
      a: "A custom GPT is a version of ChatGPT you configure once with its own instructions, so it behaves like a specialist instead of a general assistant. This toolkit gives you the instructions — you paste them in and save.",
    },
    {
      q: "Do I need ChatGPT Plus?",
      a: "Creating custom GPTs requires a paid ChatGPT plan. The mega-instructions themselves also work pasted straight into a normal chat if you'd rather not build a GPT.",
    },
    {
      q: "Do I need any technical skill?",
      a: "No. Every instruction is copy-and-paste. The included guides walk through creating and sharing a GPT step by step.",
    },
    {
      q: "Is this a subscription?",
      a: price != null
        ? `No. It's a one-time payment of ${fmt(price)} with lifetime access and free updates.`
        : "No. It's a one-time payment with lifetime access and free updates.",
    },
    {
      q: "How do I get access after buying?",
      a: "Access details arrive by email immediately after checkout, delivered through Notion so new instructions appear automatically as they're added.",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[760px] px-6 pb-24 max-[640px]:px-4 max-[640px]:pb-14">
      <h2 className="text-center text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-gop-ink">FAQs</h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-gop-lg border border-gop-ink-hairline bg-white px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-gop-ink">
              {f.q}
              <span className="text-gop-ink-soft transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <p className="mb-0 mt-3 text-[14px] leading-6 text-gop-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
