"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { captureLead, LeadError } from "@/lib/api/leads";

/**
 * The only interactive element on a lead-gen page: email in, access out.
 *
 * Deliberately minimal. These pages exist to convert ManyChat traffic, so
 * anything that isn't the field or the button is a distraction — no nav bait,
 * no related products, no second CTA.
 *
 * UTMs are lifted off the URL and posted with the lead. That is the whole
 * reason to run these pages on our own domain rather than a form host:
 * attribution survives to Beehiiv, which is where the funnel is measured.
 *
 * On success the access link is revealed IN PLACE rather than redirected to,
 * because a redirect loses the "check your inbox" context and a popup blocker
 * can eat a programmatic window.open.
 */
export default function LeadCaptureForm({
  slug,
  accessUrl,
  cta = "Get instant access",
}: {
  /** Product slug — sent as lead_magnet_slug so the backend knows what was claimed. */
  slug: string;
  /** Notion delivery link, revealed after a successful submit. */
  accessUrl: string | null;
  cta?: string;
}) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    setState("sending");
    try {
      await captureLead({
        email,
        firstName: first,
        leadMagnetSlug: slug,
        utm: {
          source: params.get("utm_source") ?? undefined,
          medium: params.get("utm_medium") ?? undefined,
          campaign: params.get("utm_campaign") ?? undefined,
          content: params.get("utm_content") ?? undefined,
          term: params.get("utm_term") ?? undefined,
        },
      });
      setState("done");
    } catch (err) {
      setError(err instanceof LeadError ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-gop-lg border border-gop-ink-hairline bg-white p-6 text-center">
        <p className="m-0 flex items-center justify-center gap-2 text-[15px] font-medium text-gop-ink">
          <Check size={18} className="text-gop-gold" aria-hidden />
          You&apos;re in — check your inbox.
        </p>
        {accessUrl && (
          <>
            <p className="mx-auto mt-2 mb-4 max-w-[380px] text-[14px] leading-6 text-gop-ink-muted">
              We&apos;ve emailed your copy. You can also open it right now:
            </p>
            <a
              href={accessUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-[15px] font-semibold text-gop-dark no-underline transition-[filter] hover:brightness-105"
              style={{ background: "var(--gop-gradient-gold)" }}
            >
              Open it now
              <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden />
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex gap-3 max-[560px]:flex-col">
        <input
          type="text"
          name="first_name"
          autoComplete="given-name"
          placeholder="First name (optional)"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          className="h-12 flex-1 rounded-full border border-gop-ink-hairline bg-white px-5 text-[15px] text-gop-ink outline-none placeholder:text-gop-ink-soft focus-visible:border-gop-ink/30"
        />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          className="h-12 flex-[1.4] rounded-full border border-gop-ink-hairline bg-white px-5 text-[15px] text-gop-ink outline-none placeholder:text-gop-ink-soft focus-visible:border-gop-ink/30"
        />
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-gop-dark transition-[filter] hover:brightness-105 disabled:opacity-70"
        style={{ background: "var(--gop-gradient-gold)" }}
      >
        {state === "sending" && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {state === "sending" ? "Sending…" : cta}
      </button>

      {error && (
        <p role="alert" className="m-0 text-center text-[13px] text-gop-ink-muted">
          {error}
        </p>
      )}
      <p className="m-0 text-center text-[13px] text-gop-ink-soft">
        Free. No card required — unsubscribe any time.
      </p>
    </form>
  );
}
