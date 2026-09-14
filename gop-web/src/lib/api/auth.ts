/**
 * Auth API client (browser-side) for the gop-back `/api/auth/*` endpoints.
 *
 * Contract (verified against gop-back src/modules/auth):
 *   POST /api/auth/register     RegisterDto  -> { message, userId }  (+ emails a 6-digit code)
 *   POST /api/auth/verify-code  { email, code } -> { access_token, refresh_token }
 *   POST /api/auth/resend-code  { email }    -> { message }
 *
 * Register never returns tokens — it starts email verification. The caller
 * chains into verifyEmailCode to complete sign-up and receive the JWT pair.
 */
import { API_BASE } from "./base";
import type { AuthTokens, Tracking } from "@/lib/auth";

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  /** Consent ticks — real RegisterDto fields (both optional booleans). */
  product_updates?: boolean;
  marketing_emails?: boolean;
  tracking?: Tracking;
};

/** A failed auth call, carrying the HTTP status + a user-safe message. */
export class AuthError extends Error {
  status: number;
  code: "duplicate" | "invalid-code" | "rate-limited" | "validation" | "server" | "network" | "unknown";
  constructor(message: string, status: number, code: AuthError["code"]) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

async function readError(res: Response): Promise<{ raw: string }> {
  try {
    const j = await res.json();
    const raw = Array.isArray(j?.message) ? j.message.join(" ") : j?.message || j?.error || "";
    return { raw: String(raw) };
  } catch {
    return { raw: "" };
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("Network error — check your connection and try again.", 0, "network");
  }

  if (res.ok) {
    return (await res.json()) as T;
  }

  const { raw } = await readError(res);

  if (res.status === 429) {
    throw new AuthError("Too many attempts — please wait a minute and try again.", 429, "rate-limited");
  }
  if (/already|exist|duplicate|registered|in use|conflict/i.test(raw) || res.status === 409) {
    throw new AuthError("An account with this email already exists. Try signing in.", res.status, "duplicate");
  }
  if (/code|otp|invalid|expired|incorrect/i.test(raw) && path.includes("verify")) {
    throw new AuthError("That code isn't right or has expired. Please try again.", res.status, "invalid-code");
  }
  if (res.status >= 500) {
    throw new AuthError("Something went wrong on our end — please try again.", res.status, "server");
  }
  throw new AuthError(raw || "We couldn't complete that. Please try again.", res.status, "validation");
}

export function registerUser(payload: RegisterPayload): Promise<{ message: string; userId: string }> {
  return post("register", payload);
}

export function verifyEmailCode(email: string, code: string): Promise<AuthTokens> {
  return post("verify-code", { email, code });
}

export function loginUser(email: string, password: string): Promise<AuthTokens & { userId?: string }> {
  return post("login", { email, password });
}

export function resendCode(email: string): Promise<{ message: string }> {
  return post("resend-code", { email });
}

/** The Google OAuth entry point (full-page redirect; backend handles callback). */
export function googleAuthUrl(): string {
  return `${API_BASE}/api/auth/google/web`;
}
