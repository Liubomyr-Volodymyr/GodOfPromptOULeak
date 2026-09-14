import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo/sitemap-data";
import { INDEXABLE } from "@/lib/seo/robots";

/**
 * robots.txt.
 *
 * PRODUCTION build: allow everything except the internal API routes, and point
 * crawlers at the sitemap (which is backend-driven; see src/app/sitemap.ts).
 *
 * NON-PRODUCTION build (dev deploy, Railway previews, local): crawling stays
 * ALLOWED but nothing is advertised — no sitemap, so these URLs are never
 * offered for discovery. Allow + noindex is the correct de-index combo: a bot
 * has to be able to FETCH the page to see the `noindex` (X-Robots-Tag header
 * from src/proxy.ts + the site-wide robots metadata in src/app/layout.tsx).
 * A blanket `Disallow: /` would hide that noindex and can strand a URL-only
 * listing in the index.
 *
 * The old WP /blog/sitemap_index.xml reference is gone: that path 404s on
 * this app; blog URLs now live in our own sitemap, sourced from WP.
 */
export default function robots(): MetadataRoute.Robots {
  const rules = [{ userAgent: "*", allow: "/", disallow: ["/api/"] }];

  // Staging: no sitemap advertised.
  if (!INDEXABLE) return { rules };

  return { rules, sitemap: `${SITE_ORIGIN}/sitemap.xml` };
}
