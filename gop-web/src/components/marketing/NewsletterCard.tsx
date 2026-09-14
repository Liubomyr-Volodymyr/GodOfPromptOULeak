"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";
import CtaButton from "@/components/ui/CtaButton";

/**
 * NewsletterCard — the reusable "Get smarter on AI every week" email-capture
 * card (Figma 2033:20731 / component 2074:27009). Two dark panels: the
 * Figma-exported illustration on the left, the capture form on the right.
 *
 * Reusable across pages (homepage, blog, guides…) and popup-ready — the
 * NewsletterPopup wrapper renders this same card in a timed modal. Pass a
 * distinct `source` per placement so the backend can attribute the lead.
 *
 * Submits the real lead to `POST {API_BASE}/api/lead/capture` (SubmitLeadDto:
 * email required + optional lead_magnet_slug + utm_*). Honest copy only — the
 * design's "4.8 / 743k reviews" star block and "Join 50,700+" line are
 * fabricated numbers and are intentionally NOT rendered.
 */
type Phase = "idle" | "submitting" | "success" | "error";

export default function NewsletterCard({
  source = "newsletter-card",
  title = "Get smarter on AI every week",
  description = "Ready to transform your business?",
  /** Real subscriber count for the social-proof line. Bump as it grows. */
  subscribers = "160,000+",
  className = "",
}: {
  source?: string;
  title?: string;
  description?: string;
  subscribers?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setPhase("error");
      setError("Please enter a valid email address.");
      return;
    }
    setPhase("submitting");
    setError(null);

    const utm = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    try {
      const res = await fetch(`${API_BASE}/api/lead/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          email: trimmed,
          lead_magnet_slug: source,
          utm_source: utm.get("utm_source") ?? undefined,
          utm_medium: utm.get("utm_medium") ?? undefined,
          utm_campaign: utm.get("utm_campaign") ?? undefined,
        }),
      });
      if (!res.ok) {
        let raw = "";
        try {
          const j = await res.json();
          raw = j?.message || (Array.isArray(j?.errors) && j.errors[0]) || "";
        } catch {
          /* not JSON */
        }
        const dup = /unique|already exists|duplicate|primary_email/i.test(raw);
        throw new Error(
          dup
            ? "You're already on the list — check your inbox!"
            : res.status >= 500
              ? "Something went wrong — please try again in a few seconds."
              : "We couldn't add you. Try a different email?",
        );
      }
      setPhase("success");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className={`grid overflow-hidden rounded-[28px] bg-gop-dark md:grid-cols-2 ${className}`}>
      {/* Left — Figma-exported illustration, inset on the shared dark frame */}
      <div className="flex items-center justify-center p-8 max-[767px]:hidden">
        <span className="flex w-full items-center justify-center rounded-2xl bg-white/[0.03] p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/newsletter/email-illustration.svg"
            alt=""
            width={506}
            height={339}
            loading="lazy"
            decoding="async"
            aria-hidden
            className="h-auto w-full max-w-[440px]"
          />
        </span>
      </div>

      {/* Right — capture form (shares the frame; hairline divider on desktop) */}
      <div className="flex flex-col justify-center p-10 max-[640px]:p-6 md:border-l md:border-white/[0.06]">
        <h2 className="m-0 text-[clamp(24px,2.6vw,32px)] font-bold tracking-[-0.02em] text-white">{title}</h2>
        <p className="m-0 mt-1.5 text-[16px] text-white/55">{description}</p>

        {phase === "success" ? (
          <p className="mt-6 rounded-xl bg-white/[0.06] px-5 py-4 text-[15px] text-white">
            You&apos;re in — check your inbox to confirm.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3" noValidate>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email address"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/25"
            />
            <CtaButton variant="gold" size="md" type="submit" disabled={phase === "submitting"} className="w-full">
              {phase === "submitting" ? "Sending…" : "Start getting smarter"}
            </CtaButton>
            {phase === "error" && error && (
              <p role="alert" className="m-0 text-[13px] text-red-300">
                {error}
              </p>
            )}
          </form>
        )}

        <p className="m-0 mt-4 text-[13px] leading-relaxed text-white/45">
          Join <span className="font-semibold text-white/70">{subscribers}</span> subscribers — one email a week,
          real prompts, tools, and model updates. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
