# Programmatic Pages — SEO spec (category / subcategory / tool / type / combo)

> The money architecture. ~1,900 data-generated URLs that target thousands of long-tail buyer queries. Get this flawless and you rank for "chatgpt prompts for marketing", "midjourney prompts for architecture", etc. at scale. Get it wrong and you get index bloat + the 7,022-page canonical deindex that just happened on gop-web-temp.
>
> Read `BUILD-PLAN.md` sections 3 (SEO invariants) + 4 (URL parity) first. This doc is the deep-dive on the 5 programmatic page types.

---

## 0. The five page types

| # | Type | URL pattern | Count | Data source (in `gop-seo/dist/`) |
|---|---|---|---|---|
| 1 | Root category | `/prompt-library/category/[slug]` | 19 | `category-seo-text-polished.json` |
| 2 | Subcategory | `/prompt-library/category/[cat]/sub/[slug]` | 180 | `sub-seo-bodies.json` |
| 3 | Tool | `/prompt-library/tool/[slug]` | 7 | `tool-seo-bodies.json` |
| 4 | Type | `/prompt-library/type/[slug]` | 4 (2 live) | API + hub JSON |
| 5 | **Combo (compounding)** | `/prompt-library/tool/[t]/category/[c]` etc. | 1,651 | `combo-seo-bodies.json` |

Types 1-4 are **indexed, self-canonical, ranking pages**. Type 5 (combo) has a **strategic index decision** — see section 6. Don't guess it; it's flagged.

---

## 1. The non-negotiables (ALL five types)

Every one of these pages MUST, with NO exceptions:

### a. Self-referencing absolute canonical
```ts
alternates: { canonical: `https://godofprompt.ai/prompt-library/category/${slug}` }
```
This is the exact bug that deindexed 7,022 pages on gop-web-temp — a shared shell hardcoded `canonical → homepage`. In Next.js App Router this CANNOT happen because each route emits its own `generateMetadata()`. **Verify it per route anyway.** No page inherits a parent's canonical.

### b. Server-rendered content in the HTML
The category/tool/combo body, the H1, the prompt cards, the internal links — all present in the HTML on first byte, NOT hydrated client-side. Use Server Components + `fetch(url, { next: { revalidate: N }})`. Crawlers (Ahrefs, GPTBot, Googlebot first-pass) do not run JS. If the content isn't in the raw HTML, it doesn't exist to them.

### c. Unique title + description + H1 per page
Pulled from the data file, never templated-generic. The gop-web-temp failure was `"Category | God of Prompt"` on all 19 category pages — identical, useless. Each page's metadata comes from its data entry:
```ts
// from category-seo-text-polished.json entry
title:       `${categoryName} AI Prompts (${count}+ Prompts) | God of Prompt`
description: entry.seo_description   // unique per category
h1:          `${count} AI Prompts for ${categoryName}`   // e.g. "712 AI Prompts for Marketing"
```

### d. Exactly one `<h1>`, correct heading hierarchy
One H1 with the primary keyword. H2s for sections. No skipped levels.

### e. Schema.org (server-rendered JSON-LD)
Every page emits at minimum:
- `CollectionPage` (it's a collection of prompts)
- `BreadcrumbList` (Home → Prompt Library → [Category/Tool/Type] → [sub if combo])
- `ItemList` (the prompts shown, OR the child links — positions synced to DOM order)

### f. Internal links as real `<a href>` (the `<FilterChipGrid>` pattern)
Every filter chip, cross-axis link, pagination control = `<Link>` (renders `<a href>`), NEVER `<button>`. See section 7.

### g. Images with dimensions
Prompt-card thumbnails MUST have `width`+`height` (or use `<Image>`). gop-web-temp shipped 111/118 category-grid images with no dimensions = mobile CLS bomb. Forbidden here.

### h. ISR revalidation
```ts
export const revalidate = 300;  // categories/tools change rarely; 5 min is fine
```

---

## 2. Root category pages (`/prompt-library/category/[slug]`)

19 pages. The strongest programmatic ranking pages on the site — they target "[category] AI prompts" head terms (e.g. "marketing AI prompts" ~15K/mo).

### generateStaticParams
```ts
export async function generateStaticParams() {
  const cats = await getCategories();   // 19 root categories
  return cats.map(c => ({ slug: c.slug }));
}
```

### Metadata (from `category-seo-text-polished.json`)
```ts
export async function generateMetadata({ params }) {
  const cat = await getCategory(params.slug);
  if (!cat) return {};  // route will notFound()
  return {
    title: `${cat.name} AI Prompts — ${cat.promptCount}+ Prompts for ChatGPT, Claude & More | God of Prompt`,
    description: cat.seo_description,   // UNIQUE per category, from the JSON
    alternates: { canonical: `https://godofprompt.ai/prompt-library/category/${cat.slug}` },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: { title: ..., description: cat.seo_description, url: ..., type: 'website',
                 images: [{ url: cat.og_image ?? '/og-prompt-library.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', ... },
  };
}
```

### Page structure (top → bottom)
1. **H1** — `${cat.promptCount} AI Prompts for ${cat.name}` (e.g. "712 AI Prompts for Marketing")
2. **Lede** — one-sentence intro
3. **Prompt grid** — the actual prompt cards (server-rendered, paginated — section 8)
4. **SEO body** — `cat.html` from `category-seo-text-polished.json` (the polished long-form copy, ~300-500 words, unique per category)
5. **"Refine by tool" chip strip** — 7 `<Link>`s → combo URLs (section 7)
6. **"Refine by type" chip strip** — 2 live `<Link>`s → combo URLs
7. **"Browse subcategories" chip strip** — child subcategories of this category
8. **Related blog posts** — `category-related-blogs.json` gives 3-5 per category
9. **FAQ** (if present in data) — plain HTML, NO FAQPage schema

### Schema
- CollectionPage (name = category, description = seo_description)
- BreadcrumbList (Home → Prompt Library → Marketing)
- ItemList (the prompts in the grid, position-synced)

---

## 3. Subcategory pages (`/prompt-library/category/[cat]/sub/[slug]`)

180 pages. From `sub-seo-bodies.json` (keys: slug, name, parent, parent_slug, excerpt, html).

Same structure as root category, plus:
- **Breadcrumb has 4 levels**: Home → Prompt Library → [Parent Category] → [Subcategory]
- **H1**: `${name} Prompts` (e.g. "Social Media Marketing Prompts")
- **Body**: `sub.html` (unique per subcategory)
- **Parent link**: prominent link back up to the root category
- **Refine chips**: 7 tools + 2 types (generating subcat × tool combos)

Canonical: self (`/prompt-library/category/${parent_slug}/sub/${slug}`).

---

## 4. Tool pages (`/prompt-library/tool/[slug]`)

7 pages (chatgpt, claude, gemini, grok, deepseek, midjourney, nano-banana). From `tool-seo-bodies.json` (keys: brand, slug, name, excerpt, html).

These target "[tool] prompts" head terms — "ChatGPT prompts" is ~110K/mo, the biggest buyer query in your space.

### Critical fix from gop-web-temp
The live tool pages had:
- title `"ChatGPT | God of Prompt"` ← one word, no keyword → **must be** `"5,791 ChatGPT Prompts — Engineered for GPT-5 | God of Prompt"`
- only 1 H2 across 4,116 words → **must** break into 5-8 H2 sections
- generic fallback meta → **must** use `tool.excerpt`

### Page structure
1. **H1** — `${tool.promptCount} AI Prompts for ${tool.name}` (e.g. "5,791 AI Prompts for ChatGPT")
2. **Lede + "Optimized for" model strip** — model variant chips (GPT-5, GPT-4o, o1) as filter chips (in-page filter, not new URLs — see model-variant decision in the taxonomy doc)
3. **Prompt grid** (paginated)
4. **SEO body** — `tool.html`, broken into proper H2 sections
5. **"Which model should I use?" H2** — captures "[model] vs [model]" long-tail
6. **"Browse by category" chip strip** — 19 `<Link>`s → combo URLs (`/tool/X/category/Y`)
7. **"Browse by type" chip strip** — 2 `<Link>`s
8. **Related blog posts** — `tool-related-blogs.json`
9. **FAQ** (plain HTML)

### Schema
- CollectionPage, BreadcrumbList, ItemList
- Optionally `SoftwareApplication` reference to the tool itself (name, applicationCategory)

---

## 5. Type pages (`/prompt-library/type/[slug]`)

4 types: `text`, `image` (LIVE) + `code`, `search` (coming soon). Plus the taxonomy may add `video`, `audio`, `agent`, `system-prompt` — see TAXONOMY-LOCK.

- **LIVE types** (text, image): full ranking page, index, self-canonical, same structure as category.
- **Coming-soon types** (code, search): render a "coming soon" state, set `robots: { index: false }` until populated, OR don't generate the route at all until ≥30 prompts exist. **Do not ship thin/empty type pages as indexable.**

H1: `${typeName} Prompts` (e.g. "Image Prompts", "Text Prompts").
Cross-axis chips: 19 categories + 7 tools.

---

## 6. ⚠️ COMBO PAGES — the compounding multiplier + the index decision

1,651 pages. URL patterns:
```
/prompt-library/tool/[t]/category/[c]       e.g. /tool/chatgpt/category/solopreneurs
/prompt-library/category/[c]/type/[t]       e.g. /category/marketing/type/text
/prompt-library/tool/[t]/type/[ty]
/prompt-library/category/[c]/sub/[s]/tool/[t]
```

Data in `combo-seo-bodies.json` (1,651 entries, each: title, description, h1, html, canonical, robots, axes).

### 🚩 The strategic decision baked into the current data — CONFIRM BEFORE BUILDING

The combo data currently ships:
```json
{
  "title": "ChatGPT Prompts for Solopreneurs | God of Prompt",
  "h1": "ChatGPT Prompts for Solopreneurs",
  "canonical": "https://godofprompt.ai/prompt-library/category/solopreneurs",  ← points to CATEGORY, not self
  "robots": "noindex, follow",                                                  ← NOINDEX
  "axes": { "tool": "chatgpt", "category": "solopreneurs", "kind": "tool-cat" }
}
```

**This means the current strategy is:** combos are crawl-path + internal-link surfaces that consolidate equity to the parent category, but are NOT indexed themselves. This is the **index-bloat-safe** approach — 1,651 pages that pass link juice without competing for index slots or risking "Crawled, not indexed" thin-content penalties.

**Two valid strategies — the SEO lead must pick:**

| | Strategy A — current data (noindex, canonical→category) | Strategy B — index them (self-canonical, index) |
|---|---|---|
| Robots | `noindex, follow` | `index, follow` |
| Canonical | → parent category | → self |
| Targets | nothing directly; passes equity to category | each combo ranks for its own long-tail ("chatgpt prompts for solopreneurs") |
| Index slots used | 0 | 1,651 |
| Thin-content risk | none | HIGH unless each body is genuinely unique + 300+ words |
| Upside | safe, consolidates authority | captures 1,651 long-tail buyer queries directly |
| Best when | bodies are templated/thin | bodies are rich + distinct |

**My read:** the combo bodies in `combo-seo-bodies.json` ARE unique (1,651 distinct HTML blocks), so Strategy B is *viable* — BUT only if each body delivers real, distinct value (unique prompt examples, category-specific guidance), not just "[tool] prompts for [category]" boilerplate with the nouns swapped. If they're boilerplate, Strategy A is correct and Strategy B would trigger index bloat.

**Action for the dev:** build the combo route to read `robots` + `canonical` FROM the data file (don't hardcode). That way the SEO lead flips the strategy by regenerating the JSON, not by changing code. The route honors whatever the data says.

```ts
export async function generateMetadata({ params }) {
  const combo = await getCombo(params);   // looks up combo-seo-bodies.json by path
  if (!combo) return {};
  return {
    title: combo.title,
    description: combo.description,
    alternates: { canonical: combo.canonical },          // from data — category OR self
    robots: parseRobots(combo.robots),                    // from data — noindex OR index
  };
}
```

### Combo URL canonicalization (CRITICAL — prevents duplicate URLs)

`/tool/chatgpt/category/marketing` and `/category/marketing/tool/chatgpt` are the SAME combo. You must NOT let both exist as separate indexable URLs. Enforce ONE canonical ordering:

- **Canonical ordering:** `tool` before `category` before `type` (matches the data file keys: `/prompt-library/tool/[t]/category/[c]`).
- If a request comes in for the reverse ordering (`/category/[c]/tool/[t]`), **301 it** to the canonical ordering, OR only ever emit links in the canonical ordering so the reverse never gets crawled.
- The `<FilterChipGrid>` `buildComboUrl()` helper MUST always produce the canonical ordering. One helper, used by chips + sitemap + the /all page, so they can never drift.

### Combo page structure (if indexed — Strategy B)
1. H1 from `combo.h1`
2. Prompt grid (filtered to tool×category)
3. `combo.html` body (the unique 300+ word block)
4. Sibling combo chips ("Claude prompts for solopreneurs", "ChatGPT prompts for marketing") — 6 links, the PageRank-flow multiplier
5. Link up to both parent axes (the category page + the tool page)
6. BreadcrumbList + CollectionPage + ItemList schema

---

## 7. Internal linking — the `<FilterChipGrid>` component

One reusable Server Component, parametric over the live axis data. Full spec in `gop-seo/docs/PR-combo-internal-linking.md`. Summary:

- Reads the current route's locked axes (e.g. on `/category/marketing`, category is locked)
- Takes a `targetAxis` prop (`tool` | `category` | `type` | `subcategory`)
- Fetches the live list for that axis
- Emits one `<Link>` per value → `buildComboUrl(lockedAxes, targetAxis, value)` in CANONICAL ordering
- Optional `onClick` for in-place filtering (preventDefault) — but the `href` is always real

This is what exposes the 1,651 combos as crawlable links. Without it, combos are orphan pages (Ahrefs already flags 29x orphans). With it, every combo is reachable from its parent category AND parent tool page.

**Placement matrix:**
| Route | Render FilterChipGrid for axes |
|---|---|
| `/category/[c]` | tool, type, subcategory |
| `/category/[c]/sub/[s]` | tool, type |
| `/tool/[t]` | category, type |
| `/type/[ty]` | category, tool |
| `/tool/[t]/category/[c]` | type (+ sibling tools, sibling categories) |

---

## 8. Pagination (categories/tools with many prompts)

A category with 712 prompts can't render all 712 in one page (DOM weight + LCP). Pattern:

- Show first ~24 prompts server-rendered
- Paginate with real URLs: `/prompt-library/category/marketing?page=2` OR `/prompt-library/category/marketing/page/2`
- **Use `rel="next"` / `rel="prev"`** OR self-canonical each page to itself (Google deprecated rel=next/prev as an indexing signal but it still helps crawl)
- Page 2+ canonicals: self-referencing (NOT canonical-to-page-1 — that hides the deeper prompts)
- "Load more" buttons are fine for UX BUT must have a real paginated `<a href>` fallback for crawlers (progressive enhancement)
- Set `robots: index,follow` on page 1; consider `noindex,follow` on deep pages (page 5+) if they're thin

Decision for SEO lead: index paginated pages or canonical them to page 1? Default: self-canonical page 1, `noindex,follow` pages 2+. Keeps the category page as the ranking entity, lets crawlers reach deep prompts.

---

## 9. Sitemap — only index-worthy URLs

The sitemap (`/sitemap.xml`) must include ONLY pages you want indexed:
- ✅ 19 categories + 180 subcategories + 7 tools + 2 live types
- ✅ Individual prompt pages (`/prompts/[slug]`) — IF they're rich enough; thin ones excluded
- ✅ Combos ONLY if Strategy B (indexed). If Strategy A (noindex), combos go in a SEPARATE `sitemap-combos.xml` that is built but NOT submitted (crawl-discovery only) OR omitted entirely.
- ❌ Never: noindex pages, coming-soon type pages, paginated deep pages

A `noindex` page in the sitemap = the exact Ahrefs error ("Non-canonical page in sitemap" = 7,022). The sitemap and the robots directive must agree: if it's in the sitemap, it's `index, follow`, self-canonical. Period.

Generate the sitemap parametrically from the same axis data + the same `buildComboUrl()` helper, so it can never list a URL the chips don't emit.

---

## 10. notFound() — no soft-404s, ever

Every dynamic route MUST call `notFound()` when the slug doesn't resolve:
```ts
const cat = await getCategory(params.slug);
if (!cat) notFound();   // returns real 404, NOT homepage shell
```
gop-web-temp had 57 soft-404s (200 status serving homepage HTML). In Next this is prevented by `notFound()` — but only if the dev calls it. Make it a code-review checklist item.

---

## 11. Acceptance criteria (run on staging before merge)

```bash
BASE=https://staging.godofprompt.ai

# Every category self-canonicals (NOT homepage — the 7,022 bug)
for c in marketing productivity education solopreneurs finance; do
  canon=$(curl -s "$BASE/prompt-library/category/$c" | grep -oE 'rel="canonical" href="[^"]*"')
  echo "$c → $canon"   # must end in /category/$c, NEVER bare homepage
done

# Unique titles (no "Category | God of Prompt" duplication)
for c in marketing sales seo; do
  curl -s "$BASE/prompt-library/category/$c" | grep -oE '<title>[^<]*</title>'
done   # must each differ + contain the category name + a keyword

# One H1 per page
curl -s "$BASE/prompt-library/category/marketing" | grep -c '<h1'   # → 1

# Cross-axis combo links present (the internal-linking multiplier)
curl -s "$BASE/prompt-library/category/marketing" \
  | grep -oE 'href="/prompt-library/tool/[a-z-]+/category/marketing"' | sort -u | wc -l   # → 7

# Combo canonical + robots come from data (verify Strategy A or B as configured)
curl -s "$BASE/prompt-library/tool/chatgpt/category/solopreneurs" \
  | grep -oE 'rel="canonical" href="[^"]*"|name="robots" content="[^"]*"'

# No soft-404 — bogus slug returns real 404
curl -s -o /dev/null -w "%{http_code}" "$BASE/prompt-library/category/this-does-not-exist"   # → 404

# Sitemap contains no noindex URLs
# (cross-check sitemap URLs against their robots meta — none should be noindex)

# Schema present on every type
for u in category/marketing tool/chatgpt type/text; do
  echo "$u: $(curl -s "$BASE/prompt-library/$u" | grep -c 'application/ld+json') schema blocks"   # → ≥2
done
```

---

## 12. The compounding logic — why this matters (for the dev's mental model)

The "compounding" effect the founder mentioned:

```
1 hub page                                     → ranks for "ai prompt library"
  ├─ 19 category pages                          → rank for "[category] ai prompts"  (19 head terms)
  │    └─ 180 subcategory pages                 → rank for "[subcat] prompts"        (180 mid-tail)
  ├─ 7 tool pages                               → rank for "[tool] prompts"          (7 huge head terms)
  └─ 1,651 combo pages (IF indexed)             → rank for "[tool] prompts for [cat]" (1,651 long-tail buyer queries)
```

Each layer links to the layer below AND across. A user (or crawler) landing on `/category/marketing` can reach `marketing × chatgpt`, `marketing × claude`, every subcategory, and back up to the hub. PageRank flows down and across. The combos, if indexed, are 1,651 separate doorways for "chatgpt prompts for [specific job]" — the exact buyer queries that convert.

That's the compounding: **one data model → ~1,900 ranking pages → thousands of long-tail queries → all interlinked → authority concentrates and flows.** It only works if (a) every page self-canonicals correctly, (b) every page has unique server-rendered content, (c) the cross-links are real `<a href>`, (d) thin pages are noindex'd not indexed. Miss any of the four and it collapses into index bloat — which is what the noindex,follow combo strategy is hedging against.

---

## TL;DR for the dev

1. **Every programmatic page self-canonicals** (absolute URL). The shared-shell-homepage-canonical bug is impossible in Next App Router IF each route has its own `generateMetadata()` — verify per route.
2. **Server-render the content** — RSC + ISR, content in raw HTML, crawlers don't run JS.
3. **Unique title/desc/H1 per page** from the data files, never generic templates.
4. **Read `robots` + `canonical` from the combo data** — don't hardcode. The SEO lead controls index strategy via the JSON.
5. **One canonical URL ordering for combos** (`tool` → `category` → `type`). Reverse ordering 301s or is never linked.
6. **`<FilterChipGrid>` everywhere** — cross-axis links as real anchors. This is what makes combos reachable (kills the orphan-page errors).
7. **`notFound()` on missing slugs** — no soft-404s.
8. **Sitemap = only index,follow self-canonical pages.** If it's noindex, it's not in the submitted sitemap.
9. **Decision needed from SEO lead:** combos indexed (Strategy B) or noindex-consolidate (Strategy A)? Current data says A. Build to honor either via the data.

Source data: `gop-seo/dist/{category-seo-text-polished,sub-seo-bodies,tool-seo-bodies,combo-seo-bodies}.json`. Component spec: `gop-seo/docs/PR-combo-internal-linking.md`.
