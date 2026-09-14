import { API_BASE } from "./base";

/**
 * Lead capture — `POST /api/lead/capture`.
 *
 * The backend's own summary: "Capture a lead from guide/lead-magnet forms —
 * creates or updates a user record and syncs to Beehiiv". So this one endpoint
 * covers the whole funnel: no separate Beehiiv client, no email list to keep in
 * sync frontend-side.
 *
 * Called from the browser, straight to api-dev (the standing rule for this app
 * — no same-origin proxy route). `email` is the only required field.
 *
 * UTM values are read off the landing URL and passed through verbatim, because
 * these pages are ManyChat funnel destinations and attribution is the point of
 * running them.
 */

export type LeadPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Which magnet was claimed — the product slug. */
  leadMagnetSlug?: string;
  utm?: Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
};

export class LeadError extends Error {}

/** Submits the lead. Throws LeadError with a human-readable message on failure. */
export async function captureLead(p: LeadPayload): Promise<void> {
  const email = p.email.trim();
  if (!email) throw new LeadError("Enter your email address.");

  // snake_case keys — the backend's SubmitLeadDto contract.
  const body: Record<string, string> = { email };
  if (p.firstName?.trim()) body.first_name = p.firstName.trim();
  if (p.lastName?.trim()) body.last_name = p.lastName.trim();
  if (p.leadMagnetSlug) body.lead_magnet_slug = p.leadMagnetSlug;
  for (const [k, v] of Object.entries(p.utm ?? {})) {
    if (v) body[`utm_${k}`] = v;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/lead/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LeadError("Couldn't reach the server. Check your connection and try again.");
  }

  if (res.ok) return;

  // Surface the backend's own validation message when it sends one; some
  // endpoints on this API answer 201 with an error body, so parse either way.
  let message = "";
  try {
    const json = (await res.json()) as { message?: string | string[]; errors?: string[] };
    const m = json.message ?? json.errors;
    message = Array.isArray(m) ? m[0] : (m ?? "");
  } catch {
    /* non-JSON body */
  }
  throw new LeadError(message || "Something went wrong. Please try again.");
}
