import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /sitemap.xml enumerates ~9k URLs from the live backend (67 paged prompt
  // fetches + the WP blog) — that one route can exceed the 60s default
  // static-generation timeout on slower networks and fail the whole build.
  staticPageGenerationTimeout: 300,
  // Barrel-file tree-shaking: lucide-react (~500 icons) and @lobehub/icons
  // re-export everything from an index, so a named import can drag the whole
  // module into the client bundle. This rewrites each import to its direct
  // path at compile time — large client-bundle win, zero behavior change.
  experimental: {
    optimizePackageImports: ["lucide-react", "@lobehub/icons"],
  },
  images: {
    // Image hosts the api-dev payloads link to (exampleOutputUrl → the
    // cdn.godofprompt.dev storage CDN) plus the api itself. No Directus,
    // no legacy prod-API host — api-dev.godofprompt.dev is the ONE backend.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.godofprompt.dev" },
      // Product/guide covers (productTabImageUrl → *_Tab.webp). Verified live:
      // 200 for all 10 guides that have a cover. Without this host listed,
      // next/image refuses the URL — which is why GuideCard was stuck on a
      // plain <img> and shipped these unoptimised.
      { protocol: "https", hostname: "cdn-new.godofprompt.dev" },
      { protocol: "https", hostname: "api-dev.godofprompt.dev" },
      // Blog featured images live on the headless WordPress host
      // (godofprompt.ai/blog/wp-content) until /api/blog is populated.
      { protocol: "https", hostname: "godofprompt.ai" },
    ],
  },
};

export default nextConfig;
