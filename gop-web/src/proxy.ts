import { NextResponse, type NextRequest } from "next/server";

/**
 * Search-index guard. Only the real production hosts may be indexed; every
 * other host that serves this build — the dev deploy (development.godofprompt.ai),
 * Railway preview URLs, localhost — gets `X-Robots-Tag: noindex` on every
 * response, so staging can never leak into search results.
 *
 * "Allow" in robots.txt + this noindex header is the correct de-index combo:
 * bots are allowed to crawl, so they actually SEE the noindex and drop the
 * page (a robots.txt Disallow would hide the header and strand stale entries).
 */
const INDEXABLE_HOSTS = new Set(["godofprompt.ai", "www.godofprompt.ai"]);

export function proxy(req: NextRequest) {
  const raw = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const host = raw.split(",")[0].trim().split(":")[0].toLowerCase();

  const res = NextResponse.next();
  if (!INDEXABLE_HOSTS.has(host)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return res;
}

export const config = {
  // Everything except Next's hashed internals: public files (images, txt,
  // xml) DO pass through, so on non-indexable hosts even exported art and
  // the sitemap carry the noindex header (keeps dev out of Google Images).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
