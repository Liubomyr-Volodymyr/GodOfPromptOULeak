import { COPILOT_API_BASE } from "@/lib/api";

/**
 * GET /api/pcp/avatar — same-origin proxy to Prompt Copilot's
 * GET /api/users/avatar, same reasoning as ../get-context/route.ts: PCP
 * doesn't send CORS headers for this origin, so the browser can't attach an
 * Authorization header and fetch the image directly.
 *
 * Auth: the PCP Bearer token comes from the browser's Prompt Copilot session
 * (see src/lib/pcp-auth.ts) — forwarded here, never a server-side secret. No
 * Authorization header means the client isn't connected, so 401.
 *
 * Streams the upstream image bytes back verbatim rather than JSON — the
 * caller sets this as an <img>/blob URL directly.
 */
const PCP_AVATAR_URL = `${COPILOT_API_BASE}/api/users/avatar`;

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return new Response(null, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(PCP_AVATAR_URL, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }

  if (!res.ok || !res.body) {
    return new Response(null, { status: res.ok ? 502 : res.status });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
