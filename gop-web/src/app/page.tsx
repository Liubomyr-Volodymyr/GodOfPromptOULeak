import type { Metadata } from "next";
import { getRootCategories } from "@/lib/categories";
import { buildHomeJsonLd } from "@/lib/seo/home-schema";
import { getProductBySlug } from "@/lib/api";
import { SITE } from "@/lib/home";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import CategoryChips from "@/components/home/CategoryChips";
import PromptTeaser from "@/components/home/PromptTeaser";
import BundleFeature from "@/components/home/BundleFeature";
import AiTimeline from "@/components/home/AiTimeline";
import BundleConstellation from "@/components/home/BundleConstellation";
import AiRevolution from "@/components/home/AiRevolution";
import About from "@/components/home/About";
import FounderStory from "@/components/home/FounderStory";
import Testimonials from "@/components/home/Testimonials";
import NewsletterForm from "@/components/home/NewsletterForm";
import Faq from "@/components/home/Faq";
import FinalCta from "@/components/home/FinalCta";
import { pageRobots, OG_IMAGE } from "@/lib/seo/robots";

/**
 * Homepage — the #1 ranked, #1 trafficked page. Server-rendered (RSC) per
 * HOMEPAGE-TOR.md: one <h1>, honest counts (NO "30,000+"), self canonical,
 * Organization + WebSite + ItemList schema (+ Product when a real price is
 * set), internal links to 19 categories / 7 tools / blog, native-<details>
 * FAQ (no FAQPage schema). Everything in the HTML for AI crawlers.
 */

export const revalidate = 3600; // homepage content changes rarely

export const metadata: Metadata = {
  // `absolute` — the homepage owns its full title; skip the layout's
  // "%s — God of Prompt" template so the brand isn't appended twice.
  title: {
    absolute: "God of Prompt: The Most Powerful AI Prompt Library for ChatGPT & Claude",
  },
  description:
    "The most powerful library of engineered, fully customizable AI prompts for ChatGPT, Claude, Gemini and every major model — built with a community of pros who ship. Copy, customize, and run in one click.",
  alternates: { canonical: `${SITE.url}/` },
  robots: pageRobots({
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  }),
  openGraph: {
    images: [OG_IMAGE],
    title: "God of Prompt — The Most Powerful AI Prompt Library & Community",
    description:
      "Engineered, customizable AI prompts for ChatGPT, Claude, Gemini and every major model — plus a community of pros who ship. Built for people who get things done.",
    url: `${SITE.url}/`,
    siteName: SITE.name,
    type: "website",
    // TODO(content): ship a branded 1200×630 og image and reference it here.
  },
  twitter: {
    card: "summary_large_image",
    site: "@godofprompt",
    title: "God of Prompt — The Most Powerful AI Prompt Library & Community",
    description:
      "Engineered, customizable AI prompts for every major model, plus a community of pros who ship.",
  },
};

export default async function HomePage() {
  const categories = getRootCategories();
  const jsonLd = buildHomeJsonLd(categories);

  // The bundle CTA target — the backend's STRIPE PRODUCT ID, threaded to every
  // "buy the bundle" CTA. Clicking asks gop-back to mint a Checkout session.
  //
  // NOT the products API's `checkoutUrl`: those point at checkout.godofprompt.ai,
  // a custom Stripe payment-link domain with no DNS record — every one of them
  // is a dead link (see lib/api/products.ts).
  const bundle = await getProductBySlug("complete-ai-bundle");
  const bundleProductId = bundle?.stripeProductId ?? null;

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <Hero bundleProductId={bundleProductId} />
      <TrustBar />
      <CategoryChips />
      <PromptTeaser bundleProductId={bundleProductId} />
      <BundleFeature />
      <AiTimeline />
      <BundleConstellation />
      <FounderStory />
      <Testimonials />
      <AiRevolution bundleProductId={bundleProductId} />
      <About />
      <NewsletterForm />
      <Faq />
      <FinalCta bundleProductId={bundleProductId} />
    </>
  );
}
