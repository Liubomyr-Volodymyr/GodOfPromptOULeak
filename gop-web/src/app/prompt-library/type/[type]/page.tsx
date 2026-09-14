import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PseoLibraryView from "@/components/prompts/PseoLibraryView";
import { pseoTitle } from "@/lib/seo/pseo";
import { OG_IMAGE, pageRobots } from "@/lib/seo/robots";
import { getPromptedOutputTypes, MIN_PROMPTS_FOR_PAGE } from "@/lib/categories";
import { getPromptsByType, getFacets, getOutputTypeCount } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/type/[type] — prompts filtered by output type.
 *
 * The set is whatever the backend serves with >=1 prompt: text · image · code
 * · presentation. It was hardcoded to text+image, so /type/code (236 prompts)
 * did not exist. Self-canonical; below the substance floor it is noindexed
 * rather than absent, because the format toggle links to every type.
 */
export const revalidate = 300;

/** Output types below the substance floor — rendered, never advertised. */
const THIN_TYPES = new Set(
  getPromptedOutputTypes().filter((t) => t.count < MIN_PROMPTS_FOR_PAGE).map((t) => t.slug),
);

const TYPES: Record<
  string,
  { id: number; name: string; label: string; blurb: string; models: string; uses: string }
> = {
  text: {
    id: 1,
    name: "Text",
    label: "Text Prompts",
    blurb: "Prompts for ChatGPT, Claude, Gemini, Grok and DeepSeek — writing, analysis, code, strategy.",
    models: "ChatGPT, Claude, Gemini, Grok & DeepSeek",
    uses: "copywriting, analysis, strategy, email, code and research",
  },
  image: {
    id: 2,
    name: "Image",
    label: "Image Prompts",
    blurb: "Prompts for Midjourney, Nano Banana and other image models — photography, art, product shots.",
    models: "Midjourney, Nano Banana, DALL·E, Flux & Ideogram",
    uses: "product shots, portraits, mockups, illustration and brand art",
  },
  // 236 prompts, bigger than several category pages that already rank — it was
  // missing only because this map was hardcoded to text+image.
  code: {
    id: 3,
    name: "Code",
    label: "Code Prompts",
    blurb: "Prompts for Cursor, Claude Code and the coding models — reviews, refactors, tests, debugging.",
    models: "Claude Code, Cursor, ChatGPT, Gemini & DeepSeek",
    uses: "code review, refactoring, test generation, debugging and architecture",
  },
  // 1 prompt. It EXISTS because the format toggle now offers every backend
  // output type, and a filter option must not link to a 404 — but it stays out
  // of the sitemap and is noindexed by the substance gate below.
  presentation: {
    id: 4,
    name: "Presentation",
    label: "Presentation Prompts",
    blurb: "Prompts that produce slide decks and presentation outlines.",
    models: "ChatGPT, Claude & Gemini",
    uses: "decks, pitch outlines and talk structure",
  },
};

type Params = { type: string };

export async function generateStaticParams() {
  // `output_type` is a real server filter now (verified: text 5,654 · image 743
  // · code 236 · presentation 1), so each count is ONE request and the old
  // corpus-scan warm-up here is gone.
  return Object.keys(TYPES).map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { type } = await params;
  const t = TYPES[type];
  if (!t) return { title: "Prompts" };

  // Title/description name the MODELS people actually search for and the jobs
  // they hire the prompts for. Was a bare "Image Prompts" plus a one-line
  // blurb — nothing to distinguish it in a SERP.
  //
  // Deliberately NO count here. generateMetadata runs in a separate pass from
  // the page body, so fetching the count a second time doubled the corpus-scan
  // pressure and knocked /type/image out of prerendering entirely. The H1 still
  // shows the real number; the title does not need it.
  return {
    title: `AI ${t.label} for ${t.models}`,
    description: `Engineered AI ${t.name.toLowerCase()} prompts for ${t.models}. Ready to copy and run — ${t.uses}. Free to browse, no sign-up.`,
    alternates: { canonical: `${SITE_ORIGIN}/prompt-library/type/${type}` },
    // Same floor as every other axis: below it the page renders and links out
    // but doesn't ask to rank (presentation has 1 prompt).
    robots: pageRobots({ index: !THIN_TYPES.has(type), follow: true }),
    openGraph: {
      images: [OG_IMAGE],
      title: `AI ${t.label} for ${t.models}`,
      description: t.blurb,
      url: `${SITE_ORIGIN}/prompt-library/type/${type}`,
      type: "website",
    },
  };
}

export default async function TypePage({ params }: { params: Promise<Params> }) {
  const { type } = await params;
  const t = TYPES[type];
  if (!t) notFound();

  const [prompts, facets, typeCount] = await Promise.all([
    getPromptsByType(type, 36),
    getFacets({ outputType: type }),
    getOutputTypeCount(type),
  ]);
  // The real number of prompts of this output type — one request once the
  // backend filters on output_type, a cached daily full count until then.
  // Still null-safe: an absent number beats a wrong one.
  const total = typeCount ?? facets?.total ?? null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_ORIGIN}/prompt-library` },
      { "@type": "ListItem", position: 2, name: t.label, item: `${SITE_ORIGIN}/prompt-library/type/${type}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <PseoLibraryView
        selection={{ format: { slug: type, name: t.name } }}
        prompts={prompts}
        total={total}
        facets={facets}
      />
    </>
  );
}
