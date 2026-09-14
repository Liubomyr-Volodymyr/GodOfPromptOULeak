import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * The app's Link — `next/link` with prefetching OFF by default.
 *
 * WHY: prefetching an App Router route is not a cheap asset fetch. It is a
 * full RSC render of the target page on the server, which runs that page's
 * own api-dev calls. Our pages are data-heavy and api-dev allows roughly 100
 * requests per 50-second window, so aggressive prefetch spends the entire
 * budget on pages nobody asked for.
 *
 * Measured on a single prompt page before this existed: 40 RSC requests. The
 * nav, mobile menu, dropdown rows and footer each render the same hrefs and
 * Next prefetches every copy independently, and the body's tool/category
 * chips did the same — /prompt-library/tool/mistral alone was fetched 7
 * times. Those `?_rsc=…` URLs are exactly this.
 *
 * Import this instead of `next/link` anywhere in the app. Navigation still
 * streams on click; we just stop speculatively rendering the whole site.
 *
 * Opt back in per link where it genuinely pays — a single high-intent target
 * you expect most visitors to click:
 *
 *     <Link href={href} prefetch>Continue</Link>
 *
 * Prefer that over reaching for `next/link` directly, so this stays the one
 * place the policy is written down.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
