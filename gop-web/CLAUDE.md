# gop-web

> Public-facing godofprompt.ai frontend. Stitches the prompt library, tool pages, MDX blog (replacing WordPress), and Stripe Checkout redirects into one Next.js app. Replaces the gop-web-temp Vite/React prototype as the production frontend.

## Project Info

- **Code:** GOP-WEB
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · @next/mdx
- **Working Directory:** `/02_DEV/gop-web` (sibling to `gop-web-temp`)
- **Absolute Path:** `/Users/rryssf/Library/CloudStorage/GoogleDrive-robert@rryssf.com/Shared drives/GOP_BASE/02_PROJECTS/01_ACTIVE/G.o.P_2.0/02_DEV/gop-web/`

## What this project IS

A page-stitcher. Routes fetch from the existing backend API and compose UI from shadcn primitives + a small set of bespoke components (prompt panel, model tags, related row). The backend (auth, payments, content storage) is not this project's concern.

## What this project IS NOT

- A backend. Stripe webhooks, auth sessions, prompt CRUD, user folders — all live on the backend at `api.godofprompt.dev` / `api-dev.godofprompt.dev`.
- A CMS. Blog content is MDX in `/content/blog/` (git is the source of truth). No headless CMS dependency.
- A drop-in replacement for `gop-web-temp` on day one — parity is reached page-by-page.

## Architecture

See `project-docs/ARCHITECTURE.md` for the system overview.

## Rules



### Rule 1: Document Decisions
Every non-trivial architectural decision (state lib, data-fetching pattern, MDX pipeline, deploy strategy) gets a numbered ADR in `project-docs/DECISIONS.md`.

### Rule 2: Quality Gates
- No component file > 300 lines (split into sub-components if it grows)
- No function > 50 lines
- TypeScript strict mode on (`"strict": true` in `tsconfig.json`)
- shadcn primitives over bespoke components — only fork a primitive when its design diverges materially

### Rule 3: API client is the boundary
All backend calls go through `src/lib/api/` — never `fetch()` from a component directly. This is the seam for swapping the dev endpoint, mocking in tests, and tracing failures.

### Rule 4: No Auto-Deploy
Local-only in v1. No `vercel`, no `gh-pages`, no Hetzner pushes without explicit user confirmation. Deploy comes once the prompt-detail page reaches parity.

### Rule 5: Local-first dev workflow
Always points at `api-dev.godofprompt.dev` locally. Staging branch points at the staging API later. Production branch only ever points at production. Wired in `next.config.ts` rewrites + `.env.local`.

## Key Commands

```bash
# Development
pnpm dev                   # Next.js dev server on :3000
pnpm dev --turbo           # Same with Turbopack

# Testing
pnpm test                  # Vitest (when set up)
pnpm test:e2e              # Playwright (when set up)

# Build
pnpm build                 # Next.js production build
pnpm start                 # Serve the production build locally

# shadcn
pnpm shadcn@latest add button     # Install a component
pnpm shadcn@latest mcp init       # Wire shadcn MCP into Claude Code
```

## Project-Specific Rules

- **Prompt panel is sacred** — the dark IDE-style panel (`<PromptBody>`) was the only piece of the gop-web-temp design that survived review. Port it 1:1 (markup + styles), then leave it alone unless explicitly asked.
- **No CSS Modules.** Everything is Tailwind utility classes + shadcn variants. The `gop-web-temp` `*.module.css` pattern is the thing we're migrating away from.
- **Design tokens live in `tailwind.config.ts` `theme.colors`** — single source of truth. The brand gold (`#FCD94A`), the ink (`#161415`), the dark surface (`#2D2B2C`) all come from one map.
- **No emoji in copy.** Only as model `icon` field from the API (e.g. 🔍 on a prompt). Replace UI emoji with Lucide icons.
- **Blog is MDX in repo.** Posts at `src/content/blog/{slug}.mdx` with frontmatter. Build-time rendered. No runtime CMS calls.

## Integrations

- **Backend API** — `api-dev.godofprompt.dev` (dev), `api.godofprompt.dev` (prod). Endpoints used:
  - `/api/library/{uuid}` — single curated prompt (camelCase shape)
  - `/api/prompts` — paged prompt list (snake_case shape)
  - `/api/recommended_tools` — model brand list (when available)
- **Stripe** — Hosted Checkout. Frontend sends user to a backend-generated Checkout URL; webhooks handled server-side.
- **Beehiiv** — Newsletter signup form posts to backend endpoint that proxies to the Beehiiv API.
- **Auth** — Session cookies set by the backend. Frontend reads user state via `/api/me`. No client-side auth library.
