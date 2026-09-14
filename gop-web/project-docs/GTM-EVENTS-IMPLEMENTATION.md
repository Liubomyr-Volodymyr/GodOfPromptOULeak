# GTM dataLayer Events — Implementation Brief

> Translates the MADS "dataLayer Event Specification v2.0" into dev wiring. GTM is already installed; you only fire `window.dataLayer.push()`. MADS builds the GA4 tags/triggers/conversions. This doc = the shared utilities + exactly where each event fires. The MADS doc has the canonical payloads — this is the HOW.

## Where to build it

**Build in `gop-web` (the new Next.js app), not gop-web-temp** — unless MADS needs data before the rebuild ships. Reasons: events fire from the router/render lifecycle (cleaner in Next App Router than the Vite SPA), and building twice is waste. If data is needed NOW on the live site, port the P0 subset to gop-web-temp and re-implement in gop-web at cutover. **Decide with Robert: data-now (do both) or wait-for-rebuild (gop-web only).**

---

## 1. Shared infrastructure (build first — every event depends on it)

### `src/lib/analytics/track.ts`
```ts
type Params = Record<string, unknown>;

declare global { interface Window { dataLayer?: unknown[] } }

export function track(event: string, params: Params = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

// E-commerce hygiene: reset before any event carrying an ecommerce object
export function resetEcommerce() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
}

export function trackEcommerce(event: string, ecommerce: Params, extra: Params = {}) {
  resetEcommerce();
  track(event, { ecommerce, ...extra });
}

// user_id = SHA-256 of lowercased, trimmed email. NEVER push raw email.
export async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.trim().toLowerCase());
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Global rules baked into the helpers + conventions
1. **Names exact** — snake_case, lowercase, as written in the MADS doc. Don't rename.
2. **Money = numeric USD, 2 decimals** (`150.00`), `currency: "USD"` on every commerce event. `value` = amount actually charged (post-coupon).
3. **Fire on SUCCESS, not click** — leads/payments/signups fire after the server confirms (200/callback). Exceptions that fire on click: `cta_click`, `pay_button_click`, `select_item`.
4. **Stable IDs** — `item_id`/`prompt_id`/`guide_handle` = the URL slug. `item_name` = display label.
5. **No PII** — never push email/name/phone. Use `user_id` = hashed email only.
6. **transaction_id = dedup key** — the payment processor's order/charge ID, identical client + server, so GA4 counts the sale once.

### SPA-safe firing (`src/lib/analytics/useRouteAnalytics.ts`)
- Fire page-scoped events from the route lifecycle (Next: `usePathname()` effect / `router.events`), NOT only on first load.
- Reset per-page "once" flags (scroll milestones, timers, exit-intent) on every route change.
- Use delegated/document-level listeners that survive route changes for clicks.

### Active-time timer (`src/lib/analytics/useEngagedTime.ts`)
- Counts foreground time only. Pause on `visibilitychange → hidden` and `window blur`; resume on focus. Used by `time_engaged`, `content_read`, `exit_intent`.

### SKU map (`src/lib/analytics/skus.ts`) — canonical, item_id never changes
```ts
export const SKUS = {
  'complete-ai-bundle':       { name: 'Complete AI Bundle',              category: 'bundle',    price: 150.00 },
  'nocode-automations-bundle':{ name: 'No-Code Automations Bundle',      category: 'bundle',    price: 120.00 },
  'custom-gpts-toolkit':      { name: 'Custom GPTs Toolkit',             category: 'toolkit',   price: 47.00 },
  'anti-slop-content-guide':  { name: 'Anti-Slop AI Content Guide',      category: 'guide',     price: 27.00 },
  'chatgpt-instructions-pack':{ name: 'ChatGPT Custom Instructions Pack',category: 'pack',      price: 27.00 },
  'ai-cheatsheets-collection':{ name: 'AI Cheatsheets Collection',       category: 'resource',  price: 17.00 },
  'ai-tools-directory':       { name: '200+ Top AI Tools Directory',     category: 'directory', price: 17.00 },
} as const;
```
⚠️ **Note the SKU drift:** this MADS SKU map uses `nocode-automations-bundle`, `anti-slop-content-guide`, `chatgpt-instructions-pack`, `ai-cheatsheets-collection` — which differ from the current product URL slugs (`automations-bundle`, `custom-instructions`, `ai-cheatsheets`). **Reconcile item_id with the real product slugs before shipping** or GA4 product reporting won't join to the pages. Flag to Robert + MADS.

---

## 2. P0 events — build these first, mapped to fire points

| Event | Fires where (component / lifecycle) | On |
|---|---|---|
| `cta_click` | every primary CTA button (`<CtaButton>` wrapper) — pass `cta_location` | click (before nav) |
| `view_item` | product detail route (`/complete-ai-bundle`, `/products/[slug]`) | route render |
| `pay_button_click` (begin_checkout) | the Pay/Confirm button, before redirect to Gumroad/Stripe — use `event_callback`/beacon so it lands before navigation | click |
| `purchase` ⭐ | **Leg A:** on-domain thank-you page render. **Leg B:** payment webhook → GA4 Measurement Protocol (server, source of truth). Same `transaction_id` both legs. | success |
| `prompt_search` ⭐ | search box + ⌘K modal — after results render (debounced/Enter). **⌘K is NOT auto-tracked — fire explicitly** | results |
| `no_search_results` ⭐ | when `prompt_search` resolves `results_count === 0` | results |
| `prompt_view` | prompt detail page/modal open | open |
| `prompt_copy` ⭐ | the Copy button on any prompt (library + in-article — set `location`). **North-star activation event** | click |
| `generator_start` | first focus/keystroke in "What's your goal?" (once/session) | focus |
| `generator_email_submitted` (+`generate_lead`) | email validated & submitted | success |
| `generator_card_added` ⭐ | card verification success callback (+ server webhook, deduped) | success |
| `generator_generate` | a prompt generated (`is_paid` false=free first, true=$1 after) | success |
| `generator_paid_generation` ⭐ | $1 charge succeeds — purchase-class, dual-tracked, dedup on `transaction_id`. **Server-side mandatory** | success |
| `generator_payment_failed` | charge fails | server |
| `lead_form_view` | a guide's gated email form becomes visible | render |
| `generate_lead` / `guide_download` | guide email submit success → download | success |
| `newsletter_signup` ⭐ | "Join 70,000+" subscribe success | success |
| `article_view` | blog post route render (pass `content_*` dims) | route render |
| `content_read` | engaged-time threshold on an article (active-time timer) | threshold |
| `scroll_milestone` | 25/50/75% (GA4 auto only does 90% — these add granularity) | scroll |
| `time_engaged` | foreground-time buckets | timer |

The MADS doc has the exact payload for each — copy them verbatim (names/params are GA4-mapped). Use `track()` / `trackEcommerce()` from §1.

---

## 3. P1 / P2 — after P0 lands

- **P1:** `social_click`, `view_item_list`, `select_item`, `generator_example_used`, `generator_copy_output`, `prompt_premium_locked`, `category_browse`, `related_article_click`, `email_submit`, `upgrade_click`, `prompt_filter`
- **P2:** `exit_intent`, `faq_toggle`, `popup_shown/dismissed`, `coupon_applied`, `prompt_share`, `table_of_contents_click`, `footer_link_click`

Same helpers, same conventions.

---

## 4. Do NOT build (GA4 Enhanced Measurement auto-collects these)

`page_view` (incl. SPA history), `scroll` (90% only), outbound click, `view_search_results` (?q= URLs), `file_download` (by extension), `video_*`, `user_engagement`. Enable in GA4 admin; don't duplicate. (Our custom `scroll_milestone` 25/50/75 + named dims are the additive value.)

---

## 5. Custom dimensions to register (tell MADS / register in GA4)

Event-scoped: `content_title, content_category, content_type, author, guide_name, guide_handle, form_location, cta_text, cta_location, cta_destination, search_term, search_source, results_count, prompt_id, prompt_category, ai_tool, is_premium, filter_type, filter_value, lock_context, load_method, goal_category, tone, format, generation_index, is_paid, payment_provider, coupon, social_network, percent_scrolled, engaged_seconds`. User-scoped: `user_id`.

---

## 6. Key Events (conversions) — MADS marks these in GTM, you just fire them

`purchase`, `pay_button_click`, `generator_card_added`, `generator_paid_generation`, `generate_lead`, `guide_download`, `newsletter_signup`, `content_read`, and `cta_click` where `cta_text === "Get Lifetime Access"`.

---

## 7. The server-side legs (not frontend — backend/webhook work)

Three events MUST also fire server-side from the payment webhook (browser push = backup, deduped on `transaction_id`):
- `purchase` (Leg B — Gumroad sale / Stripe `checkout.session.completed` → GA4 Measurement Protocol) — **source of truth**, since payment completes off-domain
- `generator_paid_generation` (the $1 charges)
- `generator_card_added` (the captured payment method)

These need the GA4 Measurement Protocol API secret + a `client_id` carried through the redirect. Backend task, coordinate with whoever owns `api.godofprompt.dev`.

---

## 8. Build order

1. **Shared infra** (§1) — `track`, `resetEcommerce`, `hashEmail`, route hook, engaged-time timer, SKU map. Nothing works without it.
2. **Reconcile the SKU map** with real product slugs (the drift flag) — before any ecommerce event.
3. **P0 commerce + generator + library** (the revenue + activation events): `view_item`, `pay_button_click`, `purchase` (both legs), `prompt_copy`, `prompt_search`, `no_search_results`, the generator funnel.
4. **P0 content + lead**: `article_view`, `content_read`, `lead_form_view`, `generate_lead`, `newsletter_signup`, `cta_click`.
5. **P1 then P2.**
6. **Verify** in GTM Preview mode + GA4 DebugView — every event fires once, params populate, ecommerce resets between events, `transaction_id` matches client/server.

---

## 9. Two things to confirm with Robert / MADS before building

1. **SKU map drift** (§1) — the MADS item_ids don't match current product slugs. Pick one set; item_id must equal the real URL slug.
2. **On-domain thank-you page?** — `purchase` Leg A needs one. If checkout returns the buyer to an off-domain page, Leg B (webhook → MP) is the SOLE source of truth. Confirm the post-payment flow.

Full canonical payloads: the MADS "dataLayer Event Specification v2.0" Google Doc. This brief is the wiring; that doc is the contract.
