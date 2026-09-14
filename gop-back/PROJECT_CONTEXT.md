# GoP Backend - Quick Context

> Compact reference for quick project orientation (auto-load into AI context)

## Project Type
**NestJS RESTful API** for AI-powered prompt generation platform (SaaS)

## Tech Stack (Core)
- **Framework**: NestJS 10 + TypeScript 5.1
- **Database**: PostgreSQL (TypeORM) — single source of truth
- **Queue**: Bull + Redis
- **AI**: OpenAI GPT, Anthropic Claude, Google Gemini, OpenRouter
- **Vector DB**: Qdrant (semantic search)
- **Payment**: Stripe
- **Auth**: JWT + Google OAuth (Passport)
- **Storage**: MinIO, Google Drive / Cloud Storage
- **Mail**: SMTP + Postmark templates, Beehiiv
- **Integrations**: Notion API, Gotenberg (PDF/screenshots), MLflow

## Project Structure (Key Folders)

```
src/
├── admin/          # Admin panel (RouterModule → /api/admin/*)
│   └── modules/    # admins, auth, members, prompts, stats
├── modules/        # Feature modules (see below)
├── infra/          # beehiiv, http, logger, mailer, stripe
├── config/         # Config
├── common/         # Guards, decorators, pipes, filters, interceptors
├── app.module.ts
└── main.ts         # Global prefix `api`
```

**Feature modules** (`src/modules/`):
`activity`, `ai`, `auth`, `billing`, `blog`, `csv`, `generator`, `google-drive`,
`gotenberg`, `leads`, `library`, `mail`, `minio`, `mlflow`, `notion`, `products`,
`prompts`, `qdrant`, `segments`, `user-products`, `users`

## Database (PostgreSQL + TypeORM)

All data in Postgres. ~40 entities (`*.entity.ts`), incl:
- **prompts** + `prompts_tools`, `prompts_audience_types`, `prompt_bookmarks`, `prompt_likes`
- **categories**, **tools**, **audience_type**, **output_types**, **input_format**, **prompt_format**
- **users** + `user_emails`, `user_products`, `user_verification`, `user_audience_types`, `user_segments`
- **products** + `product_prices`, `products_output_types`
- **post** (blog) + `tag`, `post_tag`, `post_tool`, `post_audience_type`, `post_revision`, `post_related`
- **customer** (Stripe), **task**, **custom_prompt**, **admins**, **segments**, **authors**, **redirect**, **sources**

Migrations: TypeORM CLI (`orm.config.ts`, `./migrations`).

## Core Modules

| Module | Purpose | Key Files |
|---|---|---|
| **generator** | ⭐ Prompt generation (internal + custom + bulk) | InternalGeneratorService, CustomGeneratorService, BulkInternalService |
| **library** | Public prompt library (feed, detail, tools, categories) | LibraryService |
| **prompts** | Prompts data + dev-catalog CRUD | PromptsService, DevCatalogController |
| **ai** | AI orchestration (GPT/Claude/Gemini/OpenRouter) | queue processors |
| **auth** | Auth (JWT + Google OAuth + email verify) | AuthService, JwtStrategy, GoogleStrategy |
| **users** | User profile, avatar, account | UsersService |
| **billing** | Stripe checkout, subscriptions, webhooks | stripe controllers/services |
| **qdrant** | Semantic search + prompt vectorization | QdrantService, QdrantSyncService |
| **blog** | Public blog feed + dev CRUD | BlogService |
| **notion** | Library sync to Notion | NotionService |
| **products** | Product catalog | ProductsService |

## API Endpoints (Main Groups)

```
/api/admin/*          # Admin panel (AdminJwtGuard + RolesGuard)
/api/auth/*           # Register, login, refresh, OAuth, verify, password
/api/users/*          # Profile, avatar, delete-account (JwtAuthGuard)
/api/library/*        # Public prompt library (feed + detail + tools + categories)
/api/prompts          # Generic prompts list (filter-builder)
/api/products         # Product catalog
/api/blog/*           # Public blog feed
/api/generator/*      # Prompt generation (ApiKeyGuard / EmailThrottlerGuard)
/api/billing/stripe/* # Checkout, subscriptions
/api/stripe/webhook   # Stripe webhook (signature-verified)
/api/qdrant/search    # Semantic search (public, throttled)
/api/qdrant/*         # add / vectorize-prompts / delete (ApiKeyGuard)
/api/notion/*         # Library sync (ApiKeyGuard)
/api/screenshots/*    # Screenshot gen (ApiKeyGuard)
/api/mail/support     # Support mail (JwtAuthGuard)
/api/lead/capture     # Lead capture
/api/dev/catalog/*    # Dev-only catalog CRUD (DevOnlyGuard — disabled in prod)
```

**Auth**: JWT Bearer (user / admin) or `x-api-key` header
**Docs**: Swagger at `/api`

## Main Business Flow

```
Internal Prompt Generation (POST /api/generator/internal, sync HTTP):
1. prompts-generation queue → prompt-body + variables[]
2. fields-generation queue → description/seo/how-to-use/example/icon/html (sees body)
3. Merge → InternalAiResult
4. Screenshot (if image-type / HTML)
5. Save to Postgres (status='pending', premium=true)
6. Return InternalAiResult
```

## Environment Categories (~83 keys)

- **Database**: `POSTGRES_*`
- **JWT**: `JWT_*`, `ADMIN_JWT_*`
- **AI**: `OPENAI_*`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`
- **Google**: `GOOGLE_CLIENT_*`, `GOOGLE_PRIVATE_*`, `GOOGLE_CALLBACK_*`, `GOOGLE_MASTER_FOLDER`
- **Stripe**: `STRIPE_SECRET_*`, `STRIPE_WEBHOOK_*`, `STRIPE_PRICE_*`, `STRIPE_PUBLISHABLE_*`
- **Qdrant**: `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_CRON_*`
- **Notion**: `NOTION_API_KEY`, `NOTION_*_ID`
- **Mail**: `SMTP_*`, `EMAIL_FROM_*`, `POSTMARK_*`, `BEEHIIV_*`
- **Storage**: `MINIO_*`, `MLFLOW_*`
- **Redis**: `REDIS_*`
- **App**: `APP_*`, `API_KEY`, `FRONTEND_*`, `URL_*`, `NODE_ENV`

## Queues (Bull/Redis)

- **prompts-generation** — prompt-body + variables
- **fields-generation** — remaining fields (one AI call, json_object)
- **internal-bulk-queue** — bulk internal + format (concurrency 2)

Sequential: prompts-generation → fields-generation (fields see real body).

## Authentication

**Methods**: Email/password (bcrypt) + email verification; Google OAuth 2.0

**Guards**:
- `JwtAuthGuard` / `OptionalJwtAuthGuard` — user JWT
- `AdminJwtGuard` + `RolesGuard` — admin
- `ApiKeyGuard` — `x-api-key` (internal/webhooks/generator)
- `DevOnlyGuard` — blocks only when `NODE_ENV=production`
- `EmailThrottlerGuard` — rate limit
- `ThrottlerGuard` — global rate limit

## External Integrations

| Service | Purpose | Env |
|---|---|---|
| OpenAI | GPT + Assistants | `OPENAI_*` |
| Anthropic | Claude | `ANTHROPIC_API_KEY` |
| Gemini | Google models | `GEMINI_API_KEY` |
| OpenRouter | Multi-model routing | `OPENROUTER_API_KEY` |
| Stripe | Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Notion | Library sync | `NOTION_API_KEY`, `NOTION_*_ID` |
| Qdrant | Vector search | `QDRANT_URL`, `QDRANT_API_KEY` |
| MinIO | Object storage | `MINIO_*` |
| Postmark | Transactional mail | `POSTMARK_*` |
| Beehiiv | Newsletter | `BEEHIIV_*` |
| Gotenberg | PDF / screenshots | `GOTENBERG_*` |

## Common Patterns

**Adding a feature**:
1. Create module: `src/modules/feature-name/`
2. Controller → Service → DTO → Entity
3. Register in `app.module.ts`
4. Swagger decorators

**File locations**:
- Controllers: `module/controllers/*.controller.ts`
- Services: `module/services/*.service.ts`
- DTOs: `module/dto/*.dto.ts`
- Entities: `module/entities/*.entity.ts`

## Quick Commands

```bash
npm run local              # Start dev (Docker + watch)
npm run migration:run      # Run TypeORM migrations
npm run migration:generate --name=Foo   # Create migration
npm run prettier           # Format
npm run lint               # Lint
```

## Git Branch

- Main branch: **development**

## Important Notes

- ⚠️ **PostgreSQL** is the single source of truth (TypeORM)
- ⚠️ **Queue-based** AI via Bull/Redis
- ⚠️ **API key** (`x-api-key`) required for generator / qdrant-write / notion / screenshots
- ⚠️ **DevOnlyGuard** routes (`/api/dev/catalog/*`) open outside production
- ⚠️ **Stripe webhook** signature-verified

## Detailed Documentation

See **PROJECT_REFERENCE.md** — full flows, endpoints, modules, env, diagrams.

---
**Version**: 2.0.0 | **Updated**: 2026-06-02
