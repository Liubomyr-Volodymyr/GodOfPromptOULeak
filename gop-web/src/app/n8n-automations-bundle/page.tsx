import { OG_IMAGE } from "@/lib/seo/robots";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Check, X, Clock } from "lucide-react";
import CheckoutButton from "@/components/products/CheckoutButton";
import { getProductBySlug, type Product } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /n8n-automations-bundle — the n8n Automations Bundle sales page
 * (Figma 1930:17734). EVERYTHING is sourced from the backend product
 * (getProductBySlug): name, description, prices, features, checkout, Notion
 * delivery. Prices show the anchor `fullPrice` struck through and the live
 * `lifetimePrice` — change them in the backend and this page updates.
 *
 * Honesty: the illustrative "cost of manual work" math is clearly framed as an
 * example (not a claimed product metric); the social-proof sections keep their
 * layout but carry number-free copy — NO fabricated reviews / customer counts /
 * scarcity timers, and no placeholder testimonials.
 */
const SLUG = "n8n-automations-bundle";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProductBySlug(SLUG);
  if (!p) return { title: "n8n Automations Bundle" };
  return {
    title: { absolute: `${p.name} — Plug-and-Play n8n Workflows | God of Prompt` },
    description:
      p.description ??
      "Plug-and-play n8n automations for your business — import, activate, done. No code required. Pay once, lifetime updates.",
    alternates: { canonical: `${SITE_ORIGIN}/${SLUG}` },
    // Falls back to the generated share image — the backend product image is
    // null (that bucket answers 403), and gating the whole openGraph block on
    // it left this page with no preview at all.
    openGraph: { images: [p.ogImage ? { url: p.ogImage } : OG_IMAGE] },
  };
}

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export default async function N8nBundlePage() {
  const product = await getProductBySlug(SLUG);
  if (!product) notFound();

  // Product rich-result schema — same backend fields the page renders, so it
  // can never disagree with the visible price. No aggregateRating: the
  // backend has no ratings field, and we never synthesize one.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.ogImage ? { image: product.ogImage } : {}),
    url: `${SITE_ORIGIN}/${SLUG}`,
    brand: { "@type": "Brand", name: "God of Prompt" },
    ...(product.lifetimePrice
      ? {
          offers: {
            "@type": "Offer",
            price: product.lifetimePrice,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_ORIGIN}/${SLUG}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero product={product} />
      <Problem />
      <Investment product={product} />
      <Inside product={product} />
      <WhatYouGet />
      <Pricing product={product} />
      <Reality />
      <SocialProof />
      <Faqs />
      <FinalCta product={product} />
    </>
  );
}

/* ── shared bits ─────────────────────────────────────────────────────── */

// The site's DS CTA — not a bespoke button. Gold variant; posts the product's
// Stripe id to gop-back, which mints the Checkout session.
function BuyCta({ product, label = "Get all templates", className = "" }: { product: Product; label?: string; className?: string }) {
  return (
    <CheckoutButton
      variant="gold"
      size="lg"
      productId={product.stripeProductId}
      href={product.landingUrl}
      className={className}
      iconAfter={<ArrowRight size={18} aria-hidden />}
    >
      {label}
    </CheckoutButton>
  );
}

/** Anchor (struck) fullPrice + live lifetimePrice, both from the backend. */
function PriceTag({ product, size = "lg" }: { product: Product; size?: "lg" | "xl" }) {
  const live = product.lifetimePrice;
  const anchor = product.fullPrice;
  const liveCls = size === "xl" ? "text-[56px]" : "text-[40px]";
  return (
    <div className="flex items-end justify-center gap-3">
      {live != null ? (
        <span className={`font-mono font-semibold leading-none tracking-[-0.02em] text-gop-accent-yellow ${liveCls}`}>
          {fmt(live)}
        </span>
      ) : (
        <span className={`font-mono font-semibold leading-none text-gop-accent-yellow ${liveCls}`}>—</span>
      )}
      {anchor != null && anchor !== live && (
        <span className="mb-1 font-mono text-[20px] text-white/40 line-through">{fmt(anchor)}</span>
      )}
    </div>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────── */

function Hero({ product }: { product: Product }) {
  return (
    <section className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-6 pt-14 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] max-[900px]:grid-cols-1 max-[640px]:px-4 max-[640px]:pt-8">
      <div className="flex flex-col items-start gap-6">
        <h1 className="m-0 font-sans text-[clamp(36px,4.6vw,56px)] leading-[1.05] tracking-[-0.03em] text-gop-ink">
          Automations that run your <span className="font-black italic">business while you sleep</span>
        </h1>
        <p className="m-0 max-w-[480px] text-[17px] leading-[1.5] text-gop-ink-muted">
          {product.description ?? "10+ plug-and-play n8n workflows. Import, activate, walk away — no code required."}
        </p>
        <p className="m-0 inline-flex items-center gap-2 text-[15px] text-gop-ink-muted">
          <Check size={16} className="text-gop-ink" aria-hidden />
          Delivered via Notion · <span className="font-semibold text-gop-ink">Pay once</span>, lifetime updates
        </p>
        <div className="flex flex-col items-start gap-2">
          <BuyCta product={product} />
          <span className="text-[12px] text-gop-ink-soft">Instant download · Video tutorials · All future templates</span>
        </div>
      </div>

      {/* Hero illustration — exported directly from Figma (1930:18113). */}
      <div className="w-full">
        <Image
          src="/images/n8n/hero-mockup.webp"
          alt="n8n automation templates — a JSON workflow turning a logo input into generated UGC"
          width={1218}
          height={1014}
          className="h-auto w-full"
          priority
        />
      </div>
    </section>
  );
}

/* ── 2. Problem (dark) ───────────────────────────────────────────────── */

function Problem() {
  return (
    <section className="relative isolate overflow-hidden bg-[#111111] text-white">
      {/* The ENTIRE section is one composited image (Figma 2084:13464):
          starfield + printer + receipt + fire. The heading sits over the top
          stars, so the starfield is continuous behind everything — no flat gap,
          no seam. Image edges are #111111, matching the section. */}
      <Image
        src="/images/n8n/problem-section.webp"
        alt="A weekly-cost receipt for manual work — 15 hrs, $2,250/week, ~$117,000/year — printing out and going up in flames"
        width={2880}
        height={2436}
        className="mx-auto block w-full max-w-[1440px]"
        priority
      />
      {/* Heading overlaid on the top starfield */}
      <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[4.2%] text-center">
        <Eyebrow dark>The problem</Eyebrow>
        <h2 className="mx-auto mt-4 max-w-2xl text-[clamp(28px,3.4vw,42px)] font-semibold leading-tight tracking-[-0.02em]">
          The bill you pay every week.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-white/55">Every manual task is money you&apos;re not making.</p>
      </div>
      <p className="absolute inset-x-0 bottom-6 px-6 text-center text-[13px] text-white/40">
        Illustrative — based on an example $150/hr rate. Your numbers will differ.
      </p>
    </section>
  );
}

/* ── 3. Investment (dark) ────────────────────────────────────────────── */

function Investment({ product }: { product: Product }) {
  return (
    <section className="bg-[#111111] pb-24 text-white max-[640px]:pb-16">
      <div className="mx-auto w-full max-w-[1180px] px-6 text-center max-[640px]:px-4">
        <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[13px] text-white/70">Your investment today</span>
        <div className="mt-5">
          <PriceTag product={product} size="xl" />
        </div>
        <p className="mt-2 text-[13px] text-white/45">one-time · lifetime updates</p>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: "15 hrs", l: "Wasted every week" },
            { v: "$2,250", l: "Lost every week" },
            { v: "$117K", l: "Gone per year" },
            { v: "350 hrs", l: "To build it yourself" },
          ].map((s) => (
            <div key={s.l} className="rounded-gop-lg border border-white/10 bg-white/[0.04] px-4 py-4 text-left">
              <p className="m-0 font-mono text-[20px] font-medium">{s.v}</p>
              <p className="mt-1 text-[12px] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-white/35">Illustrative — based on an example $150/hr rate.</p>

        <div className="mt-9">
          {product.lifetimePrice != null && (
            <p className="mb-4 text-[15px] text-white/60">
              Keep paying. Or fix it for <span className="font-semibold text-white">{fmt(product.lifetimePrice)}</span>.
            </p>
          )}
          <BuyCta product={product} />
        </div>
      </div>
    </section>
  );
}

/* ── 4. Import once / Run forever — the without vs with comparison ────── */

const WITHOUT = [
  { step: "Watching tutorials", t: "2h" },
  { step: "Half-working setup", t: "4h" },
  { step: "Debugging errors", t: "6h" },
  { step: "Rebuilding again", t: "2h" },
  { step: "Still not running", t: "15+ hrs lost", bad: true },
];
const WITH = [
  { step: "Import template", t: "1 min" },
  { step: "Connect accounts", t: "2 min" },
  { step: "Activate workflow", t: "1 min" },
  { step: "Running automatically", t: "" },
  { step: "Live in 15 minutes", t: "", good: true },
];

function Inside({ product }: { product: Product }) {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-24 text-center max-[640px]:px-4 max-[640px]:py-16">
      <h2 className="m-0 text-[clamp(28px,3.4vw,40px)] font-semibold tracking-[-0.02em] text-gop-ink">
        Import once. <span className="font-black italic">Run forever.</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[16px] text-gop-ink-muted">Not tutorials. Ready-to-run workflows.</p>

      <div className="mx-auto mt-10 grid max-w-4xl items-start gap-4 sm:grid-cols-2">
        {/* Without */}
        <div className="overflow-hidden rounded-gop-lg border border-red-500/20 bg-white text-left">
          <div className="flex items-center justify-between border-b border-red-500/15 bg-red-500/[0.06] px-5 py-3">
            <span className="font-mono text-[14px] text-red-500">Without-templates.json</span>
            <span className="font-mono text-[13px] text-red-500/80">15+ hours</span>
          </div>
          <ul className="divide-y divide-gop-ink-hairline">
            {WITHOUT.map((r) => (
              <li key={r.step} className={`flex items-center justify-between px-5 py-3 text-[14px] ${r.bad ? "bg-red-500/[0.04]" : ""}`}>
                <span className="inline-flex items-center gap-2 text-gop-ink-muted">
                  <X size={15} className="shrink-0 text-red-500" aria-hidden /> {r.step}
                </span>
                <span className="shrink-0 font-mono text-[13px] text-gop-ink-soft">{r.t}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* With */}
        <div className="overflow-hidden rounded-gop-lg border border-emerald-500/25 bg-white text-left">
          <div className="flex items-center justify-between border-b border-emerald-500/15 bg-emerald-500/[0.06] px-5 py-3">
            <span className="font-mono text-[14px] text-emerald-600">With-templates.json</span>
            <span className="font-mono text-[13px] text-emerald-600/80">max 5 min</span>
          </div>
          <ul className="divide-y divide-gop-ink-hairline">
            {WITH.map((r) => (
              <li key={r.step} className={`flex items-center justify-between px-5 py-3 text-[14px] ${r.good ? "bg-emerald-500/[0.05]" : ""}`}>
                <span className="inline-flex items-center gap-2 text-gop-ink-muted">
                  <Check size={15} className="shrink-0 text-emerald-600" aria-hidden /> {r.step}
                </span>
                {r.t && <span className="shrink-0 font-mono text-[13px] text-gop-ink-soft">{r.t}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Took me 350h banner */}
      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-2xl bg-gop-ink px-8 py-8 text-white">
        <p className="m-0 text-[clamp(17px,2vw,22px)] font-semibold">
          Took me 350 hours to build. <span className="text-gop-accent-yellow">Takes you 5 minutes to install.</span>
        </p>
        <BuyCta product={product} />
      </div>
    </section>
  );
}

/* ── 5. What you get (deliverables) ──────────────────────────────────── */

// Illustrations exported from Figma (deliverable cards 1974:11310/353/397/440).
const DELIVERABLES = [
  { img: "/images/n8n/get-templates.webp", title: "10+ templates", sub: "Ready to import" },
  { img: "/images/n8n/get-video.webp", title: "Video tutorials", sub: "Step by step" },
  { img: "/images/n8n/get-lifetime.webp", title: "Lifetime updates", sub: "Future templates free" },
  { img: "/images/n8n/get-instant.webp", title: "Instant access", sub: "Download now" },
];

function WhatYouGet() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 pb-8 max-[640px]:px-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERABLES.map((d) => (
          <div key={d.title} className="overflow-hidden rounded-gop-lg border border-gop-ink-hairline bg-white">
            <Image src={d.img} alt="" width={854} height={446} className="h-auto w-full" />
            <div className="px-6 pb-6 pt-1">
              <p className="m-0 text-[16px] font-semibold text-gop-ink">{d.title}</p>
              <p className="mt-1 mb-0 text-[13px] text-gop-ink-soft">{d.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── 6. Pricing card + guarantee ─────────────────────────────────────── */

function Pricing({ product }: { product: Product }) {
  const features = product.features.length
    ? product.features
    : ["10+ ready-to-run automations", "Video tutorials for each", "Lifetime updates, no subscription"];
  return (
    <section className="bg-[#111111] py-24 text-white max-[640px]:py-16">
      <div className="mx-auto grid w-full max-w-[860px] gap-8 px-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] max-[640px]:px-4">
        {/* card */}
        <div className="rounded-2xl bg-white p-7 text-gop-ink shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold">{product.name}</span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            {product.lifetimePrice != null && (
              <span className="font-mono text-[34px] font-semibold leading-none">{fmt(product.lifetimePrice)}</span>
            )}
            {product.fullPrice != null && product.fullPrice !== product.lifetimePrice && (
              <span className="mb-1 font-mono text-[16px] text-gop-ink-faint line-through">{fmt(product.fullPrice)}</span>
            )}
            <span className="mb-1 text-[14px] text-gop-ink-soft">/ lifetime</span>
          </div>
          {product.notionUrl && <p className="mt-2 text-[13px] text-gop-ink-soft">Delivered via Notion</p>}

          <ul className="mt-5 space-y-2.5 border-t border-gop-ink-hairline pt-5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px] leading-5 text-gop-ink-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-gop-ink" aria-hidden />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <BuyCta product={product} label="Get instant access" className="w-full" />
          </div>
          <p className="mt-3 text-center text-[12px] text-gop-ink-soft">Secure checkout · Instant delivery</p>
        </div>

        {/* guarantee */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
          <Image src="/images/n8n/guarantee-badge.webp" alt="100% money-back guarantee badge" width={477} height={556} className="h-24 w-auto" />
          <p className="mt-4 mb-0 text-[18px] font-semibold">7-Day Risk-Free Guarantee</p>
          <p className="mt-2 mb-0 text-[13px] leading-5 text-white/55">
            If you&apos;re not satisfied, request a full refund within 7 days of purchase — no questions asked.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 7. Reality (this is / this is not) ──────────────────────────────── */

const IS = [
  "Ready-to-run automations that save real hours",
  "Templates you customize for your workflow",
  "Tools you still set up and maintain",
];
const IS_NOT = [
  "Magic that does the thinking for you",
  "Set-and-forget with zero effort",
  "A replacement for running your business",
];

function Reality() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-24 text-center max-[640px]:px-4 max-[640px]:py-16">
      <Eyebrow>What this is</Eyebrow>
      <h2 className="mx-auto mt-4 text-[clamp(28px,3.4vw,40px)] font-semibold tracking-[-0.02em] text-gop-ink">
        Templates, not magic.
      </h2>
      <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded-gop-lg border border-gop-ink-hairline bg-white p-6 text-left">
          <p className="m-0 mb-3 text-[14px] font-semibold text-emerald-600">This is</p>
          {IS.map((t) => (
            <p key={t} className="my-2 flex items-start gap-2 text-[14px] text-gop-ink-muted">
              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {t}
            </p>
          ))}
        </div>
        <div className="rounded-gop-lg border border-gop-ink-hairline bg-white p-6 text-left">
          <p className="m-0 mb-3 text-[14px] font-semibold text-red-500">This is not</p>
          {IS_NOT.map((t) => (
            <p key={t} className="my-2 flex items-start gap-2 text-[14px] text-gop-ink-muted">
              <X size={16} className="mt-0.5 shrink-0 text-red-500" aria-hidden /> {t}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 8. Social proof (layout kept, honest + number-free) ─────────────── */

function SocialProof() {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 pb-8 text-center max-[640px]:px-4">
      <Eyebrow>Why trust these</Eyebrow>
      <h2 className="mx-auto mt-4 max-w-2xl text-[clamp(24px,3vw,36px)] font-semibold tracking-[-0.02em] text-gop-ink">
        The workflows I actually use to run God of Prompt.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[16px] text-gop-ink-muted">
        People kept asking what I was running behind the scenes — so I packaged it. Built over months of real work; yours
        in five minutes.
      </p>
      {/* Real customer testimonials go here once provided — intentionally not
          faked. */}
    </section>
  );
}

/* ── 9. FAQ ──────────────────────────────────────────────────────────── */

const FAQS = [
  { q: "Do I need to know how to code?", a: "No. Every automation is a ready-made n8n template — you import it, connect your accounts, and activate. No code required." },
  { q: "What if I don't have n8n yet?", a: "n8n has a free tier and a cloud option. The included video tutorials walk you through setup from scratch." },
  { q: "Is it a subscription?", a: "No. It's a one-time purchase with lifetime access and free future templates — no recurring fee." },
];

function Faqs() {
  return (
    <section className="mx-auto w-full max-w-[760px] px-6 py-20 max-[640px]:px-4">
      <h2 className="text-center text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-gop-ink">FAQs</h2>
      <p className="mt-2 text-center text-[16px] text-gop-ink-muted">Questions? We&apos;ve got you.</p>
      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-gop-lg border border-gop-ink-hairline bg-white px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-gop-ink">
              {f.q}
              <span className="text-gop-ink-soft transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-3 mb-0 text-[14px] leading-6 text-gop-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── 10. Final CTA (dark, no scarcity) ───────────────────────────────── */

function FinalCta({ product }: { product: Product }) {
  return (
    <section className="bg-[#111111] py-24 text-center text-white max-[640px]:py-16">
      <div className="mx-auto w-full max-w-[560px] px-6 max-[640px]:px-4">
        <PriceTag product={product} size="xl" />
        <p className="mt-2 text-[13px] text-white/45">one-time · lifetime updates included</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/60">
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-gop-accent-yellow" /> 10+ templates</span>
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-gop-accent-yellow" /> Video tutorials</span>
          <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-gop-accent-yellow" /> All future templates</span>
        </div>
        <div className="mt-8">
          <BuyCta product={product} label="Get the templates" />
        </div>
        <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[12px] text-white/45">
          <Clock size={13} /> 5-minute install · works immediately
        </p>
      </div>
    </section>
  );
}

/* ── eyebrow pill ────────────────────────────────────────────────────── */

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={
        "inline-block rounded-full border px-4 py-1.5 text-[13px] font-medium " +
        (dark ? "border-white/15 bg-white/5 text-white/70" : "border-gop-ink-hairline bg-white text-gop-ink-muted")
      }
    >
      {children}
    </span>
  );
}
