import type { MetadataRoute } from "next";
import { coreEntries, comboEntries, blogEntries, promptEntries } from "@/lib/seo/sitemap-data";

/**
 * ONE sitemap at the standard /sitemap.xml — ~9k URLs today (static + pSEO
 * facets/combos + all prompts + blog), comfortably under the 50k-per-file
 * limit, so no shard/index indirection. Every URL comes from the same
 * backend sources the pages render from (src/lib/seo/sitemap-data.ts);
 * revalidates daily, so backend changes propagate without a deploy.
 */

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each source is guarded so a flaky backend fetch during build export can
  // never fail the whole build — the sitemap degrades to whatever resolved.
  const [core, blog, prompts] = await Promise.all([
    coreEntries().catch(() => [] as Awaited<ReturnType<typeof coreEntries>>),
    blogEntries().catch(() => [] as Awaited<ReturnType<typeof blogEntries>>),
    promptEntries().catch(() => [] as Awaited<ReturnType<typeof promptEntries>>),
  ]);
  return [...core, ...comboEntries(), ...blog, ...prompts];
}
