import { COPILOT_WEB_URL } from "@/lib/api";

/**
 * Prompt Copilot cross-domain SSO handoff (client-side half).
 *
 * PCP doesn't hand gop-web a token via login form or API key — it hands it
 * over through a redirect: we send the user to
 * `${COPILOT_WEB_URL}/authorize?redirect_uri=<our callback>`, PCP checks the
 * user's Copilot session and, if there is one, redirects back with the
 * access token in the URL *fragment* (`#token=...`, never sent to a server
 * or logged — see pcp-web/src/utils/authorizeHandoff.ts for the PCP side of
 * this contract). Our callback route (/auth/copilot/callback) reads the
 * fragment and calls setStoredPcpToken.
 *
 * The token then lives in localStorage and is sent as a Bearer header to our
 * own /api/pcp/get-context proxy (PCP's CORS allowlist doesn't include
 * godofprompt.ai, so the browser can't call the PCP API directly).
 */
const TOKEN_KEY = "pcp_access_token";
const CALLBACK_PATH = "/auth/copilot/callback";

export function getStoredPcpToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredPcpToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private mode/quota) — non-fatal, the user
    // just gets asked to reconnect next time.
  }
}

export function clearStoredPcpToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // see setStoredPcpToken
  }
}

/** Only same-origin relative paths are valid return targets (no open redirect). */
export function sanitizeReturnTo(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

/**
 * Build the URL that sends the user to PCP's /authorize page. `returnTo` is
 * where the callback should land the user once the handoff completes —
 * normally the page they clicked "Context Inject" from.
 */
export function buildAuthorizeUrl(returnTo: string): string {
  const callback = new URL(CALLBACK_PATH, window.location.origin);
  callback.searchParams.set("return_to", sanitizeReturnTo(returnTo));
  const authorize = new URL("/authorize", COPILOT_WEB_URL);
  authorize.searchParams.set("redirect_uri", callback.toString());
  return authorize.toString();
}
