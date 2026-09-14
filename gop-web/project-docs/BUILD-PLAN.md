# gop-web — Build Plan & SEO Guardrails

> AUTHORITATIVE — the sequence, the parity rules, the migration plan, and the SEO invariants that prevent another April-17 cliff. If you are the agent building this app, read this in full before writing your first PR.

This doc complements:
- `ARCHITECTURE.md` — system overview (don't repeat)
- `DECISIONS.md` — locked ADRs (don't re-debate)
- `INFRASTRUCTURE.md` — deploy + envs (don't reinvent)

This doc covers: phase sequence, SEO invariants, URL parity, WP migration, article-update workflow.

---

## Table of contents

1. Context — why this rebuild exists
2. Phase sequence (A → F, ~17 weeks)
3. SEO invariants (the non-negotiables)
4. URL parity rules
5. MDX frontmatter contract
6. Schema.org emission per route type
7. Article update workflow
8. WordPress migration plan (Phase D)
9. Cutover protocol
10. Test gates per phase
11. Open questions

---

## 1. Context — why this rebuild exists

godofprompt.ai went through a major disruption on **April 17, 2026**. URL pattern rebuild + comprehensive `noindex` + AI bot block (CF) + JS-only SPA without prerender → traffic collapsed from ~40K impressions/day to ~3.6K/day by May 3. Recovery underway (40K/day as of May 22) but ~90% below the Feb 2026 peak of 369K/day.

The rebuild caused the cliff. **This Next.js rebuild must not cause a second cliff.** Three rules absolute, no exceptions:

1. **URL parity is sacred** — every currently-ranking URL resolves at the same path with equivalent content post-cutover OR has a real 301 to its replacement. See section 4.
2. **Schema continuity** — every page emits at least the same schema.org graph as the current site (Article, Product, BreadcrumbList, Organization, WebSite). See section 6.
3. **`dateModified` preservation on blog migration** — 1,001 blog posts carry their existing `dateModified` timestamps forward, NOT reset to migration day. See section 8.

The `gop-seo/dist/` directory holds the data backing these rules:
- `ga4-pre-disruption-urls.csv` — every URL with traffic, what it ranked for
- `recovery-redirect-map-v2-RENAME.csv` — every 301 rule needed
- `combo-seo-bodies.json` — 1,651 unique combo page bodies (tool × category)
- `category-seo-text-polished.json` — per-category SEO body content
- `homepage-faqs.json`, `prompt-library-hub-seo.json` — hub page content
- `llms.txt` — canonical AI-engine discovery file

Everything in `gop-seo/dist/` is the source of truth for content. This repo renders it.

---

## 2. Phase sequence

```
Phase A   Weeks 1-4    Build Next.js parity for non-blog surface
Phase B   Weeks 4-6    MDX blog scaffolding (no migration yet)
Phase C   Weeks 5-8    Article update workflow (n8n + git + AI)
Phase D   Weeks 8-12   WordPress → MDX migration (1,001 posts)
Phase E   Weeks 12-14  Cutover + 14-day parallel run + 30-day WP shadow
Phase F   Week  17     Decommission WordPress
```

WP keeps serving `/blog/*` through phases A-D. Cutover happens at phase E. No URL goes dark.

### Phase A — Non-blog parity (weeks 1-4)

Goal: render every non-blog URL the current site serves, at the same path, with equivalent SEO output, via Next.js.

**Routes to ship (in priority order):**

| Priority | Route | Source | Notes |
|---|---|---|---|
| 1 | `/` | API + JSON files | Hero, AI evolution timeline, CAB teaser, trustbar, homepage FAQ |
| 1 | `/prompt-library` | `prompt-library-hub-seo.json` | Hub with 19 cat + 7 tool + 4 type grids, 7 FAQs, 3 JSON-LD schemas |
| 1 | `/prompt-library/category/[slug]` | API + `category-seo-text-polished.json` | 19 routes |
| 1 | `/prompt-library/tool/[slug]` | API + `tool-seo-bodies.json` | 7 routes |
| 1 | `/prompt-library/type/[slug]` | API | 2 live (text, image), 2 coming soon (code, search) |
| 1 | `/prompt-library/category/[slug]/sub/[sub]` | API + `sub-seo-bodies.json` | ~180 subcategory routes |
| 1 | `/prompt-library/category/[c]/tool/[t]` | API + `combo-seo-bodies.json` | combo routes |
| 1 | `/prompt-library/category/[c]/type/[t]` | same | combo routes |
| 1 | `/prompt-library/tool/[t]/category/[c]` | same | combo routes |
| 1 | `/prompts/[slug]` | API | 5,300+ individual prompt detail pages |
| 1 | `/complete-ai-bundle` | local content | Flagship landing page. Canonical = self. NOT under `/products`. |
| 2 | `/products` | local content | Product index |
| 2 | `/products/[slug]` | local content + API | 6 paid SKUs: custom-gpts-toolkit, automations-bundle, ai-tools-directory, ai-cheatsheets, custom-instructions, mega-prompt-template |
| 2 | `/guides` | local content | Guide directory — replaces broken WP `/guides` |
| 2 | `/guides/[slug]` | local content + API | 11 free mastery guides — finally real pages, not homepage shells |
| 3 | `/prompt-generator` | API | Generator form + Stripe redirect |
| 3 | `/contact` | local content | Form posts to backend |
| 3 | `/privacy-policy`, `/terms` | local content | Legal |
| 3 | `/llms.txt` | static file in `public/` | Source: `gop-seo/dist/llms.txt` |
| 3 | `/robots.txt` | generated | Allow all + sitemap pointers |
| 3 | `/sitemap.xml` | generated parametrically | Trimmed to ~250 high-signal URLs (NOT 7,000) |

**`/blog/*`** during phase A is still proxied to WordPress via Caddy. Untouched.

**Cutover at end of phase A:** Caddy DNS swap from `gop-web-temp` to `gop-web`, `/blog/*` keeps pointing at WP.

### Phase B — MDX blog scaffolding (weeks 4-6)

Goal: prove the MDX blog pipeline works with 5-10 manually-authored sample posts. WP is untouched.

- Set up `src/content/blog/*.mdx` directory + frontmatter contract (section 5)
- Build `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/author/[slug]`, `/blog/tag/[slug]` routes
- Build RSS feed at `/blog/feed.xml`
- Build `/blog/sitemap.xml` (separate from main sitemap, merged at `/sitemap_index.xml`)
- Schema.org Article emission (section 6)
- Write 5-10 sample MDX posts to verify the pipeline
- All routes are gated behind `staging.godofprompt.ai` — not exposed at prod yet

### Phase C — Article update workflow (weeks 5-8, parallel to B)

Goal: ship the n8n + git workflow that takes an existing article + GSC stats + SERP analysis → updated MDX file → git commit → Hetzner redeploy. See section 7.

### Phase D — WP → MDX migration (weeks 8-12)

Goal: extract 1,001 WP posts → MDX files in `src/content/blog/` with full metadata preservation. See section 8.

### Phase E — Cutover (weeks 12-14)

Goal: Caddy stops proxying `/blog/*` to WP, Next.js serves all of it. See section 9.

### Phase F — Decommission WP (week 17)

After 30 days of `/blog/*` served by Next.js with zero impression regression, shut down WordPress.

---

## 3. SEO invariants

Every PR is checked against this list. CI gate before merge.

### Per-route metadata (no exceptions)

Every route component MUST export `generateMetadata()` returning at minimum:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: '…',                       // ≤70 chars, includes primary keyword
    description: '…',                 // ≤160 chars, includes primary keyword, NOT generic fallback
    alternates: {
      canonical: 'https://godofprompt.ai/…',  // ABSOLUTE URL, self-referencing
    },
    openGraph: {
      title: '…',
      description: '…',
      url: '…',
      images: [{ url: '…', width: 1200, height: 630 }],
      type: 'website' | 'article' | 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: '…',
      description: '…',
      images: ['…'],
    },
    robots: { index: true, follow: true, ... },  // explicit, never the default
  };
}
```

If a route can't fill all of these (e.g. private dashboard) → set `robots: { index: false }` explicitly. No route ships without explicit robots state.

### Heading hierarchy

- Exactly ONE `<h1>` per route. Always.
- No skipped levels (h2 → h4 is forbidden).
- H1 must contain the primary keyword for the route.

### Anchors vs buttons (the combo internal-linking lesson)

Filter chips, pagination, "view all" — every navigational interaction is `<Link>` (which renders `<a href>`), never `<button>`. Crawlers don't click; they follow `href`. The combo URLs depend on this.

If JS-intercepted in-place filtering is wanted, use `<Link>` + `onClick={e => { e.preventDefault(); setFilter(...) }}`. Same UX, real anchor tag in DOM.

### Images

- All `<img>` tags forbidden. Use Next 16 `<Image>` component or explicit `width` + `height` props on raw `<img>` only when `<Image>` is impossible.
- `alt` text is mandatory. Decorative images use `alt=""` explicitly, never omitted.
- Hero / above-the-fold images get `priority` prop. All others get `loading="lazy"` (default behavior of Next Image, just don't override).
- All images served as WebP or AVIF. Originals can stay PNG/JPG, Next Image handles format negotiation.

### Schema.org emission

Every route type has a required schema graph. See section 6 for the full table.

### Internal linking

- Hub pages link to every category, tool, and type they cover (existing `<FilterChipGrid>` pattern from `gop-web-temp` is right).
- Combo pages link to siblings (category/X/tool/A links to category/X/tool/B for other tools).
- Blog posts auto-link 2-5 prompt-library or product URLs based on category alignment.
- Footer carries one link to `/prompt-library/all` (the flat index for crawlers).

### Performance non-negotiables

- Mobile Lighthouse Performance score must be ≥80 on every public route.
- LCP element must be either:
  - The hero image (preloaded via `<link rel="preload" as="image" fetchpriority="high">`)
  - Or a server-rendered `<h1>` (no client-side hydration before LCP)
- No client-side fetch in the LCP path. RSC + ISR only.
- CLS ≤ 0.1 — every image has dimensions, no late-injected DOM above the fold.
- INP ≤ 200ms — Server Components by default, mark `'use client'` only when interaction is required.

### Robots + sitemap rules

- `robots.txt` at apex: `Allow: /` + sitemap pointers. No `Disallow` unless explicitly intentional.
- `sitemap.xml` includes only high-signal URLs (~250 total). Trim the 7K-URL approach. See section about sitemap generation.
- `llms.txt` served as `text/plain` (Next route handler, NOT a redirect).

---

## 4. URL parity rules

The April-17 disaster happened because URLs broke. This phase prevents that.

### Rule 0: nothing ships without a parity check

Before any route merges, run the parity matrix:

```bash
# Pseudo-command — define a real script in scripts/parity-check.ts
pnpm parity:check
```

This script:
1. Reads `gop-seo/dist/ga4-pre-disruption-urls.csv` (URLs that had traffic)
2. For each, curls `http://localhost:3000<url>`
3. Verifies: status 200 OR 301 (with a correct destination), title not empty, canonical present, NOT serving homepage HTML shell.
4. Fails the build if ≥5% of URLs fail.

### Rule 1: every legacy URL maps somewhere

| Legacy URL pattern | Action |
|---|---|
| `/prompt-library/<tool>-<category>` (flat format, 200+ URLs) | 301 to `/prompt-library/category/<category>/tool/<tool>` |
| `/prompt` | 301 to `/prompt-library` |
| `/prompts` | 301 to `/prompt-library` |
| `/gpts` | 301 to `/products/custom-gpts-toolkit` |
| `/ai-prompt-generator` | 301 to `/prompt-generator` |
| `/pricing` | 301 to `/complete-ai-bundle` |
| `/perplexity-mastery-guide` (root-level) | 301 to `/guides/perplexity-mastery-guide` |
| `/prompt-engineering-guide` (root-level) | 301 to `/guides/prompt-engineering-guide` |
| `/products/premium-complete-ai-bundle` | 301 to `/complete-ai-bundle` (kill the Directus storage slug leak) |
| `/products/<guide-slug>` (the 11 mastery guides currently routed wrong) | 301 to `/guides/<slug>` |
| Anything in `gop-seo/dist/recovery-redirect-map-v2-RENAME.csv` | Use the mapping in that file |

Implementation: `next.config.ts` `redirects()` function + Cloudflare Bulk Redirect rules for the long tail. Either layer works. **Prefer CF Bulk Redirect for the 200+ flat-format URLs** (faster, no Next.js cold start cost).

### Rule 2: canonical URLs are absolute, self-referencing

```ts
// Right
canonical: 'https://godofprompt.ai/prompt-library'

// Wrong — relative paths can be misinterpreted
canonical: '/prompt-library'

// Wrong — pointing to a different URL is reserved for genuine duplicates only
canonical: 'https://godofprompt.ai/'  // homepage canonical from a non-homepage page
```

### Rule 3: no soft-404s

The current site has 57 soft-404s in GSC: URLs that return 200 but serve homepage HTML. Pattern caused by SPA fallback. Forbidden in this rebuild:

- If a route doesn't have data, return a real 404 status, not the homepage.
- Dynamic routes (e.g. `/prompts/[slug]`) MUST call `notFound()` when the slug doesn't exist.
- Catch-all routes (e.g. legacy URL handlers) MUST 301 to a real destination or 404 — never render homepage.

### Rule 4: query strings preserved on 301

When 301-ing, preserve query strings. Stripe callback URLs, UTM tracking, share links — all depend on this.

```ts
{
  source: '/old-path',
  destination: '/new-path',
  permanent: true,
  // Query strings are preserved by default in Next 16; verify per redirect
}
```

---

## 5. MDX frontmatter contract

Every blog post in `src/content/blog/*.mdx` MUST have this frontmatter:

```yaml
---
# Identity
slug: chatgpt-no-restrictions-2024       # MUST match filename (sans .mdx) and URL
title: ChatGPT No Restrictions (Ultimate Guide for 2026)
excerpt: A 60-160 char excerpt for the listing page.

# Authorship + dates
author: robert-youssef                   # MUST match a file in src/content/authors/*.mdx
date_published: 2023-09-18T00:00:00Z     # NEVER changes after first publish
date_modified: 2026-05-18T00:00:00Z      # Auto-updated by article-update workflow + manual edits
last_reviewed: 2026-05-18T00:00:00Z      # Human-set freshness anchor

# Taxonomy
category: prompt-engineering              # MUST be one of the 9 pillars
tags: [jailbreak, dan, chatgpt, restrictions]

# Media
hero_image: /blog/images/chatgpt-no-restrictions-hero.webp
hero_image_alt: ChatGPT prompt being typed into the model interface
og_image: /blog/og/chatgpt-no-restrictions.png   # 1200×630, branded

# SEO
meta_title: ChatGPT No Restrictions Guide 2026 (Working Methods)   # ≤70
meta_description: Make ChatGPT respond without restrictions in 2026 — current methods for GPT-5 and Claude using Custom Instructions, role-prompting, and structured unfiltered creative prompts.    # ≤160
canonical_url: https://godofprompt.ai/blog/chatgpt-no-restrictions-2024   # full URL
schema_type: Article                     # Article | HowTo | NewsArticle | TechArticle

# Migration metadata (only for migrated posts, not new ones)
wp_post_id: 1234                         # Original WordPress ID for traceability
migrated_at: 2026-08-15T12:00:00Z        # When the migration script wrote this file
---

Markdown body here…
```

**Validation:** a build-time script (`scripts/validate-mdx.ts`) checks every MDX file has all required fields, dates are valid, slug matches filename, category is in the allowed list. CI fails if any post fails validation.

**The 9 pillars (locked from gop-seo blog-cluster-plan.md):**

```
design · coding · marketing · writing · automation ·
prompt-engineering · ai-at-work · news · ai-tools
```

Plus 2 planned: `context-engineering`, `harness-engineering`. Add when ≥10 posts ready.

---

## 6. Schema.org emission per route type

Every route emits the schemas below as `<script type="application/ld+json">` tags. The current WordPress + Yoast graph is the reference — don't lose what's already there.

| Route | Required schemas | Notes |
|---|---|---|
| `/` | Organization, WebSite (with SearchAction), BreadcrumbList | Existing emission is correct |
| `/prompt-library` | CollectionPage, BreadcrumbList, ItemList (19 categories) | Existing JSON content in `prompt-library-hub-seo.json` |
| `/prompt-library/category/[slug]` | CollectionPage, BreadcrumbList, ItemList (prompts in category) | — |
| `/prompt-library/tool/[slug]` | CollectionPage, BreadcrumbList, ItemList (prompts for tool) | — |
| `/prompts/[slug]` | Article (the prompt's description), BreadcrumbList | The prompt body itself is not "Article" content — but the prompt page IS |
| `/complete-ai-bundle` | Product, Brand, Offer, BreadcrumbList, AggregateRating + Review (when reviews exist) | Add Review when 3+ verified Stripe customer quotes available |
| `/products/[slug]` | Product, Brand, Offer, BreadcrumbList | Per paid SKU |
| `/guides/[slug]` | Article (NOT Product — guides are free content), BreadcrumbList | Lead-magnet schema |
| `/blog/[slug]` | Article (or `schema_type` from frontmatter), Person (author), Organization (publisher), BreadcrumbList | Mirror Yoast's graph |
| `/blog` | Blog, BreadcrumbList | Blog index |
| `/contact` | ContactPage, BreadcrumbList | — |

**Do NOT emit FAQPage schema** — Google deprecated FAQ rich results outside government/health verticals in 2023. Plain HTML Q&A is fine and the right pattern; the schema adds zero SERP value and can trigger spam reviews.

**Do NOT emit HowTo schema** unless the page is literally a step-by-step procedure. Same deprecation logic.

**Speakable schema** — add to top blog posts after they migrate. Helps Google Assistant / voice search. One-line addition.

---

## 7. Article update workflow

Builds on the spec from the SEO pro (separate document at `gop-seo/docs/PR-article-update-system.md`). This section locks the gop-web-side contract.

### Where this workflow runs

- **Orchestration:** n8n (existing instance)
- **Storage:** `src/content/blog/*.mdx` files in this repo
- **Execution:** n8n commits to a `chore/article-update/<slug>` branch via GitHub API, opens a PR to `staging`, Telegram approval triggers merge
- **Deploy:** standard staging → main pipeline picks up the merge

### Inputs the workflow needs

1. **Target list:** Google Sheet (https://docs.google.com/spreadsheets/d/1Ygsm-3bYcCI9xtkS4oCbNPBsPyzxSq0byyXWnr4FIcI) — top 100 blog posts ranked by pre-disruption pageviews, prioritized
2. **Current article:** read MDX file from this repo via GitHub API
3. **GSC stats:** last 90 days of queries + clicks + impressions + position for this URL (via GSC API)
4. **SERP analysis:** DataForSEO top-10 for each of top 3-4 keywords from GSC
5. **Competitor content:** fetched HTML of 10 chosen competitors from the SERP top-10

### Workflow stages (n8n nodes)

```
1. Trigger        — cron weekly OR manual /update next 5 command
2. Pick targets   — Read priority list, take next 5 articles in queue
3. For each:
   3a. Fetch MDX  — GitHub API GET .mdx file
   3b. Fetch GSC  — GSC API for this URL, top queries 90d
   3c. Extract kw — Claude: pick 3-4 keywords, sanitize year suffixes
   3d. SERP pull  — DataForSEO top-10 per keyword
   3e. Filter     — Claude: keep ~10 relevant competitor articles
   3f. Analyze    — Claude (Surfer-clone): density, bigrams, trigrams, H2/H3,
                    page elements, required topical coverage
   3g. Generate   — Claude: update article preserving voice + style, replace
                    outdated facts + year, optimize for keywords + competitor
                    analysis, internal links to /prompt-library + /products
4. Output         — New MDX content with updated frontmatter:
                    - date_modified: NOW()
                    - last_reviewed: NOW()
                    - body: rewritten markdown
                    - meta_title, meta_description: refreshed
5. Branch + PR    — GitHub API: create branch, commit MDX, open PR
6. Telegram       — Send diff to Telegram channel, /approve | /reject | /edit
7. Merge          — On /approve, merge PR → staging triggers deploy
8. Ping           — IndexNow ping, GSC URL Inspection refresh
9. Log            — Postgres: log update event with pre/post snapshot for
                    30-day post-mortem
```

### Constraints (locked)

- **5-10 articles/day MAX** — anti-spam-signal cap. Cron runs once daily, processes 5.
- **Never change `date_published`** — that's E-E-A-T longevity. Only `date_modified` + `last_reviewed` move.
- **URL slugs never change** — preserve backlink equity. The article-update flow updates content only.
- **Year sanitization scope** — only year-tagged keyword tokens in titles/H1/meta (e.g. "Guide 2025" → "Guide 2026"). Historical references in body ("GPT-4 launched in 2023") stay.
- **Style + voice preservation** — input the existing article body to Claude as a style reference. Output must match. `tone-of-voice` + `anti-ai-isms` skills run as a post-gen pass.
- **Internal-link discipline** — max 8 internal links per article. Anchor text varies; never link the same target twice with the same anchor.

### What this workflow does NOT do

- Doesn't create new blog posts (separate workflow when ready)
- Doesn't auto-publish without human approval
- Doesn't touch articles flagged as `status: archived` or `status: deprecated`
- Doesn't run during the WP-to-MDX migration window (Phase D) — only after Phase E cutover

---

## 8. WordPress migration plan (Phase D, weeks 8-12)

Goal: 1,001 WordPress posts → MDX files in `src/content/blog/`, with full metadata preservation, no SEO regression.

### Step 1 — Extract (week 8)

Script: `scripts/migrate/wp-extract.ts`

For each post in WordPress (via WP REST API at `/blog/wp-json/wp/v2/posts?per_page=100&page=N`):

1. Fetch full post (body HTML, title, excerpt, dates, author, categories, tags, featured image)
2. Fetch Yoast meta via the post's `yoast_head_json` field (title, description, canonical, schema graph)
3. Fetch featured image binary, upload to MinIO (via existing pipeline)
4. Replace inline `/wp-content/uploads/...` URLs in body with MinIO URLs
5. Save raw extracted JSON to `migration/raw/<wp_id>.json` for traceability

Acceptance: 1,001 raw JSON files in `migration/raw/`, no fetch errors, all images downloaded.

### Step 2 — Transform (week 9)

Script: `scripts/migrate/wp-transform.ts`

For each raw JSON:

1. Convert body HTML → Markdown using `unified` + `rehype-remark`
2. Detect + preserve code blocks, tables, lists, embeds
3. Build frontmatter object from Yoast + WP metadata (see section 5 contract)
4. Slugify filename: `src/content/blog/<wp-slug>.mdx`
5. Verify: title, slug, dates, category, body all populated

Critical: `date_modified` from Yoast schema graph → frontmatter `date_modified`. Same for `date_published`. NOT migration date.

Acceptance: 1,001 `.mdx` files in `src/content/blog/`, all validate against the frontmatter contract, no validation errors.

### Step 3 — Stage (week 10)

1. Commit all MDX files to a `migration/wp-import` branch
2. Build + deploy to `staging.godofprompt.ai`
3. Run parity matrix against staging:
   - Every `/blog/<slug>` returns 200
   - Every `<title>` matches the WP `<title>`
   - Every canonical points to the right URL
   - Every JSON-LD Article schema includes same `datePublished` + `dateModified` as WP
4. Generate a diff report: `migration/parity-report.html` showing any URLs where staging differs from prod

Acceptance: zero URLs return 4xx/5xx, ≤1% have meta drift (and those are reviewed manually).

### Step 4 — Image parity (week 10)

Side-by-side check that every image URL in every post resolves:
1. Parse all `<img>` src URLs from all 1,001 MDX bodies
2. HEAD request each → must return 200 with `content-type: image/*`
3. Failed URLs go into `migration/broken-images.csv` for manual review

Acceptance: ≥99.5% of images load. Manual fix for the long tail.

### Step 5 — Schema parity (week 11)

Script: `scripts/migrate/schema-diff.ts`

For 50 sampled URLs:
1. Fetch WordPress version → extract all JSON-LD blocks
2. Fetch staging Next.js version → extract all JSON-LD blocks
3. Diff field-by-field
4. Output `migration/schema-diff.html` showing missing fields

Acceptance: every required schema field present (see section 6). Optional fields allowed to differ.

### Step 6 — Author + category + tag scaffold (week 11)

- Create `src/content/authors/<slug>.mdx` for each unique author in WP (mostly Robert + a few editors)
- Confirm 9 pillar categories cover every post → if any post has an unmapped category, manually reassign
- Tags carry forward (noindex'd in robots — they're navigation, not ranking pages)

### Step 7 — Approval gate (week 12)

Manual review window:
- Spot-check 30 random posts on staging vs prod
- Verify CWV improvements on 10 high-traffic posts (Lighthouse before/after)
- Submit staging URLs to GSC URL Inspection on 5 high-traffic posts → should index cleanly

Acceptance: human sign-off on migration completeness.

### Step 8 — Hand off to Phase E (cutover)

Migration branch ready to merge. Phase E begins.

---

## 9. Cutover protocol (Phase E, weeks 12-14)

### Pre-cutover checklist

- [ ] All 1,001 MDX posts validated + on `staging.godofprompt.ai`
- [ ] Image parity ≥99.5% confirmed
- [ ] Schema parity report reviewed
- [ ] CWV improvements verified on top 20 posts
- [ ] Caddy config tested: routing `/blog/*` to either WP or Next, switchable
- [ ] Rollback plan documented (one-command CF DNS revert)

### Cutover day

1. **00:00 UTC** — Caddy reload: `/blog/*` now routes to Next.js
2. **00:05 UTC** — Verification curl matrix runs (1,001 URLs)
3. **00:15 UTC** — IndexNow ping with all 1,001 URLs
4. **00:30 UTC** — GSC bulk URL Inspection on top 50 posts
5. **Day 1-7** — Monitor GSC impressions daily, alert if regression >10%
6. **Day 7-14** — Parallel run: WP container stays alive, Caddy can route back in <1 min if needed

### 30-day WP shadow (post-cutover)

- WP container stays running, not publicly routed
- Final database snapshot taken on cutover day + stored in cold archive (MinIO)
- After 30 days clean: WP container destroyed, Hetzner resources reclaimed (Phase F)

### Rollback procedure

If cutover causes >10% impression regression in first 7 days:

1. Caddy reload: route `/blog/*` back to WordPress
2. CF cache purge `/blog/*`
3. Post-mortem within 24h
4. Fix → re-stage → re-attempt cutover after 2 weeks

---

## 10. Test gates per phase

### Phase A — Non-blog parity

- [ ] All routes pass parity matrix (see section 4 rule 0)
- [ ] Mobile Lighthouse Perf ≥80 on `/`, `/prompt-library`, `/complete-ai-bundle`
- [ ] No route ships `noindex` unintentionally — explicit robots meta on every route
- [ ] `sitemap.xml` emits ≤300 URLs (NOT 7K)
- [ ] `robots.txt` allows all bots
- [ ] `llms.txt` served as `text/plain`
- [ ] CWV "Needs improvement" 53 URLs in GSC drops to <10 within 28 days post-deploy

### Phase B — MDX blog scaffold

- [ ] 5 sample posts render with correct schema (validated via Google Rich Results Test)
- [ ] RSS feed validates (W3C feed validator)
- [ ] Blog sitemap merged into main sitemap_index

### Phase C — Article update workflow

- [ ] 5 posts updated via the workflow, diffs reviewed, merged, deployed
- [ ] `date_modified` updates correctly in schema.org output
- [ ] No keyword stuffing introduced (manual review of 5 outputs)
- [ ] Internal links to /prompt-library + /products all resolve 200

### Phase D — Migration

- [ ] 1,001 MDX files validate
- [ ] Image parity ≥99.5%
- [ ] Schema parity report reviewed
- [ ] Staging Lighthouse ≥80 on top 20 posts

### Phase E — Cutover

- [ ] Parity matrix passes at 0:05 UTC
- [ ] 7-day impression delta <10% regression
- [ ] No top-30 blog post drops out of GSC top-3 page-1 position

### Phase F — Decommission

- [ ] 30 days since cutover, no regressions
- [ ] WP database snapshot archived
- [ ] WP container destroyed, Hetzner resources reclaimed

---

## 11. Open questions

Resolve before phase starts. Don't block on these now.

| # | Question | Blocks phase | Default if unresolved |
|---|---|---|---|
| 1 | Postgres for backend — same as Directus's repurposed DB or new? | A | Use Directus prod DB (most data already there) |
| 2 | Author admin UI — git-as-CMS forever or build admin UI later? | B | Git-as-CMS for first 100 posts post-migration |
| 3 | Search inside blog — Postgres FTS or Algolia? | B (low priority) | Postgres FTS; revisit at 5K posts |
| 4 | Tag pages — index or noindex? | D | noindex (tags are navigation, not ranking pages) |
| 5 | RSS feed — full body or excerpt only? | B | Excerpt + first 500 chars + canonical link |
| 6 | Comments — none, Disqus, or rolled? | B (low priority) | None (current site has none) |
| 7 | Article-update cadence — daily 5/day or weekly batch? | C | Daily 5/day cron weekday mornings |
| 8 | Telegram approval — who can /approve? | C | Robert only initially; extend later |
| 9 | Image CDN — MinIO direct, CF transform, Next Image proxy? | D | Next Image proxy (caches on Hetzner, serves WebP/AVIF) |
| 10 | Where does `gop-web` deploy — Hetzner Docker (per INFRASTRUCTURE.md) or Vercel? | post-A | Hetzner Docker; Vercel only if Hetzner pain emerges |

---

## Appendix A — File locations (cheat sheet)

```
gop-web/                                      ← this repo
├── src/
│   ├── app/                                  ← App Router routes
│   ├── components/
│   ├── content/
│   │   ├── blog/                             ← MDX posts (1,001 after migration)
│   │   └── authors/                          ← Author profiles
│   └── lib/
│       ├── api/                              ← Backend API client (Rule 3)
│       └── seo/                              ← generateMetadata helpers, schema builders
├── public/
│   ├── llms.txt                              ← copied from gop-seo/dist/llms.txt
│   └── robots.txt                            ← generated, NOT static
├── scripts/
│   ├── migrate/
│   │   ├── wp-extract.ts                     ← Phase D step 1
│   │   ├── wp-transform.ts                   ← Phase D step 2
│   │   └── schema-diff.ts                    ← Phase D step 5
│   ├── parity-check.ts                       ← rule 0 check (CI)
│   └── validate-mdx.ts                       ← MDX frontmatter validator (CI)
├── project-docs/
│   ├── ARCHITECTURE.md                       ← system overview
│   ├── DECISIONS.md                          ← ADRs
│   ├── INFRASTRUCTURE.md                     ← deploy + envs
│   └── BUILD-PLAN.md                         ← THIS FILE
└── ...

gop-seo/                                      ← sibling repo, content source-of-truth
├── dist/
│   ├── llms.txt                              ← copy to gop-web/public/
│   ├── ga4-pre-disruption-urls.csv           ← parity matrix input
│   ├── recovery-redirect-map-v2-RENAME.csv   ← redirect rule input
│   ├── combo-seo-bodies.json                 ← combo page bodies (1,651)
│   ├── category-seo-text-polished.json       ← category bodies
│   ├── sub-seo-bodies.json                   ← subcategory bodies
│   ├── tool-seo-bodies.json                  ← tool bodies
│   ├── prompt-library-hub-seo.json           ← hub page content
│   └── homepage-faqs.json                    ← homepage FAQ
└── docs/
    └── PR-article-update-system.md           ← detailed n8n workflow spec
```

---

## Appendix B — Skills the building agent should load

When working on this repo, an agent should compose these skills (from `~/.claude/skills/`):

| Skill | When |
|---|---|
| `gop-web-temp` | Reference patterns from the existing React app to migrate |
| `gop-seo` | All content sources + SEO strategy |
| `gop-stripe` | Stripe checkout integration |
| `fast-ui` | shadcn/ui patterns |
| `tone-of-voice` + `anti-ai-isms` | Any text-producing work (article updates, copy) |
| `gop-copy` | The God of Prompt voice corpus |
| `schema-markup` | Schema.org JSON-LD generation |
| `seo-audit` | After deploy, audit for regressions |
| `seo-google` | GSC + GA4 + PageSpeed data (when scope re-auth'd) |
| `seo-dataforseo` | DataForSEO for SERP analysis in article-update workflow |

---

## Appendix C — The "if you are about to" red-flag list

These specifically caused the April 17 cliff. Don't repeat them.

- **About to ship a route without `generateMetadata()`?** → STOP. No route ships without explicit title, description, canonical, robots.
- **About to make a filter chip a `<button>`?** → STOP. It must be `<Link>` with optional `preventDefault`. See section 3.
- **About to add `noindex` to a route "temporarily"?** → STOP. Use `staging.godofprompt.ai` for unfinished work, not `noindex` on prod routes.
- **About to delete a URL pattern?** → STOP. First check `gop-seo/dist/ga4-pre-disruption-urls.csv` — if the URL had traffic, write a 301 first.
- **About to rename a URL?** → STOP. Same as above. URL changes are an active deindexation event unless 301'd correctly.
- **About to inline-fetch from a Server Component without ISR?** → STOP. Use `fetch(url, { next: { revalidate: 60 } })` or static. Per-request fetches kill LCP.
- **About to migrate WP posts in a big-bang push?** → STOP. Read section 8. Parallel run for 14 days. Rollback plan required.
- **About to add a runtime dependency**? → STOP. Read ADR-002 + ADR-003 + ARCHITECTURE.md's "If You Are About To" section. Justify in DECISIONS.md before adding.

---

**End of build plan.**

This document is the agent's contract. Every PR is checked against the SEO invariants (section 3) and URL parity rules (section 4). Phase sequence (section 2) is not a suggestion — phases ship in order. Migration plan (section 8) is the only path WP gets removed without breaking the blog's ranking.

When this document needs updating, open an ADR in `DECISIONS.md`, link to it from here, and bump the section. Do not silently amend.
