# GTM Tracking — Master Task List (gop-web clean build)

Single source of truth for the new gop-web (Next.js) tracking architecture.
Consolidates: MADS "dataLayer Event Specification v2.0", the implementation brief,
the gop-web-temp verification audit, and every gap/fix found in the SEO recovery
work. Build it once, clean.

Legend: ⭐ high-value · [P0/P1/P2] priority · (SUCCESS) fire on server-confirm ·
(CLICK) fire on click · (SRV) needs a server-side leg too.

---

## A · Shared infrastructure (build FIRST — every event depends on it)

- [ ] `lib/analytics/track.ts` — `track(event, params)` single dataLayer push;
      `trackEcommerce(event, ecommerce, extra)` that first pushes `{ecommerce:null}`
      then the event (GA4 EE hygiene); `hashEmail(email)` → SHA-256 (never raw PII).
- [ ] **Prerender/SSR guard** — never push during build/SSG capture (an
      `isPrerender`/`typeof window` guard). dataLayer created unconditionally.
- [ ] **SKU map** `lib/analytics/skus.ts` — canonical `item_id` (= URL slug),
      `item_name`, `item_category`, `price`. Reconcile drift once: MADS ids vs real
      product slugs (`nocode-automations-bundle` vs `no-code-automations`, etc.).
- [ ] **Route-lifecycle hook** (App Router `usePathname` effect) — fire page-scoped
      events on every client navigation, and RESET per-page "once" flags
      (scroll milestones, timers, exit-intent) on each route change.
- [ ] **Engaged-time timer** `useEngagedTime` — foreground only; pause on
      `visibilitychange→hidden` + window blur, resume on focus. Feeds content_read,
      time_engaged, exit_intent.
- [ ] **Scroll-depth hook** `useScrollDepth` — 25/50/75 milestones, max-scroll HWM.
- [ ] **Consent** — decide consent-mode default (region) before any tag fires.

### Global rules (bake into helpers / code review)
- [ ] Event + param names **exact snake_case** as the spec — map 1:1 to GA4, don't rename.
- [ ] Money = numeric USD 2dp (`150.00`), `currency:"USD"` on every commerce event;
      `value` = amount actually charged (post-coupon).
- [ ] **Fire on SUCCESS**, not click — leads/payments/signups fire after 200/callback.
      Exceptions that fire on CLICK: `cta_click`, `pay_button_click`, `select_item`.
- [ ] Stable ids: `item_id`/`prompt_id`/`guide_handle` = URL slug.
- [ ] No raw PII; `user_id` = SHA-256(lowercased, trimmed email) only.
- [ ] `transaction_id` = processor order id, identical client+server → GA4 dedups.
- [ ] **No double-fire** (lesson): form-submit buttons must NOT also fire `cta_click`;
      gate `cta_click` to real CTAs, pass `cta_location` at every call site (never "unknown").

---

## B · Event catalog (every event to implement)

### Global / brand
- [ ] `cta_click` [P0] (CLICK) — primary CTAs. params: cta_text, **cta_location**
      (hero|sticky_header|bundle_card|article_inline|article_footer|footer|popup),
      cta_destination, cta_type. Key Event when cta_text = "Get Lifetime Access".
- [ ] `social_click` [P1] (CLICK) — social_network, source_location.
- [ ] `popup_shown` / `popup_dismissed` [P2] — popup_id, popup_trigger, popup_type / dismiss_method.
- [ ] `exit_intent` [P2] — cursor exits top edge, once/page. engaged_seconds_before_exit, max_scroll_percent.

### E-commerce funnel (no cart → one item per event; precede each with ecommerce:null)
- [ ] `view_item_list` [P1] (route render) — products grid. item_list_id/name + items[].
- [ ] `select_item` [P1] (CLICK) — clicked product card, same item_list_id.
- [ ] `view_item` [P0] (route render) — product detail. value + one item.
- [ ] `pay_button_click` [P0] (CLICK, begin_checkout) — before redirect; beacon/event_callback
      so it lands pre-navigation. payment_provider, coupon, value, items[].
- [ ] `coupon_applied` [P2] (SUCCESS) — coupon, coupon_status, discount_amount (track rejects too).
- [ ] `purchase` ⭐ [P0] (SUCCESS, **SRV**) — Leg A: on-domain thank-you page;
      Leg B: webhook → GA4 Measurement Protocol (source of truth). Same transaction_id.
      ecommerce: transaction_id, value, tax, currency, coupon, payment_provider, items[].

### Prompt Generator (its own micro-revenue funnel)
- [ ] `generator_start` [P0] — first focus/keystroke, once/session. generator_version, entry_source.
- [ ] `generator_example_used` [P1] (CLICK) — template_id, goal_category.
- [ ] `generator_options_set` [P2] — tone, format (needs the tone/format UI — doesn't exist yet).
- [ ] `generator_email_submitted` [P0] (SUCCESS) + also push `generate_lead`. user_id, lead_source, goal_category.
- [ ] `generator_card_added` ⭐ [P0] (SUCCESS, **SRV**) — card verify callback. user_id, payment_method_id, goal_category.
- [ ] `generator_generate` [P0] (SUCCESS) — is_paid, generation_index, user_id, goal_category.
- [ ] `generator_paid_generation` ⭐ [P0] (SUCCESS, **SRV**) — $1 charge. transaction_id, value 1.00, items[].
- [ ] `generator_payment_failed` (SRV) — charge fails. error_code, transaction_id.
- [ ] `generator_copy_output` [P1] (CLICK) — user_id, is_paid, generation_index.

### Prompt Library (⌘K is NOT auto-tracked — fire explicitly)
- [ ] `prompt_search` ⭐ [P0] (results) — search_term, results_count, search_source (cmdk|main).
- [ ] `no_search_results` ⭐ [P0] — when results_count === 0. search_term, search_source.
- [ ] `prompt_view` [P0] (open) — prompt_id, prompt_category, ai_tool.
      ⚠️ `is_premium` param REMOVED with prompt_premium_locked — the flag exists in the
      backend but gates nothing in the product, so reporting it in GA4 under a name that
      implies gating would be misleading. Re-add only if it gains a real meaning.
- [ ] `prompt_copy` ⭐ [P0] (CLICK, north-star) — prompt_id, prompt_category, ai_tool,
      location (library|article), has_placeholders.
- [x] ~~`prompt_premium_locked`~~ — **DROPPED (Robert, 2026-07-27): "there is no such
      thing as prompt premium locked."** Verified in code: `isPremium` is true on ~385
      of 500 sampled prompts but NOTHING gates on it — no paywall, no overlay, no
      truncated body. It is referenced only as a type field in usePaletteSearch, in
      RememberVisit's recently-viewed record, and as a prop on the prompt page. The
      event would fire on nothing; wired to `isPremium` it would falsely report a
      paywall on ~77% of prompt views.
      prompt_id, prompt_category, lock_context.
- [ ] `category_browse` [P1] (route) — browse_type (category|tool|type), browse_value, results_count, entry.
- [ ] `prompt_share` [P2] (CLICK) — prompt_id, share_method.

### Content — blog & guides (now possible: gop-web renders blog, WP didn't)
- [ ] `article_view` [P1] (route render) — content_title, content_category, content_type, author.
- [ ] `content_read` [P0] (engaged-time threshold) — content_* dims.
- [ ] `scroll_milestone` (25/50/75) — percent_scrolled + content dims.
- [ ] `time_engaged` — foreground-time buckets.
- [ ] `prompt_copy` in-article [P0] — same event, location:"article", block_type, block_index, content_*.

### Lead generation (26 gated guides + newsletter — keep the 3 lead types separable)
- [ ] `lead_form_view` [P0] (render) — guide_name, guide_handle, form_location.
- [ ] `email_submit` [P1] (attempt, pre-success) — guide_handle, form_location, form_type.
- [ ] `generate_lead` / `guide_download` [P0] (SUCCESS) — guide_name, guide_handle.
- [ ] `newsletter_signup` ⭐ [P0] (SUCCESS) — form_location, list_name, source_content_title.

### DO NOT build (GA4 Enhanced Measurement auto-collects — enable in GA4 admin, don't duplicate)
page_view (incl. SPA history), scroll (90% only), outbound click, view_search_results (?q=),
file_download (by extension), video_*, user_engagement.

---

## C · Server-side legs (backend / webhook — NOT frontend)
Fire from the payment webhook via GA4 Measurement Protocol; browser push = deduped backup on transaction_id:
- [ ] `purchase` Leg B (Stripe `checkout.session.completed`) — source of truth.
- [ ] `generator_card_added`
- [ ] `generator_paid_generation`
- [ ] `generator_payment_failed`
- [ ] Needs: GA4 MP API secret + `client_id` carried through the redirect.

---

## D · GA4 / GTM config (MADS or whoever owns the container)
- [ ] Register custom dimensions (event-scoped): content_title, content_category,
      content_type, author, guide_name, guide_handle, form_location, cta_text,
      cta_location, cta_destination, search_term, search_source, results_count,
      prompt_id, prompt_category, ai_tool, filter_type, filter_value,
      lock_context, load_method, goal_category, tone, format, generation_index,
      is_paid, payment_provider, coupon, social_network, percent_scrolled,
      engaged_seconds. User-scoped: user_id.
- [ ] Mark Key Events (conversions): purchase, pay_button_click, generator_card_added,
      generator_paid_generation, generate_lead, guide_download, newsletter_signup,
      content_read, and cta_click where cta_text = "Get Lifetime Access".
- [ ] Build a GTM trigger + GA4 event tag for EACH event above (a push with no
      matching trigger/tag never reaches GA4 — this was the real "events don't work").
- [ ] **Access**: `admin@godofprompt.ai` (or the automation SA) must own/have the
      container so tags can actually be built + audited. Resolve GTM ownership first.

---

## E · Verification (the gate — code-compliance is necessary, not sufficient)
- [ ] Each event fires ONCE per action, params populate, names exact.
- [ ] `ecommerce:null` reset lands before every commerce event.
- [ ] `transaction_id` identical client + server.
- [ ] Confirm in **GTM Preview + GA4 DebugView** (a headless dataLayer check +
      real-browser check — we have the Puppeteer harness for the dataLayer half).
- [ ] No PII in any payload.

## Build order
1. §A infra → 2. reconcile SKU map → 3. P0 commerce + generator + library →
4. P0 content + lead → 5. P1 → 6. P2 → 7. §C server legs → 8. §D GTM config →
9. §E verify in Preview + DebugView.
