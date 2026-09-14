import type { Metadata } from "next";
import { Check, LifeBuoy } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";
import Link from "@/components/ui/Link";
import { API_BASE } from "@/lib/api";

/**
 * /success/[sessionId] — where Stripe returns a buyer after payment.
 *
 * THIS ROUTE WAS MISSING. `startCheckout` sends Stripe
 * `success_url = <origin>/success/{CHECKOUT_SESSION_ID}` (the pattern
 * gop-web-temp uses), but nothing served it — so every customer who paid
 * landed on a 404 the moment they handed over money. It was masked only
 * because checkout fails earlier today ("No such product").
 *
 * Session id is a PATH segment, not a query param, on purpose: the backend
 * and n8n handlers route on URL shape (same as gop-web-temp's
 * /success/:sessionId).
 *
 * Deliberately forgiving: a buyer who has already been charged must never see
 * an error page. If the session can't be read — wrong id, backend down, or
 * Stripe still settling — we still confirm and point at email + support
 * rather than implying the payment failed.
 */
export const dynamic = "force-dynamic"; // per-order, never cached or prerendered

export const metadata: Metadata = {
  title: "Thank you",
  // Transactional page: keep it out of search entirely, independent of the
  // site-wide indexable gate.
  robots: { index: false, follow: false },
};

type SessionResult = {
  ok: boolean;
  email: string | null;
  amountTotal: number | null;
  currency: string | null;
  paid: boolean;
};

/** Read fields defensively — the backend's success payload isn't documented
 *  in the spec beyond "Get Stripe session data", and Stripe nests differently
 *  depending on expansion. Anything we can't find stays null and simply isn't
 *  rendered; nothing here fabricates order details. */
async function getSession(sessionId: string): Promise<SessionResult> {
  const empty: SessionResult = { ok: false, email: null, amountTotal: null, currency: null, paid: false };
  try {
    const res = await fetch(`${API_BASE}/api/billing/stripe/session/${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as Record<string, unknown>;
    if (json?.success === false) return empty;

    const s = (json.session ?? json.data ?? json) as Record<string, unknown>;
    const details = (s.customer_details ?? {}) as Record<string, unknown>;
    const amount = s.amount_total;
    const status = s.payment_status;

    return {
      ok: true,
      email: typeof details.email === "string" ? details.email : null,
      // Stripe reports money in the smallest unit.
      amountTotal: typeof amount === "number" ? amount / 100 : null,
      currency: typeof s.currency === "string" ? s.currency.toUpperCase() : null,
      paid: status === "paid" || status === "no_payment_required",
    };
  } catch {
    return empty;
  }
}

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-20 text-center max-[640px]:px-4 max-[640px]:py-12">
      <span className="grid size-14 place-items-center rounded-full bg-gop-gold/15 text-gop-gold">
        <Check size={28} aria-hidden />
      </span>

      <h1 className="m-0 mt-6 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-gop-ink">
        Thank you — you&apos;re in.
      </h1>

      <p className="m-0 mt-3 max-w-[520px] text-[17px] leading-7 text-gop-ink-muted">
        Your payment went through
        {session.amountTotal != null && session.currency
          ? ` (${session.currency} ${session.amountTotal.toFixed(2)})`
          : ""}
        . We&apos;ve sent your access details
        {session.email ? ` to ${session.email}` : " to the email you used at checkout"}.
      </p>

      <p className="m-0 mt-4 text-[13px] text-gop-ink-soft">
        Order reference: <span className="font-mono">{sessionId}</span>
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <CtaButton variant="gold" size="md" href="/prompt-library">
          Start using the library
        </CtaButton>
        <CtaButton variant="ghost" size="md" href="/guides">
          Browse the guides
        </CtaButton>
      </div>

      {/* The email is the delivery mechanism, so make the failure path
          obvious rather than leaving a paid customer guessing. */}
      <div className="mt-12 w-full rounded-3xl border border-gop-ink-hairline bg-white p-6 text-left">
        <h2 className="m-0 flex items-center gap-2 text-[15px] font-semibold text-gop-ink">
          <LifeBuoy size={16} aria-hidden />
          Didn&apos;t get the email?
        </h2>
        <p className="m-0 mt-2 text-[14px] leading-6 text-gop-ink-muted">
          Check your spam folder first — it arrives within a few minutes. If it hasn&apos;t shown up,{" "}
          <Link href="/contact" className="font-medium text-gop-ink underline">
            contact support
          </Link>{" "}
          and quote the order reference above and we&apos;ll sort it out.
        </p>
      </div>
    </main>
  );
}
