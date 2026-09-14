# Proposed Tracking Events — review pack

**For:** marketing team
**Status:** proposal, nothing built yet
**Companion to:** `GTM-TRACKING-MASTER.md` (the 31-event catalog already agreed)
**Date:** 27 Jul 2026

---

## Why this document exists

The agreed catalog was written against the *old* site. This is a review of it
against the **actual code in the new build**, which surfaced three kinds of
problem:

1. **Events specced against features that don't exist** — they would fire on
   nothing, or worse, fire on the wrong thing and produce a confident-looking
   number that is false.
2. **Features that exist and earn real money, with no event at all** — most
   importantly the entire subscription and refund line.
3. **Two live bugs** found while auditing. Neither is a tracking problem; both
   would cost sales today.

Every claim below was verified against the running code or the live API, not
assumed. Where something is uncertain it says so.

---

## 1 · Two live bugs (not tracking — fix these first)

### 1.1 Paying customers land on a 404

When someone pays, Stripe returns them to `/success/<session-id>`.
**That page does not exist.** Verified live — it returns a 404.

So the moment checkout works, every customer who pays is dropped on an error
page immediately after handing over money. No confirmation, no delivery link,
no receipt context.

It also means the `purchase` event has no home. The plan specifies purchase is
recorded in two places — the thank-you page *and* the payment webhook — and
cross-checked. With no page, half of that is missing.

### 1.2 Every purchase attempt is currently failing

The checkout call reaches Stripe and comes back **"No such product"** for every
product. The Stripe account the site talks to does not contain the product IDs
stored against our products.

**Nothing reports this.** There is no alert, no event, no dashboard where a
100% checkout failure rate would show up. It was found by hand.

> This is the single strongest argument for the `checkout_unavailable` event
> below. A failure this total should never need a person to notice it.

---

## 2 · Removing three events

| Event | Why it's being dropped |
|---|---|
| `prompt_premium_locked` | There is no paywall. The `isPremium` flag is set on roughly **77%** of prompts but nothing in the product gates on it — no lock screen, no cut-off text. Wired up, this would have reported a paywall being hit on three quarters of all prompt views. Confirmed with Robert: *"there is no such thing as prompt premium locked."* |
| `coupon_applied` | Coupons are entered on **Stripe's** checkout page, not ours — we hand off and never see the code. This can only ever be measured from the payment webhook, not the website. |
| `popup_shown` / `popup_dismissed` / `exit_intent` | No popups exist yet. Worth adding **when** we build one, not before. |

The `is_premium` label is also being removed from prompt reporting, for the
same reason: publishing a "premium" number that corresponds to nothing in the
product would mislead anyone reading the report.

---

## 3 · New: commercial events

### 3.1 Revenue integrity

Subscriptions and refunds are live in the system — the bundle has a **$25/month**
and **$200/year** option, and there are two refund paths — but nothing tracks
any of it.

| Event | The question it answers | Priority |
|---|---|---|
| `refund` | *What did we actually keep?* Without it, reported revenue only ever goes up and will never reconcile against Stripe. | **P0** |
| `subscription_started` | *How many people choose recurring over one-off?* | P0 |
| `subscription_renewed` | *Do they stay?* Right now we can see someone subscribe and never learn whether they lasted two months or twelve. For a $25/month product, renewals are most of the lifetime value. | **P0** |
| `subscription_cancelled` | *When do they leave, and after how long?* | P0 |
| `subscription_upgraded` / `downgraded` | *Does monthly → annual actually happen?* | P2 |

*All recorded from the payment system, not the browser — a cancelled card or a
renewal happens with nobody on the site.*

### 3.2 Which part of the page actually sells

The bundle is promoted in five different places: the hero, the six-card grid,
the "AI revolution" block, the prompt teaser, and the closing call to action.

Today all five report identically — we can see *that* a button was clicked, but
the click carries no product information, so **revenue can never be traced back
to the block that earned it.**

| Event | The question it answers | Priority |
|---|---|---|
| `view_promotion` | *Which blocks do people actually see?* | P1 |
| `select_promotion` | *Which block drove the sale?* Lets us rank the five and cut or rebuild the weak ones. | **P1** |

### 3.3 Failure

| Event | The question it answers | Priority |
|---|---|---|
| `checkout_unavailable` | *Is anyone trying to pay and failing?* Would have caught bug 1.2 on day one, automatically. | **P0** |
| `purchase_success_orphaned` | *Did someone pay and then not get a confirmation?* Catches bug 1.1 and anything like it. | P1 |

### 3.4 Cross-sell

Rather than new events, two labels added to the existing purchase record:
`is_first_purchase` and `products_owned_count`.

With 44 products and a bundle, the recurring question is *does the bundle
cannibalise single sales or grow them?* — and these two answer it.

### 3.5 Naming

Three events should use Google's standard names — `begin_checkout`,
`add_payment_info`, `refund` — instead of custom ones. Google Analytics has
**built-in funnel reports** that only work with the standard names. Using ours
means rebuilding those reports by hand for no benefit.

---

## 4 · New: the sign-up gap

The generator's money flow is: describe a goal → give an email → **create an
account** → add a card → pay.

**The account step is not tracked at all.** We can see the email submitted and
the card added, with the step where people actually give up invisible in
between.

| Event | The question it answers | Priority |
|---|---|---|
| `sign_up` | *How many finish creating an account?* | **P0** |
| `email_verification_sent` / `_completed` | *How many never come back from the verification email?* This is a two-step flow and the drop-off between them is currently unknowable. | P1 |
| `login` | *Do people return?* | P1 |
| `marketing_consent_set` | *What share opt in to marketing?* The consent tick boxes already exist and already send this to the backend — it is free to capture. | P1 |

---

## 5 · New: engagement that predicts a sale

The agreed "north star" is a prompt being copied. But the signals that *lead*
to a copy aren't tracked.

| Event | The question it answers | Priority |
|---|---|---|
| `prompt_variables_filled` | Prompts have fill-in-the-blank fields. Someone filling them in is far more invested than someone copying blind — arguably a better quality signal than raw copy count. | **P0** |
| `copilot_context_inject` | *Does Prompt Copilot make the library more valuable?* This is the one button linking the two products and nothing measures it. | P1 |
| `prompt_like` / `prompt_bookmark` | Already built, currently unmeasured. Cheap, high volume. | P2 |

---

## 6 · New: what people filter by

| Event | The question it answers | Priority |
|---|---|---|
| `library_filter_applied` | *Which categories, models and audiences do people actually pick?* **This should decide which landing pages we create.** We currently choose them on instinct; this turns it into evidence. | **P1** |
| `library_load_more` | *How deep do people browse?* Tells us whether 24 results per page is right. | P2 |
| `page_not_found` | *Which links are broken, and where were people coming from?* There are already two dead links in our own navigation, found by hand. This finds them automatically. | **P0** |

---

## 7 · Summary

| | Count |
|---|---|
| Already agreed | 31 |
| Removed (can't fire / would mislead) | −3 |
| Proposed here | +18 |
| **Total** | **46** |

Suggested order: fix the two bugs → failure events (`checkout_unavailable`,
`page_not_found`) → revenue integrity (`refund`, `subscription_*`) → `sign_up`
→ attribution (`view_promotion` / `select_promotion`) → everything else.

---

## 8 · Open decisions

1. **Analytics is not installed on the new site at all** — no tag, no
   container. Nothing is being measured today. Everything here waits on that.
2. **Separate dev and live tracking?** The development site is tested on daily.
   If it shares a container, that testing pollutes the real numbers.
3. **`generator_options_set`** assumes a tone/format picker that doesn't exist.
   Build the feature, or drop the event as we did with the paywall one.
4. **Is the bundle's monthly/annual pricing actually live?** The subscription
   events depend on it. Our product record and the design disagree on price,
   so this needs confirming before we report on it.
