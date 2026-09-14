import { getProducts, type Product } from "@/lib/api";
import TimelineExplorer, { type TimelineItem } from "./TimelineExplorer";

/**
 * AiTimeline — "AI Evolution Timeline" (Figma 2033:19013): the dark panel
 * with a numbered product-release list + a detail panel. Every entry is a
 * REAL published product from the backend (name, date, copy, CTAs), oldest
 * first — releasing a product in the CMS adds it here on revalidation.
 *
 * The discontinued Text/Image prompt bundles are excluded by Robert's
 * standing directive (they're still `published` in the API; drop this
 * filter once the backend unpublishes them).
 */

const DISCONTINUED = new Set(["Text Prompts Bundle", "Image Prompts Bundle"]);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const PRODUCT_ART: Record<string, string> = {
  "complete-ai-bundle": "/images/home/bundle/complete-bundle.webp",
  "chatgpt-custom-instructions": "/images/products/timeline/custom-instructions-2024.avif",
  "custom-gpts-toolkit": "/images/products/pillars/custom-gpts.avif",
  "ai-tools-directory": "/images/products/pillars/tools-directory.avif",
  "prompt-engineering-guide": "/images/products/pillars/prompt-engineering.avif",
  "mj-mastery-guide": "/images/products/pillars/midjourney.avif",
  "claude-mastery-guide": "/images/products/pillars/claude.avif",
  "gemini-mastery-guide": "/images/products/pillars/gemini.avif",
  "ai-agents-mastery-guide": "/images/products/pillars/agents.avif",
  "system-prompt-generator": "/images/products/pillars/custom-prompt.avif",
  "n8n-automations-bundle": "/images/products/tabs/n8n-automations-bundle.avif",
};

function toItem(p: Product, showArtwork: boolean): TimelineItem | null {
  const t = Date.parse(p.createdAt ?? "");
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    slug: p.slug,
    name: p.name,
    dateShort: `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${String(d.getUTCFullYear()).slice(2)}`,
    dateLong: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    description: p.description,
    stripeProductId: p.stripeProductId,
    landingUrl: p.landingUrl,
    notionUrl: p.notionUrl,
    image: showArtwork ? PRODUCT_ART[p.slug] ?? null : null,
  };
}

export default async function AiTimeline({ showArtwork = false }: { showArtwork?: boolean } = {}) {
  const products = await getProducts(1800);
  const items = products
    .filter((p) => p.status === "published" && !DISCONTINUED.has(p.name))
    .map((product) => toItem(product, showArtwork))
    .filter((i): i is TimelineItem => i !== null)
    .sort((a, b) => {
      const [da, ma, ya] = a.dateShort.split(".").map(Number);
      const [db, mb, yb] = b.dateShort.split(".").map(Number);
      return ya - yb || ma - mb || da - db;
    });

  if (!items.length) return null;

  return (
    <section aria-label="AI Evolution Timeline" className="mx-auto w-full max-w-[1180px] px-6 py-10 max-[640px]:px-4">
      <div
        data-dots-frame
        className="rounded-[32px] border border-white/[0.1] bg-gop-dark px-[clamp(28px,5vw,72px)] py-[clamp(36px,4vw,64px)] text-white shadow-[0_40px_80px_-44px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div className="mb-9 text-center">
          <h2 className="m-0 text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-white">
            AI Evolution Timeline
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-white/55">
            Key milestones that shaped the AI landscape and the tools we created to help you master them.
          </p>
        </div>
        <TimelineExplorer items={items} />
      </div>
    </section>
  );
}
