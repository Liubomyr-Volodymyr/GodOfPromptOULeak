# gop-web — Infrastructure

## Environments

| Environment | URL | Backend API | Branch | Purpose |
|-------------|-----|-------------|--------|---------|
| Local | `localhost:3000` | `https://api-dev.godofprompt.dev` | feature/* | Development |
| Staging | `staging.godofprompt.ai` (TBD) | `https://api-staging.godofprompt.dev` (TBD) | `staging` | Pre-prod QA |
| Production | `godofprompt.ai` | `https://api.godofprompt.dev` | `main` | Live site |

> **v1 is local-only.** Staging + production deploys come once the first milestone (prompt-detail parity) lands. The branch model is set up from day one so the workflow is right.

## Environment Variables

All env vars live in `.env.local` (gitignored) for development. Production secrets are managed in Hetzner via the same pattern as `gop-seo`.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API root | Yes | `https://api-dev.godofprompt.dev` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin (for SEO + share links) | Yes | `http://localhost:3000` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe pk_test_… / pk_live_… for client-side redirect formatting | No (backend builds Checkout URL) | — |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID | No | — |
| `BEEHIIV_PUBLICATION_ID` | Newsletter publication ID | No (passed through backend) | — |

> `.env.local` template lives at `.env.example` in the repo root. Copy to `.env.local` and fill before first `pnpm dev`.

## Deployment

### Prerequisites
- Hetzner server with Docker + reverse proxy (Caddy or Traefik) — same machine as `gop-seo`
- GitHub repository for `gop-web` with deploy keys configured
- DNS for `godofprompt.ai` / `staging.godofprompt.ai` pointing at the Hetzner IP
- `.env.production` / `.env.staging` secret files on the Hetzner machine (not in git)

### Steps
> Not implemented in v1. The plan below is the intended pattern, modeled after gop-seo.

1. Push to `staging` or `main` branch
2. GitHub Actions builds the Docker image and pushes to a registry (Hetzner internal registry or ghcr.io)
3. SSH into Hetzner, `docker compose pull && docker compose up -d gop-web`
4. Caddy/Traefik routes `staging.godofprompt.ai` / `godofprompt.ai` to the new container

### Rollback
1. SSH into Hetzner
2. `docker compose up -d gop-web:previous-tag` (image tags are git SHAs)
3. Verify, then close the incident in the deploy log

## Monitoring

> Not implemented in v1.

When deployed:
- **Uptime:** Hetzner status page + UptimeRobot for `godofprompt.ai`
- **Errors:** Sentry SDK (`@sentry/nextjs`) with `NEXT_PUBLIC_SENTRY_DSN`
- **Analytics:** GA4 via `NEXT_PUBLIC_GA_ID` (cookie-banner gated)
- **Performance:** Vercel Speed Insights or self-hosted equivalent (Cloudflare RUM)

## CI/CD

> Not implemented in v1.

Planned GitHub Actions:
- **PR checks** — `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`
- **Staging deploy** — On push to `staging`, build image and SSH-deploy to Hetzner staging container
- **Production deploy** — On push to `main`, same pipeline targeting prod container
- **No auto-deploy from `feature/*`** — work happens locally

## Branch Model

```
main                   — production. Push triggers prod deploy. PRs from `staging` only.
└── staging            — pre-prod QA. Push triggers staging deploy. PRs from feature/* only.
    └── feature/{name} — local work. No deploy. Merged into staging via PR.
```

Rule: never push to `main` without going through `staging` first. Never deploy on Fridays. Never merge a PR with failing checks.
