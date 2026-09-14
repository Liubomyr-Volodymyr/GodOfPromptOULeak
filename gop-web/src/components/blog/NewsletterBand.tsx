"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

/**
 * NewsletterBand — email capture at the foot of the blog surfaces. Dark band,
 * gold CTA. Mirrors the homepage NewsletterForm's optimistic behavior.
 * TODO(content): wire the real Beehiiv subscribe endpoint (app-wide) — until
 * then this confirms optimistically, same as src/components/home/NewsletterForm.
 */
export default function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO(content): POST to the Beehiiv subscribe endpoint.
    setDone(true);
  };

  return (
    <section className="relative overflow-hidden rounded-gop-xl bg-gop-dark px-10 py-12 text-center max-[640px]:px-6 max-[640px]:py-10">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[680px] max-w-none -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(253,195,2,0.16), transparent 70%)" }}
      />
      <div className="relative mx-auto flex max-w-[560px] flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-gop-accent-yellow">
          <Mail size={14} strokeWidth={2.2} aria-hidden />
          The newsletter
        </span>
        <h2 className="m-0 font-sans text-[28px] font-bold leading-[1.15] tracking-[-0.01em] text-white max-[640px]:text-[23px]">
          The best of the blog, in your inbox
        </h2>
        <p className="m-0 max-w-[44ch] text-[15px] leading-[1.6] text-white/55">
          One email when notable prompts, tools, and model updates land. No spam, unsubscribe anytime.
        </p>

        {done ? (
          <p className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-gop-accent-yellow">
            <Check size={18} strokeWidth={2.4} aria-hidden />
            You&apos;re in — check your inbox to confirm.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-3 flex w-full max-w-[440px] items-center gap-2 max-[480px]:flex-col" aria-label="Subscribe to the newsletter">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              className="h-12 flex-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-5 font-sans text-[15px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-gop-accent-yellow max-[480px]:w-full"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-gop-gold px-6 font-sans text-[15px] font-semibold text-gop-ink transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_rgba(253,195,2,0.6)] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow max-[480px]:w-full"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
