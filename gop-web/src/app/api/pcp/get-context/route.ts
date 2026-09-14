import { NextResponse } from "next/server";
import { COPILOT_API_BASE } from "@/lib/api";

/**
 * POST /api/pcp/get-context — same-origin proxy to Prompt Copilot's
 * memory/get-context endpoint (Figma 1266:4592 "Context Inject" button).
 *
 * The PCP API requires a Bearer JWT and does NOT send CORS headers for the
 * gop-web origin, so the browser can't call it directly. This route forwards
 * the {prompt_body, variables} payload server-side, attaching whatever
 * Authorization header the client sends.
 *
 * Auth: the token comes from the browser's Prompt Copilot session, obtained
 * via the cross-domain SSO handoff (see src/lib/pcp-auth.ts and
 * src/app/auth/copilot/callback) and stored in localStorage — never a
 * server-side secret. A request with no Authorization header gets a 401 so
 * the client knows to send the user through the handoff.
 *
 * Contract (PCP OpenAPI, MemoryController_getPromptContext):
 *   body  → { prompt_body: string, variables: string[] }  // kebab-case keys
 *   reply → the user's saved context for those variables (shape owned by PCP)
 */
const PCP_GET_CONTEXT_URL = `${COPILOT_API_BASE}/api/memory/get-context`;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json(
      { error: "Not connected to Prompt Copilot." },
      { status: 401 },
    );
  }

  let payload: { prompt_body?: unknown; variables?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt_body = typeof payload.prompt_body === "string" ? payload.prompt_body : "";
  const variables = Array.isArray(payload.variables)
    ? payload.variables.filter((v): v is string => typeof v === "string")
    : [];

  if (!prompt_body) {
    return NextResponse.json({ error: "prompt_body is required." }, { status: 400 });
  }

  try {
    const res = await fetch(PCP_GET_CONTEXT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({ prompt_body, variables }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    // Pass the upstream status through so the client can tell "no context"
    // (2xx) from "not authorised" (401) and react accordingly.
    return NextResponse.json(data ?? { error: `Prompt Copilot returned ${res.status}.` }, {
      status: res.ok ? 200 : res.status,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Prompt Copilot." }, { status: 502 });
  }
}
