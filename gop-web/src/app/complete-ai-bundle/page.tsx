import type { Metadata } from "next";
import { Check, Crown, Star, Zap } from "lucide-react";
import { getProductBySlug, type Product } from "@/lib/api";
import CheckoutButton from "@/components/products/CheckoutButton";
import TrustBar from "@/components/home/TrustBar";
import AiTimeline from "@/components/home/AiTimeline";
import { SITE } from "@/lib/home";
import { pageRobots, OG_IMAGE } from "@/lib/seo/robots";

/**
 * /complete-ai-bundle — the flagship landing page (Figma 2163:86470).
 *
 * Every "Get Lifetime Access" CTA on the site points here, and until now this
 * route 404'd, so the homepage sent buyers to the generic /products list.
 *
 * PRICE: $150 lifetime, confirmed by Robert. It is NOT read from the products
 * API because that record is stale — /api/products returns fullPrice 1000,
 * monthlyPrice 25, annualPrice 200 and NO lifetimePrice for this slug, which
 * contradicts both the design and the live Stripe price. The single constant
 * below is the one place to change it, and it should move back to
 * `product.lifetimePrice` the moment the CMS record is corrected. Checkout
 * itself always goes through the backend's Stripe product id, so the amount
 * actually charged comes from Stripe regardless of what renders here.
 *
 * STATS: the design carries "30,000+ AI Prompts" / "10K+ active users" /
 * "1M prompts generated". Per Robert: skip the prompt count and write the copy
 * so it doesn't need one. Nothing on this page asserts a catalogue size.
 */
const SLUG = "complete-ai-bundle";

/** Lifetime price in USD. See the PRICE note above before changing. */
const LIFETIME_PRICE = 150;

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "The Complete AI Bundle",
  description:
    "The #1 AI toolkit for your business and work. Marketing, content, strategy, images, skills, automations — everything your business needs, ready to copy and paste. Lifetime access.",
  alternates: { canonical: `${SITE.url}/complete-ai-bundle` },
  robots: pageRobots({ index: true, follow: true, "max-image-preview": "large" }),
  openGraph: {
    images: [OG_IMAGE],
    title: "The Complete AI Bundle — God of Prompt",
    description:
      "Every paid product, every future drop, every update — locked in for life. One bundle, lifetime access.",
    url: `${SITE.url}/complete-ai-bundle`,
    type: "website",
  },
};

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export default async function CompleteAiBundlePage() {
  const product = await getProductBySlug(SLUG);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "The Complete AI Bundle",
    description:
      "Every paid God of Prompt product, every future drop and every update — one purchase, lifetime access.",
    brand: { "@type": "Brand", name: "God of Prompt" },
    offers: {
      "@type": "Offer",
      price: LIFETIME_PRICE,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE.url}/complete-ai-bundle`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero product={product} />
      <TrustBar />
      <Offer product={product} />
      <Outcomes />
      <AiTimeline />
      <Included />
      <Guarantee product={product} />
      <Faqs />
      <FinalCta product={product} />
    </>
  );
}

/* ── hero (2163:86494) ───────────────────────────────────────────────── */

function Hero({ product }: { product: Product | null }) {
  return (
    <section className="bg-gop-page px-6 pt-16 max-[640px]:px-4 max-[640px]:pt-10">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center text-center">
        <h1 className="m-0 flex flex-col items-center text-[clamp(32px,5vw,56px)] font-extralight leading-[1.08] tracking-[-0.03em] text-gop-ink">
          The Complete AI Bundle for
          <span className="bg-gradient-to-b from-[#4b4949] to-[#1b1a1a] bg-clip-text font-bold italic tracking-[-0.035em] text-transparent">
            Your Business Success
          </span>
        </h1>
        <p className="mx-auto mt-3.5 max-w-[488px] text-[18px] leading-[27px] tracking-[-0.01em] text-gop-ink/60">
          The #1 AI toolkit for your business &amp; work. Marketing, content, strategy, images, skills,
          automations. Everything your business needs, ready to copy and paste.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <CheckoutButton productId={product?.stripeProductId} variant="gold" size="md">
            Get Lifetime Access
          </CheckoutButton>
          {/* Review count + rating are Robert's business figures, not ours to
              derive — left out until confirmed rather than asserted here. */}
        </div>
      </div>
    </section>
  );
}

/* ── the offer card (2163:86521) ─────────────────────────────────────── */

const OFFER_CHIPS = [
  "AI Cheatsheets",
  "AI Tools Directory",
  "Custom GPTs",
  "No-Code Automations",
  "Unlimited Prompt Generator",
];

const OFFER_POINTS = [
  "Create content in seconds",
  "Never run out of ideas",
  "Works with ChatGPT, Claude, Midjourney & more",
  "Prompts that actually convert",
  "Full access to the Prompt Library",
  "Weekly updates, free for life",
];

function Offer({ product }: { product: Product | null }) {
  return (
    <section className="px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[32px] bg-gop-card px-6 py-16 max-[640px]:px-4 max-[640px]:py-10">
        {/* warm corner glow — the design's starfield, done as a gradient so it
            scales without shipping a heavy background image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(253,195,2,0.16),transparent_58%)]"
        />

        <div className="relative flex flex-col items-center text-center">
          <span className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-medium text-white/70">
            Products
          </span>
          <h2 className="m-0 mt-6 flex flex-col text-[clamp(26px,3.4vw,40px)] font-light leading-[1.12] tracking-[-0.03em] text-white">
            One Bundle. Infinite Superpowers.
            <span className="font-bold italic text-gop-gold">Locked in for life.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[420px] text-[15px] leading-6 text-white/55">
            Get full access the way you prefer — flexible monthly, or one-time lifetime.
          </p>
        </div>

        {/* the card */}
        <div className="relative mx-auto mt-10 w-full max-w-[512px] overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/10 bg-gop-dark">
          <div className="bg-[linear-gradient(180deg,#b4541f_0%,#7a3a18_55%,rgba(43,26,20,0)_100%)] px-7 pb-8 pt-6 max-[640px]:px-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white">
                <Crown size={16} aria-hidden />
                Premium
              </span>
              <span className="inline-flex items-center gap-1 text-[13px] text-white/80">
                <Star size={14} className="fill-gop-gold text-gop-gold" aria-hidden />
                Rated by our customers
              </span>
            </div>

            <h3 className="m-0 mt-5 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-white max-[640px]:text-[27px]">
              Complete AI Bundle
            </h3>
            <p className="m-0 mt-2 text-[14px] leading-5 text-white/70">
              Every paid product, every future drop, every update — locked in for life.
            </p>

            <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
              {OFFER_CHIPS.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] text-white/85"
                >
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-mono text-[34px] font-semibold leading-none text-white">
                {fmt(LIFETIME_PRICE)}
              </span>
              <span className="mb-1 text-[13px] text-white/60">/ lifetime — one payment</span>
            </div>

            <p className="m-0 mt-4 flex items-center justify-center gap-1.5 text-[13px] text-gop-gold">
              <Zap size={14} aria-hidden />
              Limited time offer
            </p>

            <div className="mt-3 [&>span]:w-full [&_a]:w-full [&_button]:w-full">
              <CheckoutButton productId={product?.stripeProductId} variant="gold" size="md" className="w-full">
                Get Lifetime Access
              </CheckoutButton>
            </div>
          </div>

          <ul className="m-0 grid list-none gap-3 border-t border-white/10 px-7 py-7 p-0 max-[640px]:px-5">
            {OFFER_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[14px] leading-5 text-white/80">
                <Check size={16} className="mt-0.5 shrink-0 text-gop-gold" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── outcomes (2163:87250) ───────────────────────────────────────────── */

const OUTCOMES = [
  {
    title: "One toolkit, every AI job",
    body: "Marketing, content, strategy, images, automations — stop stitching together free prompts that half-work.",
  },
  {
    title: "Built for the way you work",
    body: "Copy, paste, run. Every prompt is engineered and tested, not scraped from a thread.",
  },
  {
    title: "Grows without costing more",
    body: "New products and updates land in your account automatically. Lifetime means lifetime.",
  },
  {
    title: "Works with the model you use",
    body: "ChatGPT, Claude, Gemini, Midjourney and more — the bundle isn't tied to one vendor.",
  },
];

function Outcomes() {
  return (
    <section className="px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="text-center">
          <h2 className="m-0 text-[clamp(24px,3vw,34px)] font-light tracking-[-0.03em] text-gop-ink">
            Ready to sell AI?{" "}
            <span className="font-bold italic">We&apos;ve got your back, for life.</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {OUTCOMES.map((o) => (
            <div key={o.title} className="rounded-3xl border border-gop-ink-hairline bg-white p-6">
              <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-gop-ink">{o.title}</h3>
              <p className="m-0 mt-2 text-[15px] leading-6 text-gop-ink-muted">{o.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── what's included (2163:87388) ────────────────────────────────────── */

const INCLUDED = [
  { name: "Prompt Library", body: "The full engineered library across every category and model." },
  { name: "Custom GPTs", body: "Ready-to-deploy GPTs with complete system-prompt blueprints." },
  { name: "No-Code Automations", body: "Import-and-run n8n workflows for ops, sales and content." },
  { name: "One-Click AI Guides", body: "Step-by-step guides for every major model." },
  { name: "AI Tools Directory", body: "A curated directory of the tools actually worth using." },
  { name: "Prompt Generator", body: "Generate unlimited custom prompts from your own context." },
];

function Included() {
  return (
    <section className="px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="text-center">
          <h2 className="m-0 text-[clamp(24px,3vw,34px)] font-light tracking-[-0.03em] text-gop-ink">
            All Products. <span className="font-bold italic">Guides and Bonuses.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-6 text-gop-ink-muted">
            Everything below is included — and anything added later is too.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((i) => (
            <div key={i.name} className="rounded-3xl border border-gop-ink-hairline bg-white p-6">
              <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-gop-ink">{i.name}</h3>
              <p className="m-0 mt-2 text-[15px] leading-6 text-gop-ink-muted">{i.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── guarantee / dark CTA banner (2163:109161) ───────────────────────── */

function Guarantee({ product }: { product: Product | null }) {
  return (
    <section className="px-6 py-10 max-[640px]:px-4">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 rounded-[28px] bg-gop-card px-8 py-12 text-center max-[640px]:px-5">
        <h2 className="m-0 max-w-[620px] text-[clamp(22px,2.6vw,30px)] font-light leading-[1.15] tracking-[-0.02em] text-white">
          Get complete AI toolkit — <span className="font-bold italic text-gop-gold">locked in for life.</span>
        </h2>
        <p className="m-0 max-w-[520px] text-[15px] leading-6 text-white/60">
          One payment of {fmt(LIFETIME_PRICE)}. Every product, every future drop, every update.
        </p>
        <CheckoutButton productId={product?.stripeProductId} variant="gold" size="lg">
          Get Lifetime Access
        </CheckoutButton>
        <p className="m-0 text-[13px] text-white/45">7-day risk-free guarantee</p>
      </div>
    </section>
  );
}

/* ── FAQs (2163:107050) ──────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is this a subscription?",
    a: `No. The Complete AI Bundle is a one-time payment of ${fmt(LIFETIME_PRICE)} with lifetime access — no recurring fee.`,
  },
  {
    q: "What exactly do I get?",
    a: "Every paid God of Prompt product: the prompt library, custom GPTs, no-code automations, the guides, the tools directory and the prompt generator — plus anything added later.",
  },
  {
    q: "Do future products cost extra?",
    a: "No. New products and updates land in your account automatically at no additional cost. That's what 'locked in for life' means.",
  },
  {
    q: "Which AI models does it work with?",
    a: "ChatGPT, Claude, Gemini, Midjourney, Grok, DeepSeek and more. The bundle isn't tied to a single vendor.",
  },
  {
    q: "Do I need any technical skill?",
    a: "No. Everything is copy-and-paste. The automations are import-and-run templates with video walkthroughs.",
  },
  {
    q: "What if it isn't for me?",
    a: "There's a 7-day risk-free guarantee — email us within 7 days of purchase for a full refund.",
  },
];

function Faqs() {
  return (
    <section className="mx-auto w-full max-w-[760px] px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <h2 className="text-center text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-gop-ink">
        FAQs
      </h2>
      <p className="mt-2 text-center text-[16px] text-gop-ink-muted">Questions? We&apos;ve got you.</p>
      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
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

/* ── final CTA ───────────────────────────────────────────────────────── */

function FinalCta({ product }: { product: Product | null }) {
  return (
    <section className="px-6 pb-24 max-[640px]:px-4 max-[640px]:pb-14">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-5 text-center">
        <h2 className="m-0 text-[clamp(24px,3vw,34px)] font-light tracking-[-0.03em] text-gop-ink">
          Everything you need. <span className="font-bold italic">One payment.</span>
        </h2>
        <CheckoutButton productId={product?.stripeProductId} variant="gold" size="lg">
          Get Lifetime Access
        </CheckoutButton>
      </div>
    </section>
  );
}
