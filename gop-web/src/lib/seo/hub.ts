import hubJson from "@/content/seo/prompt-library-hub.json";
import { getRootCategories } from "@/lib/categories";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * Prompt-library hub SEO content. Single source of truth lives in
 * gop-seo/dist/prompt-library-hub-seo.json, mirrored into this repo at
 * src/content/seo/prompt-library-hub.json (refresh on content changes).
 *
 * The /prompt-library route consumes this verbatim — it does NOT
 * re-author the copy. getHubSeo() is the only accessor.
 */

export type HubGridItem = {
  name: string;
  slug: string;
  description: string;
  live?: boolean;
};

export type HubGrid = {
  section_id: string;
  heading: string;
  items: HubGridItem[];
};

export type HubFaq = {
  id: string;
  question: string;
  answer_html: string;
};

export type HubSeo = {
  head: {
    title: string;
    title_short: string;
    description: string;
    canonical: string;
    robots: string;
    og: {
      type: string;
      title: string;
      description: string;
      url: string;
      image: string;
      image_width: number;
      image_height: number;
      site_name: string;
    };
  };
  h1: string;
  lede: string;
  intro_html: string;
  body_sections_html: string;
  category_grid: HubGrid;
  tool_grid: HubGrid;
  type_grid: HubGrid;
  faqs: HubFaq[];
  schema: {
    collection_page: Record<string, unknown>;
    breadcrumb_list: Record<string, unknown>;
    item_list: Record<string, unknown>;
  };
};

export function getHubSeo(): HubSeo {
  return hubJson as unknown as HubSeo;
}

/**
 * The category link grid, sourced from the LIVE taxonomy so every link
 * resolves. The JSON grid carried stale gop-seo slugs (design, art, lawyers,
 * e-commerce, solopreneurs…) that 404'd against the current categories.json;
 * the authored section id/heading are kept, only the items come from the real
 * root categories.
 */
export function getCategoryGrid(): HubGrid {
  const base = (hubJson as unknown as HubSeo).category_grid;
  return {
    section_id: base.section_id,
    heading: base.heading,
    items: getRootCategories().map((c) => ({ name: c.name, slug: c.slug, description: "" })),
  };
}

/**
 * Build the ItemList JSON-LD from the live category grid so positions
 * stay synced with what actually renders (per the SEO spec — inject the
 * live category list rather than trusting a stale pre-built list).
 */
export function buildItemListSchema(hub: HubSeo): Record<string, unknown> {
  const base = hub.schema.item_list ?? {};
  return {
    ...base,
    itemListElement: getCategoryGrid().items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Thing",
        name: item.name,
        url: `${SITE_ORIGIN}/prompt-library/category/${item.slug}`,
      },
    })),
  };
}
