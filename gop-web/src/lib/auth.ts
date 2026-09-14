/**
 * GOP account session (client-side).
 *
 * The gop-back auth endpoints return a JWT pair on success
 * (`{ access_token, refresh_token }` — see AuthSuccessDto). We store them in
 * localStorage, mirroring the Prompt Copilot handoff convention in
 * `pcp-auth.ts` (distinct keys — this is the user's GOP account token, not the
 * cross-domain Copilot token).
 */
const ACCESS_KEY = "gop_access_token";
const REFRESH_KEY = "gop_refresh_token";
const EMAIL_KEY = "gop_user_email";

export type AuthTokens = { access_token: string; refresh_token?: string };

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

/** The signed-in user's email (captured at sign-up) — used to attribute
 *  account-gated actions like the custom prompt generator. */
export function getUserEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function storeSession(tokens: AuthTokens, email?: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    if (tokens.refresh_token) localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // localStorage unavailable (private mode / quota) — non-fatal; the user
    // stays signed in for this tab only.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // see storeSession
  }
}

export function isSignedIn(): boolean {
  return Boolean(getAccessToken());
}

/** Nested-tracking shape the register endpoint accepts (TrackingInfoDto). */
export type Tracking = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  affiliate_id?: string;
  click_id?: string;
  product_slug?: string;
};

/**
 * Capture attribution from the current URL for the sign-up payload. Only keys
 * actually present are included, so the optional `tracking` object stays
 * absent when there's nothing to attribute.
 */
export function captureTracking(): Tracking | undefined {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search);
  const t: Tracking = {};
  const map: Array<[keyof Tracking, string]> = [
    ["utm_source", "utm_source"],
    ["utm_medium", "utm_medium"],
    ["utm_campaign", "utm_campaign"],
    ["utm_content", "utm_content"],
    ["utm_term", "utm_term"],
    ["affiliate_id", "affiliate_id"],
    ["click_id", "click_id"],
  ];
  for (const [key, param] of map) {
    const v = q.get(param)?.trim();
    if (v) t[key] = v;
  }
  return Object.keys(t).length ? t : undefined;
}
