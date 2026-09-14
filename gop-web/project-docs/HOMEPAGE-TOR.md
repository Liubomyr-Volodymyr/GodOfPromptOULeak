# Homepage Rebuild — Terms of Reference (Next.js)

> The homepage is the #1 ranked, #1 trafficked page on the site (6.29K clicks, +375% in the latest GSC pull — recovering hard from the April-17 disruption). This ToR governs rebuilding it in Next.js 16 (App Router) inside `gop-web`. **Prime directive: improve without losing what already ranks.** Every change is measured against the current baseline; nothing that regresses rankings ships.
>
> Read alongside: `BUILD-PLAN.md` (§3 SEO invariants, §4 URL parity), `PROGRAMMATIC-PAGES-SEO.md`. This doc is homepage-specific.

---

## 1. Objective & success metrics

**Objective:** rebuild `/` as a server-rendered Next.js route that (a) preserves current rankings, (b) lifts conversion toward high-value markets (US/UK/CA/AU buyers, not informational volume), and (c) maxes Core Web Vitals + AI-engine citability.

**Success metrics (measure pre/post, 28-day windows):**

| Metric | Current baseline | Target |
|---|---|---|
| GSC clicks (`/`) | 6.29K | hold or grow; **zero regression** is the floor |
| Avg position for "god of prompt" (brand) | #1 (assumed) | hold #1 |
| Position for "ai prompts" / "ai prompt library" (head) | ranking, recovering | climb |
| Mobile Lighthouse Performance | ~unknown, suspected <80 | **≥90** |
| Mobile LCP (p75) | "needs improvement" band | **<2.5s** |
| Mobile INP (p75) | suspected >200ms (React bundle) | **<200ms** |
| CLS | 0 missing dims now | **<0.1** |
| Conversion to bundle (US/UK/CA/AU) | unknown | establish + grow |
| AI-engine citation (ChatGPT/Perplexity for "best AI prompt library") | low | grow |

**The floor that overrides everything:** if a change risks the brand/head-term ranking, it doesn't ship. The homepage is in active recovery — protect the trajectory.

---

## 2. Current-state baseline (what to keep, what to fix)

Audited live `/` (157 KB, 1,795 visible words):

### Keep (working — do not regress)
- ✅ `title`: "God of Prompt — 30,000+ AI Prompts for ChatGPT, Claude, Gemini & More" (good — keyword + brand)
- ✅ `meta description`: 168 chars, keyword-rich, "engineered…curated…free, copy-and-paste"
- ✅ `canonical`: self, absolute ✓
- ✅ `robots`: index, follow ✓
- ✅ Schema: Organization + WebSite + SearchAction (sitelinks-search-box eligible)
- ✅ Images: 62, **0 missing alt, 0 missing dimensions** (hygiene already done — preserve this)
- ✅ Lean-ish: 3 script tags
- ✅ Existing sections: bundle feature, AI Evolution Timeline, testimonials, FAQ, newsletter, founder story

### Fix (the upside)
1. 🔴 **Heading hierarchy is broken.** The hero headline "Stop Guessing. Start Prompts." is split into **four separate `<h2>` tags** (`Stop`, `Guessing.`, `Start`, `Prompts.`). That's semantic noise — search engines see 4 contentless H2s. Must be ONE element with styled `<span>`s, not 4 headings.
2. 🟠 **H1 has zero keyword.** "Your AI Superpowers In One Click" is brand voice but carries no search signal. The page ranks via the title tag; the H1 wastes the strongest on-page heading. (See §5 — decision needed, don't change unilaterally.)
3. 🟠 **Only 1 blog link.** The homepage is the site's #1 PageRank source — it should feed the recovering blog + the money pages + categories. Currently 9 prompt-library, 13 product, 1 blog.
4. 🟠 **No Product/Offer schema** for the Complete AI Bundle, despite featuring it prominently. Add it (§6).
5. 🟠 **Generic `og:image`** (`og-image.jpg`). Ship a branded 1200×630.
6. 🟡 **Mobile CWV** — the React bundle likely fails INP on mid-range Android (the site-wide pattern). RSC rebuild fixes this structurally.

---

## 3. Target keywords & search intent

The homepage serves THREE intents simultaneously — the rebuild must satisfy all without diluting:

| Intent | Queries | How the page serves it |
|---|---|---|
| **Navigational (brand)** | "god of prompt", "godofprompt", "godofprompt ai" | brand-first hero, Organization schema, own the SERP |
| **Head-term (category)** | "ai prompts", "ai prompt library", "chatgpt prompts" | title + H1 region + body + ItemList of categories |
| **Commercial (buyer)** | "best ai prompt library for business", "ai prompt bundle", "ai prompts for [profession]" | bundle feature + "for professionals" framing + category links to buyer pages |

**Conversion reframe (from this session's geo analysis):** 39% of clicks are India / low-monetization. The homepage copy + CTAs should skew toward **Western professional buyers** — "for marketers, founders, agencies", USD lifetime pricing, business-outcome language. Not "free prompts" framing that pulls non-converting volume. The page can rank for the head term AND position for buyers; lead the visible value-prop with the buyer angle.

**Primary keyword for the page:** "AI prompt library" (+ brand). Secondary: "ChatGPT prompts", "AI prompts for [business/marketing/etc.]". This drives the H1 decision in §5.

---

## 4. Information architecture — section blueprint

Order matters for both UX and crawl priority (above-the-fold content weighs most). Recommended section sequence, each with its SEO/CRO job:

| # | Section | Job | Server or Client |
|---|---|---|---|
| 1 | **Hero** | Brand + primary keyword + primary CTA above fold; LCP target | **Server** (RSC) — must be in HTML, is the LCP |
| 2 | **Trust bar** (logos: ChatGPT, Claude, Gemini… + "100K+ users") | instant credibility, entity association | Server |
| 3 | **What it is / value prop** | the "engineered, tested, updated" differentiator (citable passage for AI engines) | Server |
| 4 | **Browse by category** (ItemList) | internal links to 19 category pages + ItemList schema; head-term relevance | Server |
| 5 | **Browse by tool** | links to 7 tool pages | Server |
| 6 | **The Complete AI Bundle** | the money section; Product+Offer schema; bundle CTA | Server (CTA can hydrate) |
| 7 | **AI Evolution Timeline** | engagement / freshness signal (keep — it's distinctive) | Client OK (below fold) |
| 8 | **Social proof / testimonials** | conversion; Review schema if verifiable | Server (static) |
| 9 | **Founder story (E-E-A-T)** | Experience/Expertise signal; links to Person/author | Server |
| 10 | **Top blog posts** (NEW) | feed PageRank to the recovering blog; 4-6 cornerstone links | Server |
| 11 | **FAQ** (plain HTML, NO FAQPage schema) | long-tail + AI-citation passages | Server (`<details>`) |
| 12 | **Newsletter signup** | lead capture (Beehiiv) | Client (form) |
| 13 | **Final CTA → bundle** | conversion | Server + CTA |
| 14 | **Footer** | site-wide links incl. /prompt-library/all, guides, legal | Server |

**New vs current:** add §10 (top blog links — currently 1), strengthen §4/§5 internal linking, add Product schema to §6. Keep the distinctive bits (timeline, founder story, bundle).

---

## 5. On-page SEO spec

### Title (keep current — it works)
```
God of Prompt — 30,000+ AI Prompts for ChatGPT, Claude, Gemini & More
```
68 chars, brand + count + keyword + model names. Don't change without reason.

### Meta description (keep, minor tighten allowed)
Current is good. Optional: lead with the buyer angle. Keep ≤160 chars, include "AI prompt library" + "for ChatGPT, Claude, Gemini".

### Canonical
`https://godofprompt.ai/` — absolute, self. **Hardcode-safe in Next:** set via `generateMetadata()` `alternates.canonical`. (The 7,022-page bug was a shared SPA shell hardcoding homepage canonical onto every route — impossible in App Router when each route owns its metadata. Verify `/` emits exactly one canonical, self.)

### Heading hierarchy (FIX REQUIRED)
- **Exactly one `<h1>`.** Today's "Your AI Superpowers In One Click" is brand voice with no keyword.
- **DECISION (Robert's call — do not change unilaterally; this was reverted once before, PR #90 on the hub):**
  - **Option A — keep brand H1**, work "AI prompt library" into the H2 immediately under it. Lowest risk.
  - **Option B — keyword H1**: "The AI Prompt Library — 30,000+ Engineered Prompts" as H1, demote "Your AI Superpowers In One Click" to a styled eyebrow/tagline. Higher SEO signal, changes the visible hero.
  - **Recommendation:** Option A. The page already ranks; don't disturb the hero that's working. Put the keyword in a strong H2 directly below.
- **The 4-H2 hero split MUST be fixed regardless:** "Stop Guessing. Start Prompts." becomes ONE element (`<p class="hero-tagline">` or a single styled heading), not four `<h2>`s. Reserve H2 for real sections.
- No skipped levels. H2 = sections, H3 = sub-points.

### URL
`/` — never changes. (Note: there was historically a `/ → /prompts` redirect experiment — do NOT reintroduce; the homepage must serve at `/`.)

---

## 6. Schema.org spec (server-rendered JSON-LD)

Emit these as `<script type="application/ld+json">` from the RSC. The homepage is the entity anchor for the whole site — schema here grounds the brand.

### Keep
- **Organization** — name, url, logo, sameAs (X, LinkedIn, YouTube, Instagram), description, founder (Person → Robert Youssef, ties E-E-A-T)
- **WebSite + SearchAction** — sitelinks search box (keep; powers branded SERP search)

### Add
- **Product + Offer** (the Complete AI Bundle) — name, description, image, brand, offers{price, priceCurrency: USD, availability, url: /complete-ai-bundle}. Featuring the bundle without Product schema is a missed rich-result + AI-citation signal.
  - Add **AggregateRating + Review** ONLY if you have verifiable ratings (Stripe-backed customer count + real quotes). Don't fabricate — Google penalizes fake review schema.
- **ItemList** — the 19 categories in the "Browse by category" section, position-synced to DOM order. Reinforces head-term relevance + gives AI engines a structured map.

### Do NOT add
- ❌ **FAQPage** — deprecated outside gov/health (2023). The FAQ stays plain HTML.
- ❌ **HowTo** — same deprecation.
- ❌ Breadcrumb — homepage is root, N/A.

### Founder / E-E-A-T
Link the Organization's `founder` to a Person entity (Robert Youssef) with sameAs to his X. The "Built by an entrepreneur, for entrepreneurs" section is real Experience signal — mark it up.

---

## 7. Content requirements

- **Word count:** keep ≥1,800 visible words (current 1,795). Don't bloat; the homepage isn't a long-form article, but it needs enough substance for the head term.
- **The differentiator passage (citable):** a clear "what makes GOP different" block — engineered (role/context/task/constraints/format), tested in a real business, updated for the current model lineup (GPT-5, Claude Opus 4.6, Gemini 3, Midjourney v7). This is the passage AI engines quote when asked "best AI prompt library." Make it crisp, factual, self-contained (a good answer-engine citation is a standalone paragraph).
- **Language — "engineered" + "curated":** per this session's analysis — "curated" is the search-matched word (use in title/meta/head copy), "engineered" is the differentiator (use in the body/value-prop). Avoid "crafted" (weak). Avoid unverifiable superlatives ("largest on the internet" — already killed, don't return).
- **Buyer framing:** "trusted by 100,000+ marketers, founders, and creators", "one-time purchase, lifetime updates, no subscription", USD. Skews Western/professional.
- **No AI-isms:** ban "unlock/unleash/dive in/elevate/in today's fast-paced world", rule-of-three filler, em-dash overuse. Run copy through `anti-ai-isms`.
- **Honesty:** every claim verifiable (30,000+ prompts, 19 categories, 100K+ users, 1,000+ blog posts). No fabricated stats.

---

## 8. Internal linking — the homepage is the PageRank distributor

The homepage has the most authority on the site; it must flow that authority deliberately. Current: 9 prompt-library, 13 product, **1 blog**. Targets:

| Link to | Count | Why |
|---|---|---|
| 19 category pages | all 19 (ItemList grid) | head-term relevance + distribute to programmatic pages |
| 7 tool pages | all 7 | tool head terms ("chatgpt prompts") |
| `/complete-ai-bundle` | 2-3 (hero CTA + bundle section + final CTA) | the money page |
| `/prompt-library` (hub) | 1-2 | the #2 ranked page |
| **Top blog posts** | **4-6 (NEW)** | feed the recovering blog — link the cornerstones (chatgpt-no-restrictions, 500-best-prompts, etc.) |
| Competitor-alternative pages (when built) | 1-2 | the new bottom-funnel conversion pages |
| Guides | 1-2 | the high-traffic mastery guides |
| `/prompt-library/all` (footer) | 1 | crawl path to combos |

Anchor text: descriptive + varied. The category grid anchors carry the keyword ("Marketing AI Prompts" not "click here").

---

## 9. Core Web Vitals — targets & how

The site-wide mobile CWV problem (heavy React bundle → INP failures) is the homepage's biggest technical risk. The Next.js RSC rebuild fixes it structurally — but only if built right:

### LCP < 2.5s (mobile p75)
- LCP element = the hero `<h1>`/headline text OR the hero image. Make it server-rendered text if possible (instant), or:
- If hero image is LCP: `next/image` with `priority` + `fetchPriority="high"`, preloaded, WebP/AVIF, exact dimensions. No client-side fetch in the LCP path.
- No render-blocking JS above the fold. Fonts: `next/font` with `display: swap`, subset, self-hosted (no external Google Fonts request — current page loads `fonts.googleapis.com`, eliminate that round-trip).

### INP < 200ms (mobile p75) — the big one
- **Server Components by default.** Only the interactive bits (`'use client'`): newsletter form, FAQ accordion (or use native `<details>` — zero JS), mobile menu, any carousel.
- **No giant hydration.** The current SPA hydrates the whole page; RSC ships ~0 JS for static sections. This is the structural fix for the INP failures.
- Defer/lazy below-the-fold interactive widgets (timeline animation, etc.). Load on idle / intersection.
- Avoid heavy client libs. The AI Evolution Timeline animation — use CSS or a lightweight approach, not a heavy animation lib that blocks the main thread.

### CLS < 0.1
- Every image has explicit `width`/`height` (already done — keep via `next/image`).
- Reserve space for any async/injected content (newsletter confirmation, etc.).
- No layout shift from font swap (size-adjust via `next/font`).

### Bundle discipline
- Route-level code splitting (App Router default).
- No analytics/chat/third-party scripts blocking render — load via `next/script` `strategy="afterInteractive"` or `lazyOnload`.
- Target: initial JS < 100KB gzipped for `/`.

---

## 10. Conversion / CRO (it ranks — now make it convert)

The page ranks; the gap is turning Western buyer traffic into bundle sales.

- **Above-fold primary CTA** → `/complete-ai-bundle` ("Get Lifetime Access" — the canonical CTA per brand rules). One clear primary action.
- **Bundle section** with the offer stack (what's included, was/now price, lifetime, no-subscription), social proof, and a hard CTA.
- **Trust signals high:** logos, user count, testimonials with names/photos (real, verifiable).
- **Risk reversal:** lifetime/one-time framing, any guarantee.
- **Newsletter** as the secondary conversion (email capture → nurture) for visitors not ready to buy — Beehiiv-bound.
- **Don't bury the bundle.** It's the revenue engine; it earns a prominent, early section + repeated CTAs.

---

## 11. GEO / AI-engine optimization

The homepage is what ChatGPT/Perplexity/Gemini read when asked "what is God of Prompt" / "best AI prompt library":

- **Self-contained citable passages.** The "what it is / what's different" block should read as a standalone, quotable answer (AI engines lift paragraphs, not whole pages).
- **Align with `llms.txt`** (already live at `/llms.txt`) — the homepage's positioning sentence, key facts (30K prompts, 19 categories, 7 tools, 100K users, one-time pricing) should match llms.txt verbatim so engines get a consistent entity description.
- **Key facts block** — a scannable, factual list (counts, model coverage, pricing model) is high-citation-value.
- **Organization + Product schema** = structured entity grounding for AI engines.
- Server-rendered (RSC) — AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't run JS; everything must be in the HTML. This is mandatory, not optional.

---

## 12. Next.js component architecture

```
app/
  page.tsx                    ← RSC. generateMetadata() + JSON-LD + composes sections
  layout.tsx                  ← <head>, fonts (next/font), Organization schema (site-wide)
components/home/
  Hero.tsx                    server — headline + primary CTA (LCP)
  TrustBar.tsx                server — logo strip
  ValueProp.tsx               server — the "engineered/tested/updated" citable block
  CategoryGrid.tsx            server — 19 categories, ItemList, real <a> (FilterChipGrid pattern)
  ToolGrid.tsx                server — 7 tools
  BundleFeature.tsx           server shell + <BuyCTA/> client island
  AiTimeline.tsx              client (below fold, lazy) — CSS-driven, not heavy lib
  Testimonials.tsx            server — static, Review schema if verifiable
  FounderStory.tsx            server — E-E-A-T
  TopBlogPosts.tsx            server — NEW, 4-6 cornerstone links
  Faq.tsx                     server — native <details>, plain HTML (no FAQPage schema)
  NewsletterForm.tsx          client — Beehiiv
  FinalCta.tsx                server + <BuyCTA/>
lib/seo/
  homeMetadata.ts             generateMetadata for /
  schema/organization.ts      Organization + WebSite + SearchAction
  schema/product.ts           Complete AI Bundle Product+Offer
  schema/itemList.ts          category ItemList
```

- Data (categories, tools, bundle, top posts) from the backend API / Postgres via RSC `fetch` with ISR (`revalidate: 3600` — homepage content changes rarely).
- All grids use the shared `<FilterChipGrid>`/link pattern — real `<a href>`, never `<button>`.

---

## 13. Accessibility (feeds SEO)

- Semantic landmarks: `<header> <main> <section> <footer>`, one `<h1>`, logical heading order.
- All images `alt` (decorative = `alt=""`). Already at 0-missing — maintain.
- CTAs are real `<a>`/`<button>` with discernible text (not icon-only).
- Color contrast ≥ 4.5:1 (the brand dark-yellow-as-text issue is a known pitfall — never yellow text on white).
- Keyboard navigable; focus states visible.
- `prefers-reduced-motion` respected by the timeline animation.

---

## 14. Acceptance criteria (run on staging before cutover)

```bash
BASE=https://staging.godofprompt.ai   # or preview URL

# Exactly one H1, real sections
curl -s "$BASE/" | grep -c '<h1'                       # → 1
# Hero no longer 4 empty H2s (manual: view source, headline is ONE element)

# Canonical self, absolute, single
curl -s "$BASE/" | grep -oE 'rel="canonical" href="[^"]*"'   # → href="https://godofprompt.ai/"  (exactly one)

# Robots indexable
curl -s "$BASE/" | grep -oE 'name="robots" content="[^"]*"'  # → index, follow

# Schema present: Organization + WebSite + Product + ItemList
curl -s "$BASE/" | grep -c 'application/ld+json'             # → ≥3
curl -s "$BASE/" | grep -oE '"@type":"(Organization|WebSite|Product|ItemList|Offer)"' | sort -u

# Internal linking targets
curl -s "$BASE/" | grep -oE 'href="/prompt-library/category/[a-z-]+"' | sort -u | wc -l   # → 19
curl -s "$BASE/" | grep -oE 'href="/blog/[^"]+"' | sort -u | wc -l                         # → ≥4 (was 1)
curl -s "$BASE/" | grep -c 'href="/complete-ai-bundle"'                                    # → ≥2

# Content in HTML (RSC, not JS-rendered) — value-prop text present in raw HTML
curl -s "$BASE/" | grep -ci "engineered"                    # → ≥1 (proves server render)

# Images optimized
curl -s "$BASE/" | grep -oE '<img\b[^>]*>' | grep -v 'alt=' | wc -l       # → 0
# next/image emits width/height — verify no raw <img> without dims

# No external font request (self-hosted via next/font)
curl -s "$BASE/" | grep -c 'fonts.googleapis.com'           # → 0

# Lighthouse (mobile) — run in CI or PSI
#   Performance ≥ 90, LCP < 2.5s, INP < 200ms, CLS < 0.1, Accessibility ≥ 95
```

**Pre-cutover gate:** must pass all above + a side-by-side with current `/` confirming no content/keyword regression (title, description, the head-term body coverage). Stage on subdomain, verify, then DNS/route cutover. Keep the old route serveable for instant rollback.

---

## 15. What NOT to do (April-17 invariants)

- ❌ Don't change the URL `/` or reintroduce a `/ → /prompts` redirect.
- ❌ Don't hardcode a canonical in a shared shell (the 7,022-page bug).
- ❌ Don't ship `noindex` (not even "temporarily" — use staging).
- ❌ Don't make the hero/value-prop client-only — AI crawlers + first-pass Googlebot won't see it.
- ❌ Don't split a headline across multiple heading tags (the current 4-H2 bug).
- ❌ Don't add FAQPage/HowTo schema.
- ❌ Don't use `<button>` for navigational links.
- ❌ Don't load external Google Fonts (round-trip cost) — `next/font`.
- ❌ Don't fabricate Review/AggregateRating schema.
- ❌ Don't regress the current title/description/word-count that's ranking.
- ❌ Don't use unverifiable superlatives ("largest on the internet").

---

## 16. Open decisions (confirm before build)

1. **H1 wording** — keep brand "Your AI Superpowers In One Click" (Option A, recommended) or switch to keyword-led (Option B)? Robert's call; was reverted once before.
2. **Testimonial schema** — do you have verifiable ratings (count + real quotes tied to Stripe) to justify AggregateRating/Review? If not, skip the schema, keep testimonials as plain content.
3. **AI Evolution Timeline** — keep as-is (distinctive, engagement) but rebuild animation CSS-first? Confirm it's worth the below-fold JS.
4. **Newsletter placement** — mid-page or footer-only? Affects layout.
5. **Data source for homepage content** — backend API (`api.godofprompt.dev`) or direct Postgres? Per `ARCHITECTURE.md` the frontend goes through the API client; confirm the homepage's category/tool/bundle data comes via `src/lib/api/`.

---

## Summary for the builder

Rebuild `/` as a **server-rendered (RSC) Next.js route** that preserves the ranking title/description/word-count, **fixes the 4-H2 hero bug**, adds **Product + ItemList schema**, **feeds the blog with 4-6 links**, hits **mobile CWV ≥90 / INP <200ms** via RSC + next/image + next/font, and leads the visible value-prop with the **buyer/Western-professional** angle for conversion. Everything in the HTML for AI crawlers. Stage, verify against the acceptance matrix + a no-regression diff, then cut over with rollback ready.

The homepage is winning — this rebuild makes it win harder without risking the win.
