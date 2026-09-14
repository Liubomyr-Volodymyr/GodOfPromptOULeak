# Prompt Library — Taxonomy & Programmatic-SEO Architecture

Canonical reference for the library. Source of truth provided by Robert
(2026-05-30). Read this before touching browse, filter routes, cards, or
any taxonomy code.

## The four axes

| Axis | Collection | Authoritative state |
| --- | --- | --- |
| **Domain** | `categories` | 18 parents · ~178 subs · **role-free** · migration = pgAdmin row-ops (no dev) |
| **Modality** | `output_types` | 9 rows · needs `+plb_instructions`, `+seo_description` |
| **Engine** | `tools` | 59 rows · 48 have `plb_instructions` ✅ |
| **Who** | `roles` | 25 rows · **needs dev** (new collection = TypeORM entity + endpoints) |

Notes / current-build deltas:

- **Domain (categories).** "Role-free" means personas (e.g. `solopreneurs`)
  are leaving `categories` and becoming **roles**. Our mirror
  `src/content/seo/categories.json` is PRE-migration: it has 19 roots
  (incl. `solopreneurs`) and a dirty slug `"photography "` (trailing
  space). Re-mirror after the pgAdmin row-ops land → expect 18 parents.
- **Modality (output_types).** 9 rows exist in the collection, but only
  ids `1` (Text) and `2` (Image) are populated/used today, and there is
  **no `/api/output_types` endpoint** (404). The Type lens hardcodes the
  2 live values; expand to all 9 once they carry copy + an endpoint ships.
- **Engine (tools).** 59 real tools; the browse lens currently surfaces 7
  popular models. Plan: top-N in the lens + a "see all tools" index.
- **Who (roles).** Curated 25-role list lives in `src/lib/roles.ts`.
  Prompts do NOT carry a role field yet (backend collection + endpoints
  pending), so role PAGES show the popular set as a stand-in and the card
  role byline stays hidden until `roleSlug` is populated.

## Combo (intersection) pages — programmatic SEO

Two axes crossed into one landing page. Priority order:

| Combo | Example | Strength |
| --- | --- | --- |
| **Audience × Tool** | "ChatGPT Prompts for Solopreneurs" | 🔥 highest (who + engine) |
| Category × Tool | "Legal Claude Prompts" | strong (~1,651 existing) |
| Category × Type | "Marketing Image Prompts" | good |
| Tool × Type | "Claude Coding Prompts" | good |

Only mint the deliberate, high-value intersections as indexable URLs.
Canonicalize / `noindex` arbitrary combinations (faceted-SEO discipline).

## How a slug is used across surfaces

| Surface | Slug used as | Output |
| --- | --- | --- |
| SEO page | URL + H1 | `/prompts/for/marketers` → "AI Prompts for Marketers" |
| Page intro | count + role | "47 prompts built for marketers — copy, paste, done." |
| CRM email merge | `{{role}}` variable | "Hey {{first-name}}, 12 new prompts for marketers this week →" |
| Card chip | clickable label | `Perfect for: 💼 Marketers` → links to the page |

## URL conventions

Authoritative example given: **`/prompts/for/{role}`** (role pages).

⚠️ Current build uses `/prompt-library/{role|tool|type|category}/...`.
This diverges from the `/prompts/for/...` example. RESOLVE before more
routes are built — decide whether the whole library moves under
`/prompts/...` (and the per-axis path shapes) or roles alone use
`/prompts/for/`. Until decided, existing routes stay at
`/prompt-library/...`.

## Current implementation status (gop-web)

- Browse: `LibraryBrowse` — segmented lens (Topics/Tools/Roles/Type) over
  one scrolling value row; all axis links in the DOM (crawlable).
- Routes built: `/prompt-library/{category,tool,type,role}/[slug]` — each
  self-canonical, one H1, breadcrumb JSON-LD, ISR 300.
- Card: tool tags + category tag + (role byline when present) + footer
  (views · like · bookmark). Tags match design-system node 568-1600
  (h22 / rounded-8 / brand fills).
- Data: `lib/categories.ts`, `lib/roles.ts`; `getPromptsBy{Category,Type,
  Tool,Role}` in `lib/api/prompts.ts` (tool/role use a popular-set
  stand-in until backend filters exist).

## Open gaps / TODO when backend lands

1. Per-prompt `role` / `roleSlug` field → real role filtering + card byline.
2. `/api/output_types` endpoint + the other 7 output types (with copy).
3. Tools index ("see all 59") + lens top-N.
4. Re-mirror role-free categories (18 parents); fix `"photography "` slug.
5. Combo pages, starting with Audience × Tool.
6. Confirm `/prompts/for/...` URL scheme and migrate routes if adopted.
