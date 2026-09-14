/**
 * GET /api/me — the signed-in user's profile (bearer-authenticated, same JWT
 * pair issued by /api/auth/login and /api/auth/verify-code — see lib/auth.ts).
 *
 * Like the other browser-side calls in this folder, this degrades to `null`
 * instead of throwing: no token, a network blip, or a non-2xx all just mean
 * "render as signed out" rather than blanking the nav. A 401 specifically
 * means the stored token is stale, so it also clears the local session.
 */
import { API_BASE } from "./base";
import { clearSession, getAccessToken } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  } catch {
    return null;
  }

  if (res.status === 401) {
    clearSession();
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  const email = str(json?.email);
  if (!json || !email) return null;

  return {
    id: str(json.id ?? json.userId),
    firstName: str(json.first_name ?? json.firstName),
    lastName: str(json.last_name ?? json.lastName),
    email,
    avatarUrl:
      typeof json.avatar_url === "string"
        ? json.avatar_url
        : typeof json.avatarUrl === "string"
          ? json.avatarUrl
          : null,
  };
}
