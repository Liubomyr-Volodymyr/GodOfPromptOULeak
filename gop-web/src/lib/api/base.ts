/**
 * API base resolver — api-dev.godofprompt.dev is THE backend for gop-web.
 *
 * Every server data call goes through this one base (no Directus, no legacy
 * prod-API host): the library collections (/api/library/*), products
 * (/api/library/products), qdrant search (/api/qdrant/*), blog
 * (/api/blog/* — WP-shaped, cutover pending; see lib/api/blog.ts), and
 * billing/Stripe (/api/billing/stripe/*, /api/stripe/*) when checkout wires up.
 *
 * Env override (NEXT_PUBLIC_API_BASE_URL) exists ONLY to repoint the same
 * backend per environment (staging/prod deploys of the same Nest app).
 *
 * Image binaries inside API payloads (e.g. a prompt's exampleOutputUrl on
 * cdn.godofprompt.dev) are storage URLs the backend returns — we render them
 * verbatim, we never construct asset URLs against another API host.
 */
const FALLBACK = "https://api-dev.godofprompt.dev";

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || FALLBACK
).replace(/\/+$/, "");

export const COPILOT_API_BASE = (
    process.env.NEXT_PUBLIC_COPILOT_API_URL?.trim() || FALLBACK
).replace(/\/+$/, "");

/**
 * Prompt Copilot's own frontend (hosts /authorize, the cross-domain SSO
 * handoff gop-web uses to get a user's Copilot access token — see
 * lib/pcp-auth.ts). Distinct from COPILOT_API_BASE, which is the backend API.
 */
export const COPILOT_WEB_URL = (
  process.env.NEXT_PUBLIC_COPILOT_WEB_URL?.trim() || "https://promptcopilot.io"
).replace(/\/+$/, "");
