# PLB agent brief — SEO copy + FAQ for every library page

**For:** plb-agent (GOP / Prompt_Library)
**From:** gop-web session, 2026-07-28
**Status:** ready to start — the fields already exist and are empty

---

## The job in one line

Populate per-record SEO copy and an FAQ for every facet the prompt library
mints a page for, so each page carries its own words instead of a template
with one noun swapped.

## What already exists (verified live, don't rebuild it)

`GET /api/library/categories` returns **100 records**, each already carrying:

| Field | Populated |
|---|---|
| `metaTitle` | **0 / 100** |
| `metaDescription` | **0 / 100** |
| `seoBodyHtml` | **0 / 100** |
| `ogImageUrl` | 0 / 100 |
| `canonicalUrl` | 0 / 100 |
| `seoStatus` | 100 / 100 — all `"pending"` |

So the model is right and the workflow field (`seoStatus`) is already there.
The content is simply missing. `pending → ready` is the obvious signal for the
frontend to prefer the CMS copy over its generated fallback.

## What the frontend does today (the fallback you're replacing)

`src/lib/seo/pseo.ts` generates 6 sections per page — What / Why / How / tool
fit / free / adapt — plus a Related row. They render as real `<h2>`s under the
prompt grid. It is on-brand and grammatical, but **every page in a family says
the same thing with one noun swapped**, which is the templated-body pattern
Google discounts.

Rule for the frontend once you ship copy: **CMS wins, generated is fallback.**
An untouched record still reads well; an edited one replaces it. Nothing goes
blank.

## Scope — what needs copy

| Facet | Records | Page route | Fields exist? |
|---|---|---|---|
| Categories | **100** (only 18 minted today — see gap below) | `/prompt-library/category/[slug]` | ✅ yes, empty |
| Output types | 4 with prompts: text 5,654 · image 743 · **code 236** · presentation 1 | `/prompt-library/type/[type]` | ❌ **needs adding** |
| Audiences | 25 | `/prompt-library/for/[audience]` | ❌ **needs adding** |
| Tools | 50 | `/prompt-library/tool/[slug]` | ⚠ fields exist, all null |

**Extra fields needed** (the ask): give output types and audiences the same
SEO block categories already have — `metaTitle`, `metaDescription`,
`seoBodyHtml`, `seoStatus`. Plus, on all four:

```
faq: [{ question: string, answerHtml: string }]
```

FAQ on every page was explicitly requested. It also earns FAQPage schema, which
the frontend can emit once the data is real (today there is none, deliberately —
we do not ship schema for content that does not exist).

## Two gaps to fix alongside

1. **82 categories are not minted.** The API has 100; the frontend builds its
   list from a stale local `categories.json` with 18 roots. The unminted ones
   are the subcategories — `a-b-testing`, `ad-copy`, `ai-agents`,
   `app-development`, `blog-posts-and-articles`… Frontend must read the live
   endpoint. Do NOT mint all 82 blindly — see the thin-page note below.

2. **`/type/code` does not exist** despite 236 prompts — bigger than several
   category pages that do. The frontend's `TYPES` map is hardcoded to
   text+image; it should derive from `/api/dev/catalog/output-type` filtered by
   real count, so `code` appears now and `video`/`audio` appear the day they
   have prompts, with no deploy.

## Thin-page warning — read before expanding

Live examples today: `/category/writing/for/virtual-assistants` = **3 prompts**,
`/category/customer-service/for/designers` = **4**. Combos are 801 of the 896
current pSEO pages, so expansion multiplies fast.

Minting 82 categories × 25 audiences without a floor manufactures thin pages at
scale. gop-web tracks this as task #54 (substance gate). **Copy quality and the
substance gate should land together** — good words on a 3-prompt page still
lose.

Suggested floor: 24 prompts (one full grid page), matching the threshold
already used for the homepage tool chips.

## Priority

1. The 18 live category pages — real traffic today
2. Output types (incl. adding fields + `code`)
3. The 25 audiences
4. The 50 tools
5. The 82 unminted categories, gated on substance

## Voice

Compose `gop-copy` (GOP voice) + `anti-ai-isms`. House rules that already bit us:
- **No fabricated numbers.** Real prompt count or no number. "30,000+" is wrong
  (real corpus is 6,634) and had to be stripped from CMS product copy already.
- **No premium/paywall language.** There is no paywall; `isPremium` gates
  nothing.
- Name the models people search for (ChatGPT, Claude, Gemini, Grok, Midjourney)
  and the jobs the prompts do (briefs, copy, analysis, reporting, outreach).
