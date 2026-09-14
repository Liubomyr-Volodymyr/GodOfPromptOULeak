# GoP Backend - Project Reference Guide

> Comprehensive reference for the GoP (God of Prompt) backend.
> Last updated: 2026-06-02

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Database (Entities)](#database-entities)
6. [Core Modules](#core-modules)
7. [API Endpoints](#api-endpoints)
8. [External Integrations](#external-integrations)
9. [Environment Variables](#environment-variables)
10. [Key Business Flows](#key-business-flows)
11. [Development Guide](#development-guide)

---

## Quick Overview

**Type**: NestJS RESTful API for an AI-powered prompt generation / library platform (SaaS)

**Key Features**:
- Internal + custom + bulk AI prompt generation (multi-provider)
- Public prompt library (feed, detail, tools, categories, audience types)
- Semantic search via Qdrant vector DB
- Blog (public feed + dev CRUD)
- Queue-based async processing (Bull/Redis)
- Stripe payments + subscriptions + webhooks
- Notion sync, MinIO/Google storage, Gotenberg screenshots
- JWT + Google OAuth auth, admin panel with roles

**Data**: PostgreSQL is the single source of truth (TypeORM). No external CMS.

---

## Tech Stack

### Core
- **NestJS** 10.x, **TypeScript** 5.1, **Node.js** 20+

### Database & Search
- **PostgreSQL** — primary DB
- **TypeORM** — ORM (`orm.config.ts`, `./migrations`)
- **Qdrant** — vector DB (semantic search)

### Queue
- **Bull** + **Redis**

### AI / LLM
- **OpenAI** (GPT + Assistants)
- **Anthropic** Claude
- **Google Gemini**
- **OpenRouter** (multi-model routing)

### External Services
- **Stripe** — payments
- **Notion** — library sync / tracking
- **MinIO** — S3-compatible object storage
- **Google Drive / Cloud Storage** — file storage
- **Gotenberg** — HTML→PDF / screenshots
- **Postmark** / SMTP — transactional mail
- **Beehiiv** — newsletter
- **MLflow** — experiment tracking (optional)

### Auth & Security
- **Passport** (JWT + Google OAuth)
- **bcrypt** — password hashing
- **@nestjs/throttler** — rate limiting

---

## Architecture

### Pattern: Modular Layered Architecture

```
┌─────────────────────────────────────────────────┐
│              Controllers (API Layer)             │
│  auth │ library │ generator │ billing │ admin …  │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│             Services (Business Logic)             │
│   Strategies │ Queue Processors │ Guards          │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│        Data Access (TypeORM Repositories)         │
│      PostgreSQL  │  Qdrant Client  │  Redis        │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│   External: AI APIs │ Stripe │ Notion │ Storage   │
└──────────────────────────────────────────────────┘
```

### Design Patterns
- Dependency Injection
- Repository pattern (TypeORM)
- Service layer
- DTO validation (class-validator / class-transformer)
- Strategy pattern (auth)
- Queue pattern (Bull)

### Global Wiring (`app.module.ts` / `main.ts`)
- Global prefix `api` (`main.ts`)
- `APP_GUARD` → `ThrottlerGuard` (global rate limit)
- `APP_INTERCEPTOR` → `RequestLoggerInterceptor` (logs `METHOD - /path (email?)`)
- TypeORM, Bull, Schedule, Config modules at root

---

## Project Structure

```
src/
├── admin/                  # Admin panel — RouterModule mounts under /api/admin
│   ├── admin.module.ts     #   admin/auth, admin/members, admin/admins,
│   └── modules/            #   admin/prompts, admin/stats
│       ├── admins/
│       ├── auth/
│       ├── members/
│       ├── prompts/
│       └── stats/
├── modules/                # Feature modules
│   ├── activity/           # Activity tracking interceptor
│   ├── ai/                 # AI orchestration (GPT/Claude/Gemini/OpenRouter)
│   ├── auth/               # JWT + Google OAuth + email verification
│   ├── billing/            # Stripe checkout / subscriptions / webhooks
│   ├── blog/               # Public blog feed + dev CRUD
│   ├── csv/                # CSV generation
│   ├── generator/          # ⭐ Prompt generation (internal/custom/bulk)
│   ├── google-drive/       # Google Drive uploads
│   ├── gotenberg/          # Screenshots / PDF
│   ├── leads/              # Lead capture
│   ├── library/            # Public prompt library + entities
│   ├── mail/               # Support mail
│   ├── minio/              # MinIO object storage
│   ├── mlflow/             # Experiment tracking
│   ├── notion/             # Notion library sync
│   ├── products/           # Product catalog
│   ├── prompts/            # Prompts data, library controller, dev-catalog CRUD
│   ├── qdrant/             # Vector search + prompt vectorization
│   ├── segments/           # User segments
│   ├── user-products/      # User ↔ product ownership
│   └── users/              # User profile / avatar / account
├── infra/                  # beehiiv, http, logger, mailer, stripe
├── common/                 # guards, decorators, pipes, filters, interceptors, dto
├── config/
├── app.module.ts
└── main.ts
```

---

## Database (Entities)

PostgreSQL via TypeORM. ~40 entities (`*.entity.ts`). Key groups:

### Prompts / Library
- `prompts` — core prompt record
- `prompts_tools`, `prompts_audience_types` — join tables
- `prompt_bookmarks`, `prompt_likes`
- `categories`, `tools`, `audience_type`
- `output_types`, `input_format`, `prompt_format`, `prompt_format_tools`
- `prompt_field_ai_instructions` (+ `_tools`, `_prompt_format`)

### Users
- `users` — accounts
- `user_emails`, `user_verification`, `user_products`, `user_audience_types`, `user_segments`
- `segments`, `authors`, `admins`

### Products / Billing
- `products`, `product_prices`, `products_output_types`
- `customer` — Stripe customer tracking

### Blog
- `post`, `post_revision`, `post_related`
- `tag`, `post_tag`, `post_tool`, `post_audience_type`, `blog_category`

### Misc
- `task`, `custom_prompt`, `content_link`, `redirect`, `sources`

> Blog and prompts both reference the shared `categories` table.

### Qdrant
- Collection of prompt embeddings + metadata (category, sub-category) for semantic search.

---

## Core Modules

### generator (`src/modules/generator/`)
Prompt generation. Two parallel sub-pipelines run **sequentially**:
1. `prompts-generation` queue → `prompt-body` + `variables[]` (mode by `input_type`: task→GENERATE, pre-prompt→OPTIMIZE, ready-prompt→FORMAT)
2. `fields-generation` queue → remaining fields (description, seo, how-to-use, tips, example-input/output, prompt-name, icon, html) in one JSON AI call

`InternalGeneratorService.processInternal` orchestrates; merges to `InternalAiResult`, screenshots if needed, saves to Postgres (`status='pending'`, `premium=true`).
- `CustomGeneratorService` — customer-facing generation
- `BulkInternalService` (`bulk/`) — `internal-bulk-queue`, concurrency 2; bulk create + format

### library (`src/modules/prompts/` → `LibraryController` + `LibraryService`)
Public read API: feed, detail, tools, categories, products, audience types.

### prompts (`src/modules/prompts/`)
`PromptsService` (data + filter-builder list), `DevCatalogController` (dev-only CRUD).

### auth (`src/modules/auth/`)
`AuthService`, `JwtStrategy`, `GoogleStrategy`. Guards: `JwtAuthGuard`, `OptionalJwtAuthGuard`. Email/password (bcrypt) + 6-digit verification + Google OAuth.

### billing (`src/modules/billing/`)
Stripe checkout (`stripe-checkout.controller`), subscriptions/management (`stripe.controller`), webhooks (`stripe-webhook.controller`, signature-verified).

### qdrant (`src/modules/qdrant/`)
`QdrantService` (search/add/delete), `QdrantClientService`, `QdrantSyncService` (`vectorizePrompts`: pulls published prompts → ingests embeddings). CRON sync (`qdrant-cron.service`).

### blog (`src/modules/blog/`)
`BlogController` (public posts/tags), `DevBlogController` (dev-only CRUD under `/api/dev/catalog`).

### notion (`src/modules/notion/`)
Library sync to Notion (`update-library`, `library-item/:id`), ApiKey-guarded.

### users / products / leads / mail
User profile + avatar + account deletion; product catalog; lead capture; support mail.

### admin (`src/admin/`)
Mounted under `/api/admin/*` via `RouterModule`. Guards: `AdminJwtGuard` + `RolesGuard`.

---

## API Endpoints

**Base path**: `/api` · **Swagger**: `/api`

### Auth (`/api/auth`)
```
POST   /auth/register                 # register
POST   /auth/register/tracking        # JWT — add tracking
POST   /auth/login                    # login
POST   /auth/refresh                  # refresh tokens
GET    /auth/google/web               # Google OAuth start
GET    /auth/google/web/callback      # Google OAuth callback
POST   /auth/forgot-password          # EmailThrottler
PATCH  /auth/reset-password           # reset via code
PATCH  /auth/update-password          # JWT
POST   /auth/verify-code              # EmailThrottler
POST   /auth/resend-code              # EmailThrottler
GET    /auth/me                       # JWT
```

### Users (`/api/users`) — JwtAuthGuard
```
PATCH  /users/profile
GET    /users/avatar
POST   /users/avatar
GET    /users/:email
DELETE /users/delete-account
```

### Library (`/api/library`) — public
```
GET    /library/prompts               # feed (PromptsQueryDto: offset, limit≤100,
                                       #   sort=date_published|views_count, order,
                                       #   categorySlug, subCategorySlug,
                                       #   audienceTypeSlug, tools[], search)
GET    /library/:id                   # detail (OptionalJwtAuthGuard)
GET    /library/:id/audience-types
GET    /library/tools
GET    /library/tools/:slug
GET    /library/categories
GET    /library/products
GET    /library/audience-types
```

### Prompts / Products / Blog — public
```
GET    /prompts                       # generic filter-builder list
GET    /products
GET    /blog/posts
GET    /blog/tags
GET    /blog/posts/:slug
```

### Generator (`/api/generator`)
```
POST   /generator/custom-prompt-generate  # EmailThrottlerGuard
GET    /generator/task-status/:taskId
POST   /generator/internal                # ApiKeyGuard — sync HTTP
POST   /generator/add-to-db               # DevOnlyGuard
POST   /generator/format-bulk             # ApiKeyGuard
```

### Billing / Stripe
```
POST   /stripe/create-checkout-session
POST   /stripe/webhook                          # signature-verified
POST   /billing/stripe/purchase-checkout
POST   /billing/stripe/subscription-checkout    # JwtAuthGuard
GET    /billing/stripe/session/:sessionId
POST   /billing/stripe/cancel-subscription
POST   /billing/stripe/update-subscription
GET    /billing/stripe/subscription/:subscriptionId
GET    /billing/stripe/customer/:customerId/subscriptions
POST   /billing/stripe/refund
POST   /billing/stripe/test-subscription-webhook/:subscriptionId
```

### Qdrant (`/api/qdrant`)
```
POST   /qdrant/search                 # public, throttled 50/min
POST   /qdrant/add                    # ApiKeyGuard
POST   /qdrant/vectorize-prompts      # ApiKeyGuard (was /qdrant/directus)
DELETE /qdrant/:id                    # ApiKeyGuard
DELETE /qdrant/collection/:name       # ApiKeyGuard
```

### Notion / Screenshots / Mail / Leads
```
PATCH  /notion/update-library              # ApiKeyGuard
DELETE /notion/library-item/:notion_id     # ApiKeyGuard
POST   /screenshots/generate               # ApiKeyGuard
POST   /mail/support                       # JwtAuthGuard
POST   /lead/capture
```

### Dev catalog (`/api/dev/catalog`) — DevOnlyGuard (disabled when NODE_ENV=production)
```
# Prompts catalog
PATCH/DELETE /dev/catalog/input-format/:id
PATCH/DELETE /dev/catalog/output-type/:id
PATCH/DELETE /dev/catalog/prompt-format/:id
POST         /dev/catalog/prompt
PATCH/DELETE /dev/catalog/prompt/:id
POST         /dev/catalog/prompt/:id/audience-type
DELETE       /dev/catalog/prompt/:id/audience-type/:atId
PATCH/DELETE /dev/catalog/category/:id
PATCH/DELETE /dev/catalog/tool/:id
GET/POST     /dev/catalog/audience-type
PATCH/DELETE /dev/catalog/audience-type/:id
# Blog catalog
PATCH/DELETE /dev/catalog/post/:id
GET/PATCH/DELETE /dev/catalog/tag(/:id)
```

### Admin (`/api/admin`) — AdminJwtGuard + RolesGuard
```
POST   /admin/auth/login
GET    /admin/auth/me
GET/POST/DELETE  /admin/admins(/:id)
GET    /admin/members ... POST create/ban/reset-password/update-products/refund, DELETE /:id
GET    /admin/prompts/...  (moderator-stats, formats, list, categories, tools, output-type,
                            input-formats, :id/publish, bulk-create, ...)
GET    /admin/stats/products
```

### Auth Schemes
1. **JWT Bearer** — `Authorization: Bearer <token>` (user or admin)
2. **API key** — `x-api-key` header
3. **Stripe signature** — webhook verification

### Rate Limiting
- Global `ThrottlerGuard`
- `EmailThrottlerGuard` on email-sending auth routes
- Qdrant `/search` — 50/min

---

## External Integrations

| Service | Purpose | Env |
|---|---|---|
| OpenAI | GPT + Assistants | `OPENAI_CUSTOM_API_KEY`, `OPENAI_INTERNAL_API_KEY`, `OPENAI_CONTEXT_API_KEY`, `OPENAI_ASST_HTML` |
| Anthropic | Claude | `ANTHROPIC_API_KEY` |
| Gemini | Google models | `GEMINI_API_KEY` |
| OpenRouter | Multi-model routing | `OPENROUTER_API_KEY` |
| Stripe | Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `STRIPE_PUBLISHABLE_*`, `STRIPE_SUCCESS_*`, `STRIPE_CANCEL_*` |
| Notion | Library sync | `NOTION_API_KEY`, `NOTION_CUSTOM_HISTORY_ID`, `NOTION_CUSTOM_PROMPTS_ID`, `NOTION_INTERNAL_PROMPTS_ID` |
| Qdrant | Vector search | `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_CRON_*` |
| MinIO | Object storage | `MINIO_HOST`, `MINIO_PORT`, `MINIO_PUBLIC_URL`, `MINIO_USER`, `MINIO_PASS` |
| Google | OAuth + Drive/GCS | `GOOGLE_CLIENT_*`, `GOOGLE_CALLBACK_*`, `GOOGLE_PRIVATE_*`, `GOOGLE_PROJECT_*`, `GOOGLE_MASTER_FOLDER_*` |
| Gotenberg | PDF / screenshots | `GOTENBERG_*` |
| Postmark | Transactional mail | `POSTMARK_API_*`, `POSTMARK_FROM_*`, `POSTMARK_TEMPLATE_*` |
| Beehiiv | Newsletter | `BEEHIIV_API_*`, `BEEHIIV_PUBLICATION_GOP_*` |
| MLflow | Experiment tracking | `MLFLOW_*` |

---

## Environment Variables

~83 keys. Categories:

| Category | Key vars |
|---|---|
| App | `NODE_ENV`, `APP_PORT`, `API_KEY`, `FREE_REQUESTS_COUNT`, `FRONTEND_*`, `URL_*`, `SUPPORT_*`, `CONTACT_*` |
| Database | `POSTGRES_HOST/PORT/USER/PASSWORD/DB/TIMEZONE` |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `ADMIN_JWT_SECRET`, `ADMIN_JWT_EXPIRES_IN`, `ADMIN_ROOT_*` |
| AI | `OPENAI_*`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY` |
| Google | `GOOGLE_CLIENT_*`, `GOOGLE_CALLBACK_*`, `GOOGLE_PRIVATE_*`, `GOOGLE_PROJECT_*`, `GOOGLE_MASTER_FOLDER_*` |
| Stripe | `STRIPE_SECRET_*`, `STRIPE_WEBHOOK_*`, `STRIPE_PRICE_*`, `STRIPE_PUBLISHABLE_*`, `STRIPE_SUCCESS_*`, `STRIPE_CANCEL_*`, `STRIPE_TEST_CUSTOMER_*` |
| Qdrant | `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_CRON_*` |
| Notion | `NOTION_API_KEY`, `NOTION_*_ID` |
| Mail | `SMTP_*`, `EMAIL_FROM_*`, `POSTMARK_*`, `BEEHIIV_*` |
| Storage | `MINIO_*`, `MLFLOW_*` |
| Redis | `REDIS_HOST`, `REDIS_PORT` |
| Gotenberg | `GOTENBERG_*` |

Env files: `.env` (local), `.env.dev`, `.env.staging`.

---

## Key Business Flows

### 1. Internal Prompt Generation (`POST /api/generator/internal`, sync HTTP)
```
Resolve sub_category → parent category
Resolve prompt_format, input_type
Resolve tools (batch, 404 on missing — generation does not start)
prompts-generation.run() → prompt-body + variables[]
fields-generation.run(prompt_body, variables) → 10 fields   (sequential)
Merge → InternalAiResult
Screenshot if image-type / HTML present
Save to Postgres (status='pending', premium=true)
Return InternalAiResult
```

### 2. Registration
```
Submit email/password/name → bcrypt hash
Create user + user_email (primary) in Postgres
Generate 6-digit code → send verification email
Return success (must verify)
```

### 3. Google OAuth
```
/auth/google/web → Google consent → callback with profile
Find or create user + email in Postgres → mark verified
Issue JWT (access + refresh) → redirect to frontend
```

### 4. Semantic Search (`POST /api/qdrant/search`)
```
Query + filters → embedding
Query Qdrant (vector + category/sub-category filters)
Return matched prompts
```

### 5. Prompt Vectorization (`POST /api/qdrant/vectorize-prompts`, ApiKeyGuard)
```
Load published prompts from Postgres (paginated, optional dateUpdatedGte)
Ingest each into Qdrant (id, category, sub_category, page_name, prompt_body, description)
Return synced prompts
```
Also runs on a CRON schedule (`qdrant-cron.service`).

### 6. Payment
```
create-checkout-session → find/create Stripe customer (stored in `customer` table)
User pays → webhook (signature-verified) → update customer / grant access
```

---

## Development Guide

### Setup
```bash
npm install
cp .env.example .env      # fill required vars
npm run local             # Docker (postgres/redis/...) + nest watch
npm run migration:run     # apply migrations
```

### Scripts
```bash
npm run local                          # Docker up + wait + nest watch
npm run dev                            # nest watch (.env)
npm run run:local                      # nest watch (.env.staging)
npm run build                          # nest build
npm run migration:generate --name=Foo  # generate TypeORM migration
npm run migration:run                   # run migrations
npm run migration:revert                # revert last
npm run prettier                        # format
npm run lint                            # eslint
npm run test                            # jest
```

### Docker services (`docker-compose.yml`)
PostgreSQL, Redis, Gotenberg, MLflow (optional).

### Conventions
- Strict TypeScript — explicit types everywhere (see `CLAUDE.md`)
- Interfaces prefixed `I` (`IUser`); type aliases not
- No doc-blocks / obvious comments — only non-obvious WHY
- Files: `*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.entity.ts`, `*.module.ts`

### Guards reference
| Guard | Purpose | Location |
|---|---|---|
| `JwtAuthGuard` / `OptionalJwtAuthGuard` | User JWT | `src/modules/auth/guards/` |
| `AdminJwtGuard` + `RolesGuard` | Admin auth + roles | `src/admin/...` |
| `ApiKeyGuard` | `x-api-key` validation | `src/common/guards/` |
| `DevOnlyGuard` | Blocks only when `NODE_ENV=production` | `src/common/guards/` |
| `EmailThrottlerGuard` / `ThrottlerGuard` | Rate limiting | auth / global |

### Security Notes
- Never commit API keys / secrets
- Verify all webhook signatures (Stripe)
- `x-api-key` required for generator / qdrant-write / notion / screenshots
- `DevOnlyGuard` routes are open outside production — keep dev host private
- bcrypt password hashing

---

**Last Updated**: 2026-06-02
**Version**: 2.0.0