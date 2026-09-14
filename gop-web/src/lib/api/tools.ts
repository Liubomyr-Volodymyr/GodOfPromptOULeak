import { API_BASE } from "./base";

/**
 * AI tools taxonomy — sourced entirely from the GOP backend
 * (`GET /api/library/tools`, single tool at `/api/library/tools/{slug}`).
 * The same `tools` collection is shared across the prompt library and (once
 * the api-dev blog cutover lands) the blog, as a tag axis; MCPs/skills will
 * relate to it too. So this is the ONE canonical tool source — no hardcoded
 * lists.
 *
 * The record carries public landing fields (`seoDescription`, `howToUse`,
 * `bestFor`, `pricing*`, `icon`, `heroImageUrl`, …) that the backend fills in
 * over time; every consumer treats a null field as "hide that section" (never
 * fabricate copy). The internal `plb_instructions` authoring field is
 * deliberately NOT surfaced here — it's generator guidance, not public copy.
 */

export type ToolType =
  | "llm"
  | "image-ai"
  | "video-ai"
  | "audio-ai"
  | "coding-ai"
  | "research-ai"
  | "3d-ai"
  | "automation-saas"
  | "productivity-saas"
  | (string & {});

export type Tool = {
  slug: string;
  name: string;
  type: ToolType | null;
  description: string | null;
  url: string | null;
  /** Public SEO/landing copy — filled backend-side; null = hide the section. */
  title: string | null;
  h1: string | null;
  seoDescription: string | null;
  howToUse: string | null;
  bestFor: string | null;
  behavior: string | null;
  tips: string | null;
  pricingModel: string | null;
  pricingSummary: string | null;
  icon: string | null;
  heroImageUrl: string | null;
  screenshotImageUrl: string | null;
  supportsVariables: boolean;
};

type RawTool = {
  slug?: string;
  name?: string;
  type?: string | null;
  description?: string | null;
  url?: string | null;
  title?: string | null;
  h1?: string | null;
  seo_description?: string | null;
  how_to_use?: string | null;
  best_for?: string | null;
  behavior?: string | null;
  tips?: string | null;
  pricing_model?: string | null;
  pricing_summary?: string | null;
  icon?: string | null;
  hero_image_url?: string | null;
  screenshot_image_url?: string | null;
  supports_variables?: boolean | null;
};

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

function toTool(r: RawTool): Tool | null {
  const slug = str(r.slug);
  const name = str(r.name);
  if (!slug || !name) return null;
  return {
    slug,
    name,
    type: str(r.type),
    description: str(r.description),
    url: str(r.url),
    title: str(r.title),
    h1: str(r.h1),
    seoDescription: str(r.seo_description),
    howToUse: str(r.how_to_use),
    bestFor: str(r.best_for),
    behavior: str(r.behavior),
    tips: str(r.tips),
    pricingModel: str(r.pricing_model),
    pricingSummary: str(r.pricing_summary),
    icon: str(r.icon),
    heroImageUrl: str(r.hero_image_url),
    screenshotImageUrl: str(r.screenshot_image_url),
    supportsVariables: r.supports_variables === true,
  };
}

/** Every tool, backend order. `[]` on failure (callers degrade gracefully). */
export async function getTools(revalidate: number | false = 3600): Promise<Tool[]> {
  try {
    const res = await fetch(`${API_BASE}/api/library/tools`, {
      next: { revalidate: revalidate === false ? undefined : revalidate },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: RawTool[] } | RawTool[] | null;
    const rows = Array.isArray(json) ? json : json?.data ?? [];
    return rows.map(toTool).filter((t): t is Tool => t !== null);
  } catch {
    return [];
  }
}

/** A single tool by slug, resolved from the cached full list (one fetch). */
export async function getToolBySlug(
  slug: string,
  revalidate: number | false = 3600,
): Promise<Tool | null> {
  const tools = await getTools(revalidate);
  return tools.find((t) => t.slug === slug) ?? null;
}

/** Lightweight `{ slug, name }` list for filter facets / dropdowns. */
export async function getToolFacets(
  revalidate: number | false = 3600,
): Promise<{ slug: string; name: string }[]> {
  const tools = await getTools(revalidate);
  return tools.map((t) => ({ slug: t.slug, name: t.name }));
}

/** Whether a tool page should be treated as substantive enough to index —
 *  real public copy OR at least one prompt. Existence is never gated (all 50
 *  pages resolve); this only guards indexation against thin pages. */
export function toolHasSubstance(tool: Tool, promptTotal: number | null): boolean {
  return Boolean(
    tool.description ||
      tool.seoDescription ||
      tool.howToUse ||
      tool.bestFor ||
      tool.behavior ||
      tool.pricingSummary ||
      (promptTotal ?? 0) > 0,
  );
}
