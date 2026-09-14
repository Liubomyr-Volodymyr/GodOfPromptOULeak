# gop-web — Architecture Decision Records

> Log every non-trivial decision here. Future-you will thank present-you.

## Template

```markdown
## ADR-NNN: Title

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | deprecated | superseded by ADR-NNN

### Context
What is the issue? What forces are at play?

### Decision
What was decided and why.

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| ... | ... | ... |

### Consequences
What becomes easier or harder because of this decision.
```

---

## ADR-001: Initial Tech Stack

**Date:** 2026-05-27
**Status:** accepted

### Context
The gop-web-temp prototype (Vite/React + CSS Modules + bespoke design tokens) drifted into a state where:
- Component composition was fragmented across `.module.css` + `.jsx` + `lib/*` files
- Design tokens were out of sync with Figma after weeks of incremental edits
- The team is preparing a handover and needs a stack a new developer can read in a day
- The user explicitly named the gop-web-temp state as the reason for the migration ("I kinda hate your work")

We needed a stack that:
- Is mainstream enough that any frontend dev can ramp in days, not weeks
- Has SEO-friendly server rendering (prompt-library pages are the SEO lifeline)
- Eliminates the CSS-Modules-drift problem
- Can host both the app and a blog (replacing WordPress) in one codebase
- Deploys to Hetzner via Docker (same pattern as the gop-seo blog already running there)

### Decision
**Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui · MDX for blog.**

- Next.js 16 App Router for routing + SSR/RSC
- TypeScript strict mode at the API boundary
- Tailwind v4 utility classes replacing CSS Modules
- shadcn/ui as the component layer (copy-in, not a runtime dep)
- MDX for blog content (files in `src/content/blog/`)
- pnpm as the package manager

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Keep Vite/React, add Tailwind on top | Lower migration cost | Doesn't fix SSR/SEO. Mixed CSS Modules + Tailwind period gets confusing. |
| Astro | Best-in-class SEO + content-driven | Wrong fit for the interactive prompt-library and Stripe flows |
| Remix | Solid SSR | Smaller ecosystem than Next.js for shadcn-style component libraries |
| SvelteKit | Smaller bundles | Off-stack for the team; harder handover |

### Consequences
- **Easier:** Handover to new devs (Next.js is the most-Googled stack). SEO (RSC by default). Blog (MDX is a single dependency). Theming (Tailwind tokens in one config file).
- **Harder:** Initial scaffold + porting effort (~1-2 days). Two codebases coexist during the transition (gop-web-temp continues serving paid flows until parity is reached).

---

## ADR-002: Blog Content Source

**Date:** 2026-05-27
**Status:** accepted

### Context
Blog currently lives on WordPress at godofprompt.io/blog. We want to ditch WordPress and bring the blog into the gop-web codebase so:
- One deploy pipeline, one git history
- No PHP/WP plugin maintenance
- Internal linking between prompt-library and blog becomes trivial
- Build-time rendering means fastest possible page loads

### Decision
**MDX files in the repo at `src/content/blog/*.mdx`.**

Each post is a single `.mdx` file with YAML frontmatter (title, date, author, tags, cover, seoDescription). Build-time rendered by `@next/mdx`. Migration from WordPress is a one-off export → markdown script.

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Directus `posts` collection | Non-technical editing | New backend dependency; runtime fetch on every page load; needs admin UI work |
| Hybrid (Directus drafts → MDX commits) | Best of both | Two systems to maintain, build hooks add complexity |
| Stay on WordPress, embed via iframe | Zero migration | Doesn't solve the maintenance burden; iframe SEO is bad |

### Consequences
- **Easier:** Editing posts is `git commit`. Internal links between prompt + blog are trivial. Build-time SEO is perfect. No CMS dependency.
- **Harder:** Non-technical team members can't edit without git knowledge. Mitigated by GitHub web editor for simple edits, plus a CONTRIBUTING.md for the editorial team.

---

## ADR-003: Stripe + Auth in v1

**Date:** 2026-05-27
**Status:** accepted

### Context
gop-web-temp ships Stripe Checkout + auth UI. The question was whether to defer these to v2 (ship prompt-library + blog first) or include in v1.

Audit of gop-web-temp showed it has **zero** Stripe / auth client SDKs in dependencies — Stripe is hosted Checkout (a redirect), auth is backend cookies. So "include in v1" is mostly UI wiring, not a 2× scope blowup.

### Decision
**Include Stripe Checkout redirects + auth-state display in v1.**

- "Buy" / "Subscribe" buttons POST to backend, redirect to Stripe-hosted Checkout
- User state read via `/api/me` (backend cookie session)
- No client-side Stripe.js, no NextAuth, no Clerk

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Defer to v2 | Smaller v1 | Run two codebases for paid features for weeks |
| Migrate auth to NextAuth + Stripe.js | Self-contained frontend | Replaces a working backend session model with a new auth library; out of scope |

### Consequences
- **Easier:** One codebase for all flows. v1 reaches feature parity faster.
- **Harder:** Slightly more page surface to port. Acceptable since auth/payments are mostly redirects.

---

## ADR-004: Zustand for the signed-in user profile

**Date:** 2026-07-29
**Status:** accepted

### Context
`GET /api/auth/me` (bearer JWT, see `lib/api/me.ts`) returns the signed-in user's profile. Two independent client trees need it: `TopNavigation` (the account pill's initials) and the `/user/*` cabinet pages (`UserCabinetPreview`). Each originally ran its own `useEffect` + `useState` calling `fetchCurrentUser` on mount/navigation — duplicated fetch, duplicated staleness logic, and no way for one to know the other had already fetched or that the token had just gone stale (401).

### Decision
**Add Zustand as a single shared store (`src/lib/store/user-store.ts`) for this one piece of state: `{ user, status }` plus `refresh()` / `clear()` actions.** Both `TopNavigation` and `UserCabinetPreview` subscribe to it and call `refresh()` in their existing mount/pathname effects instead of calling `fetchCurrentUser` directly. `clear()` wraps `clearSession()` so logging out from the cabinet immediately updates the nav too, without waiting for a navigation to re-trigger a fetch.

This is scoped to auth/profile state only — per ARCHITECTURE.md, most state here should stay URL state or RSC props. Nothing else has moved into Zustand.

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Keep per-component `useEffect`/`useState` | No new dependency | Duplicate fetches, duplicate 401 handling, components can't see each other's state (e.g. cabinet logout doesn't update the nav pill without a navigation) |
| React Context + `useReducer` | No dependency | More boilerplate for the same result; still need manual subscription optimization to avoid re-rendering unrelated consumers |
| Zustand | Minimal API, no provider wrapping needed, selective subscriptions avoid extra re-renders | One more dependency (small, ~1KB) |

### Consequences
- **Easier:** One fetch path for `/api/auth/me`, shared across the nav and cabinet. Sign-out is instantly reflected everywhere without a page nav.
- **Harder:** None expected — the store is intentionally thin (no persistence, no middleware). If more client state shows up later, revisit whether it belongs here or is still better as URL state / RSC props.
