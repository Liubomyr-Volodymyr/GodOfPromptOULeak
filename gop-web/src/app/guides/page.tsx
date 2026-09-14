import { OG_IMAGE } from "@/lib/seo/robots";
import type { Metadata } from "next";
import { getGuides, guideModels, guideFormats } from "@/lib/api";
import GuidesGrid from "@/components/guides/GuidesGrid";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /guides — the "AI Guides by God of Prompt" catalog (Figma 1689:9458).
 * The free GUIDES only — a subset of the lead-magnet products (guides.ts
 * gates them; mega-prompts / free packs belong to their own landing pages).
 * Rendered in the GOP brand: hero → filter row → card grid. Every control is
 * backed by real data — the prompt-category rail and the inert Category/Roles
 * dropdowns were removed rather than shown dead. No fabricated ratings.
 * ISR 30-min.
 */
export const revalidate = 1800;

const SITE = SITE_ORIGIN;
export const metadata: Metadata = {
  // Bare title — the root layout template appends " — God of Prompt" (avoid double-brand).
  title: "AI Guides",
  description:
    "Free, easy-to-follow mastery guides for ChatGPT, Claude, Gemini, Grok, Midjourney and more — copy, paste, and ship. Updated monthly.",
  alternates: { canonical: `${SITE}/guides` },
  openGraph: {
    images: [OG_IMAGE],
    title: "AI Guides by God of Prompt",
    description: "Free mastery guides for every major AI model. Updated monthly.",
    url: `${SITE}/guides`,
    type: "website",
  },
};

export default async function GuidesPage() {
  const guides = await getGuides();
  const models = guideModels(guides);
  const formats = guideFormats(guides);

  // ItemList schema over the real catalog — same data the grid renders.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI Guides by God of Prompt",
    numberOfItems: guides.length,
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.name,
      ...(g.landingUrl ? { url: g.landingUrl } : {}),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-[1312px] px-6 pb-20 pt-14 max-[640px]:px-4 max-[640px]:pb-12 max-[640px]:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="m-0 font-sans text-[clamp(26px,2.6vw,34px)] font-light leading-[1.15] tracking-[-0.02em] text-gop-ink">
          AI Guides by{" "}
          <span className="font-semibold italic tracking-[-0.015em] text-gop-ink">God of Prompt</span>
        </h1>
        <p className="m-0 max-w-[52ch] text-gop-body text-gop-ink-soft">
          Explore easy-to-follow guides for top AI models, updated monthly.
        </p>
      </header>

      {/* ── Filter row + guide grid ──────────────────────────────────
             No category rail: those are PROMPT categories (Marketing, Coding,
             Writing…) and they don't describe guides. It was rendered inert for
             visual parity with the Figma, which just put eight dead tiles
             between the hero and the grid. ─────────────────────────── */}
      <div className="mt-14 max-[900px]:mt-10">
        {guides.length === 0 ? (
          <p className="rounded-gop-xl border border-gop-ink-hairline bg-gop-surface px-6 py-16 text-center text-gop-ink-muted">
            Guides are loading — check back in a moment.
          </p>
        ) : (
          <GuidesGrid guides={guides} models={models} formats={formats} />
        )}
      </div>
    </main>
  );
}
