/**
 * The site's public origin — ONE definition, env-driven.
 *
 * Everything that has to emit an absolute URL uses this: canonicals, OG urls,
 * JSON-LD (@id, breadcrumb items, ItemList urls), the sitemap and robots.txt.
 *
 * WHY IT EXISTS: the production origin was hardcoded in 25 files as
 * `const SITE = "https://godofprompt.ai"` / `CANON = ...` / inline template
 * literals. Swapping domains meant a 25-file hunt, and that scattering is
 * exactly how a dead URL (og-prompt-library.png) survived unnoticed for weeks.
 *
 * HOW TO SWAP: set `NEXT_PUBLIC_SITE_URL` on the deploy. Nothing else changes.
 *
 *   development.godofprompt.ai  →  NEXT_PUBLIC_SITE_URL=https://development.godofprompt.ai
 *   production                  →  unset (falls back to the canonical domain)
 *
 * It must be NEXT_PUBLIC_ and read at BUILD time: these values are baked into
 * statically prerendered HTML, so a runtime-only variable would be too late.
 *
 * Trailing slashes are stripped so callers can always write `${SITE_ORIGIN}/path`.
 */
const FALLBACK = "https://godofprompt.ai";

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK).replace(/\/+$/, "");

/** True when this build is serving the real production domain. */
export const IS_CANONICAL_ORIGIN = SITE_ORIGIN === FALLBACK;
