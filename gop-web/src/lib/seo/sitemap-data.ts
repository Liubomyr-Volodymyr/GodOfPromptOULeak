import type { MetadataRoute } from "next";
import { getPromptsPage, getPromptCount, getPosts, getBlogCategories, getBlogAuthors } from "@/lib/api";
import {
  getRootCategories,
  mintableCategories,
  mintableTools,
  mintableOutputTypes,
  MIN_PROMPTS_FOR_PAGE,
} from "@/lib/categories";
import { getRoles } from "@/lib/roles";
import { TOOL_FACETS } from "@/lib/seo/pseo";

/**
 * Sitemap data layer — every URL is enumerated from the SAME sources the
 * routes render from (backend APIs + the app's own taxonomy modules), so the
 * sitemap can never advertise a page the site doesn't serve, and backend
 * changes (new prompt, renamed product, new tool) propagate on revalidation.
 * Replaces the old static public/sitemap.xml snapshot from the Caddy/SPA era.
 *
 * Sections (composed in src/app/sitemap.ts):
 *   core     — static pages + single-facet library hubs
 *   combos   — the 4 BUILD 2-axis pSEO combos (spec in pseo.ts /
 *              taxonomy-graph.ts: tool×audience, category×audience,
 *              type×audience, tool×category; tool×type never minted)
 *   blog     — posts + categories + authors (WP is the blog truth;
 *              the old /blog/sitemap_index.xml 404s on this app)
 *   prompts  — every prompt detail page, from the live feed
 *
 * Sitemap URLs are always the canonical production origin — matching every
 * page's self-canonical — regardless of which host serves the XML.
 */

import { SITE_ORIGIN } from "./site";
export { SITE_ORIGIN };
/** The API caps list pages at 100 items. */
const PROMPTS_PAGE = 100;
const FETCH_BATCH = 8;

export type Entry = MetadataRoute.Sitemap[number];

const abs = (path: string): Entry => ({ url: `${SITE_ORIGIN}${path}` });

/* ── shard 0: static pages + single-facet hubs ──────────────────────── */

export async function coreEntries(): Promise<Entry[]> {
  const out: Entry[] = [
    abs("/"),
    abs("/prompt-library"),
    abs("/prompt-library/all"),
    abs("/blog"),
    abs("/guides"),
    abs("/tools"),
    abs("/prompt-generator"),
    abs("/n8n-automations-bundle"),
  ];
  // Roots AND subcategories that clear the substance floor. Subcategories are
  // the specific head terms ("Financial Modeling", "Ad Copy") and were absent
  // from the sitemap entirely while the taxonomy came from a stale mirror.
  for (const c of mintableCategories()) out.push(abs(`/prompt-library/category/${c.slug}`));
  for (const r of getRoles()) out.push(abs(`/prompt-library/for/${r.slug}`));
  // Output types with real volume — includes /type/code (236 prompts), which
  // was hardcoded out; excludes `presentation`, which has exactly one.
  for (const t of mintableOutputTypes()) out.push(abs(`/prompt-library/type/${t.slug}`));
  // Tools with real volume. Minting from the raw /api/library/tools list put
  // 27 prompt-free tool pages (zapier, n8n, elevenlabs…) in the sitemap.
  for (const t of mintableTools()) out.push(abs(`/prompt-library/tool/${t.slug}`));
  return out;
}

/* ── shard 1: BUILD combo pages ─────────────────────────────────────── */

export function comboEntries(): Entry[] {
  const out: Entry[] = [];
  const roles = getRoles();
  // Combos stay ROOT-only on the category axis. Crossing 88 mintable
  // subcategories with 25 audiences would mint 2,200 pages averaging a
  // handful of prompts each — the thin-page trap, at scale. And a root that
  // is itself below the floor can't produce a substantial combo, so the same
  // filter applies before multiplying.
  const cats = getRootCategories().filter((c) => c.count >= MIN_PROMPTS_FOR_PAGE);
  // Combos use the canonical 7-tool facet list (pseo.ts), not the full tools
  // directory — mirroring what the library filter row and cross-links mint.
  for (const t of TOOL_FACETS) {
    for (const r of roles) out.push(abs(`/prompt-library/tool/${t.slug}/for/${r.slug}`));
    for (const c of cats) out.push(abs(`/prompt-library/tool/${t.slug}/${c.slug}`));
  }
  for (const c of cats) {
    for (const r of roles) {
      if (c.slug === r.slug) continue; // dedupes to /for/{audience} (canonicalHref)
      out.push(abs(`/prompt-library/category/${c.slug}/for/${r.slug}`));
    }
  }
  for (const type of mintableOutputTypes()) {
    for (const r of roles) out.push(abs(`/prompt-library/type/${type.slug}/for/${r.slug}`));
  }
  return out;
}

/* ── shard 2: blog ──────────────────────────────────────────────────── */

export async function blogEntries(): Promise<Entry[]> {
  const out: Entry[] = [];
  const first = await getPosts({ page: 1, perPage: 100 });
  const pages = [first.posts];
  const rest = Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => i + 2);
  for (let i = 0; i < rest.length; i += FETCH_BATCH) {
    const batch = await Promise.all(
      rest.slice(i, i + FETCH_BATCH).map((page) => getPosts({ page, perPage: 100 })),
    );
    for (const b of batch) pages.push(b.posts);
  }
  for (const post of pages.flat()) {
    out.push({ url: `${SITE_ORIGIN}/blog/${post.slug}`, lastModified: post.modified || post.date });
  }
  const [categories, authors] = await Promise.all([getBlogCategories(), getBlogAuthors()]);
  for (const c of categories) out.push(abs(`/blog/category/${c.slug}`));
  for (const a of authors) out.push(abs(`/blog/author/${a.slug}`));
  return out;
}

/* ── prompts: every detail page, from the live feed ─────────────────── */

export async function promptEntries(): Promise<Entry[]> {
  const total = await getPromptCount();
  const offsets: number[] = [];
  for (let o = 0; o < (total || PROMPTS_PAGE); o += PROMPTS_PAGE) offsets.push(o);
  const out: Entry[] = [];
  for (let i = 0; i < offsets.length; i += FETCH_BATCH) {
    const batch = await Promise.all(
      offsets.slice(i, i + FETCH_BATCH).map((offset) =>
        getPromptsPage({ limit: PROMPTS_PAGE, offset, sort: "views_count", order: "DESC", revalidate: 86400 }),
      ),
    );
    for (const page of batch) {
      for (const p of page.prompts) {
        out.push({
          url: `${SITE_ORIGIN}/prompt-library/${p.slug}`,
          ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
        });
      }
    }
  }
  return out;
}
