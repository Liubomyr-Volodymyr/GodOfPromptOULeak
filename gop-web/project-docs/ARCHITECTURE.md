# gop-web — Architecture

> AUTHORITATIVE — Single source of truth for system architecture. Update this when architecture changes. If code disagrees, this doc wins.

## Overview

gop-web is a Next.js 16 App Router frontend for godofprompt.ai. It stitches pages from data the existing backend serves at `api-dev.godofprompt.dev` and renders an MDX-based blog from files in the repo. Stripe Checkout is a redirect; auth is a session cookie set by the backend. The frontend has no database, no auth library, no payment processor SDK.

## System Diagram

```
                        ┌────────────────────────────┐
                        │  godofprompt.ai (browser)  │
                        └──────────────┬─────────────┘
                                       │
                              HTTPS    ▼
                  ┌────────────────────────────────────┐
                  │  gop-web  (Next.js, Hetzner)        │
                  │  ─────────────────────────────────  │
                  │  app/      App-Router routes        │
                  │  src/lib/  API client, utils        │
                  │  content/  blog/*.mdx               │
                  │  components/  shadcn + bespoke      │
                  └───┬──────────────┬──────────────┬───┘
                      │              │              │
        ┌─────────────┘              │              └───────────────┐
        │ /api/library/{id}          │ POST Checkout                │ POST /subscribe
        │ /api/prompts                │ ▼                            ▼
        ▼ /api/me                    Stripe Checkout (hosted)       Beehiiv proxy
  api.godofprompt.dev                       │                            │
  (backend, Hetzner)                        │ webhook                    │
                                            ▼                            ▼
                                      Backend webhook handler      Beehiiv API
```

## Components

| Component | Purpose | Tech |
|-----------|---------|------|
| `app/(marketing)/*` | Home, pricing, blog index/posts | Next.js App Router, MDX |
| `app/prompt-library/*` | Library index + per-prompt detail page | Next.js App Router, RSC for SEO |
| `app/tool/[slug]/*` | Tool detail page | Next.js App Router |
| `src/lib/api/` | Typed API client — single seam to backend | TypeScript, native fetch |
| `src/lib/store/user-store.ts` | Shared signed-in user cache (`/api/auth/me`) — see ADR-004 | Zustand |
| `src/components/ui/*` | shadcn primitives (Button, Badge, ScrollArea, …) | shadcn/ui |
| `src/components/prompts/*` | Bespoke prompt-domain components (PromptPanel, ToolTag, ModelChip) | React + Tailwind |
| `src/content/blog/*.mdx` | Blog posts | MDX + frontmatter |
| `tailwind.config.ts` | Design tokens (colors, fonts, spacing) | Tailwind v4 |

## Responsibility Matrix

| This System Does | This System Does NOT |
|-----------------|---------------------|
| Render pages from API data | Persist prompts, users, or sessions |
| Serve MDX blog posts at build time | Edit blog posts (git is the editor) |
| Send users to Stripe Checkout URLs | Process payments or handle Stripe webhooks |
| Read user state from `/api/me` cookie | Authenticate or set session cookies |
| Generate sitemap + RSS from MDX + API | Serve a CMS admin UI |
| Cache API responses with Next.js `fetch` | Run a database |

## Technology Choices

| Choice | Rationale |
|--------|-----------|
| Next.js 16 App Router | Server Components for SEO-critical prompt pages, file-based routing, image optimization, MDX support — all out of the box. Pairs with the team's familiarity from gop-seo. |
| Tailwind v4 | Replaces the bespoke CSS Modules + custom token system from gop-web-temp that drifted over time. Utility-first means design changes don't ripple through 3 files per component. |
| shadcn/ui | Copy-in primitives over a runtime component library. We own the source, can theme freely, no dependency upgrade pain. Matches the `fast-ui` skill's recommended stack. |
| TypeScript strict | Catches API shape mismatches at compile time. Backend response shapes are typed in `src/lib/api/` so consumers can't drift. |
| MDX for blog | Posts live in git, version-controlled, build-time rendered → fastest possible page loads + zero CMS lock-in. WordPress export → markdown is a one-off script. |
| pnpm | Disk-efficient, strict peer-dep resolution, Hetzner deploy footprint is smaller than npm/yarn. |

## Data Flow

**Prompt detail page** (`/prompt-library/[slug]`):
1. Route handler receives `slug` (or UUID).
2. `src/lib/api/prompts.ts#getPromptBySlug(slug)` detects UUID vs slug and calls `/api/library/{uuid}` or `/api/prompts?slug=…`.
3. Backend returns a record (camelCase for library, snake_case for prompts) — normalized to internal shape by the API client.
4. Server Component renders the page tree with the normalized prompt.
5. Related prompts fetched via `/api/prompts?category=…` for the horizontal row.

**Blog post** (`/blog/[slug]`):
1. At build time, `getStaticPaths` reads `src/content/blog/` filenames.
2. Each page renders an MDX file → HTML.
3. No runtime fetches.

**Stripe Checkout** (`/checkout/[product]`):
1. User clicks a CTA.
2. Client POSTs to backend `/api/checkout/{product}` with cookies.
3. Backend returns a Stripe-hosted Checkout URL.
4. Frontend `window.location.href = url`.

## External Dependencies

- **`api.godofprompt.dev`** (`api-dev.godofprompt.dev` locally) — REST API for prompts, library, tools, auth state, checkout URLs.
- **Stripe** — Hosted Checkout (no client SDK needed).
- **Beehiiv** — Newsletter (proxied through backend).
- **Hetzner** — Deploy target. Same Docker pattern as `gop-seo`.

## If You Are About To... STOP

- **Add a new service?** → Document it here first, get approval. The frontend rarely needs new services — it consumes the backend.
- **Add client-side state management (Redux/Zustand)?** → Document the use case in DECISIONS.md. Most state should be URL state or RSC props.
- **Add a runtime CMS (Sanity, Contentful, etc.)?** → MDX is the choice. Justify in DECISIONS.md before adding.
- **Bypass the `src/lib/api/` client?** → Don't. Every backend call goes through it.
- **Add a new external script (analytics, chat, etc.)?** → Add to External Dependencies, justify in DECISIONS.md.
