import type { Metadata } from "next";

/**
 * Search-indexability, decided at BUILD time.
 *
 * Only a build that explicitly opts in (`NEXT_PUBLIC_INDEXABLE=1`, set on the
 * production Railway service) may emit positive robots directives. Every other
 * build — the dev deploy on development.godofprompt.ai, Railway previews,
 * local — emits an explicit `noindex, nofollow`.
 *
 * This complements (does not replace) the `X-Robots-Tag: noindex` header that
 * src/proxy.ts sets per-request on non-production hosts. Header + meta now
 * AGREE; previously the header said noindex while the HTML said "index,
 * follow", which is a contradictory signal to leave on a staging site.
 *
 * Build-time (not per-request) so pages stay statically generated — reading
 * headers() in metadata would force every route to render dynamically.
 */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "1";

/** Hard noindex — used for staging builds and for genuinely private routes. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Positive robots directives for a page that SHOULD rank in production.
 * Returns a hard `noindex` on any non-production build.
 *
 * On a production build this returns `undefined` unless rich preview
 * directives are requested — omitting the tag means "index, follow", which is
 * the crawler default, so nothing is lost.
 */
export function pageRobots(
  directives?: Exclude<Metadata["robots"], string | null | undefined>,
): Metadata["robots"] {
  if (!INDEXABLE) return NOINDEX;
  return directives;
}

/**
 * The site's share image — the generated app/opengraph-image.tsx route.
 *
 * Next REPLACES `openGraph` wholesale rather than deep-merging it, so a page
 * that declares its own openGraph block loses the root's image unless it
 * repeats it. Every page therefore spreads this in explicitly. Previously they
 * pointed at /og-prompt-library.png, which 404s on every host.
 */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630 } as const;
