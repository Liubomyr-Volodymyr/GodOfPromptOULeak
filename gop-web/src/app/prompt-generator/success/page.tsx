import type { Metadata } from "next";
import { Check } from "lucide-react";

import GeneratorSuccessClient from "@/components/generator/GeneratorSuccessClient";
import CheckoutButton from "@/components/products/CheckoutButton";
import { getProductBySlug } from "@/lib/api";
import { BUNDLE } from "@/lib/home";

/**
 * /prompt-generator/success — the post-checkout thank-you page for the custom
 * prompt generator (Figma 2243:13694 wait state). The generator stashes the
 * task_id before Stripe checkout; this page polls task-status, shows the wait
 * animation, then the finished prompt, and offers the bundle upsell.
 *
 * NOTE: the backend's STRIPE_SUCCESS_URL (custom-prompt checkout) must point
 * here for Stripe to land the user on this page after payment.
 *
 * Title is BARE — the root layout template appends " — God of Prompt".
 */
export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function GeneratorSuccessPage() {
  const bundle = await getProductBySlug("complete-ai-bundle");
  const bundleProductId = bundle?.stripeProductId ?? null;

  return (
    <main className="mx-auto flex w-full max-w-[820px] flex-col items-center px-4 py-14 max-[640px]:py-10">
      <header className="mb-9 text-center">
        <p className="m-0 text-[13px] font-medium uppercase tracking-[0.12em] text-gop-ink-soft">
          Payment confirmed
        </p>
        <h1 className="mt-2 text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.02em] text-gop-ink">
          Thank you — your prompt is on the way
        </h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-6 text-gop-ink-muted">
          Hang tight while we engineer your custom prompt. It&rsquo;ll appear below the moment
          it&rsquo;s ready, and we&rsquo;ll email you a copy too.
        </p>
      </header>

      <div className="flex w-full flex-col items-center">
        <GeneratorSuccessClient />
      </div>

      {/* Upsell — the Complete AI Bundle */}
      <section
        aria-label="Complete AI Bundle"
        className="mt-14 w-full overflow-hidden rounded-[28px] bg-gop-dark p-8 text-white max-[640px]:p-6"
      >
        <p className="m-0 text-[13px] font-medium uppercase tracking-[0.12em] text-gop-gold">
          Skip the wait next time
        </p>
        <h2 className="m-0 mt-2 text-[clamp(22px,2.6vw,30px)] font-bold tracking-[-0.02em]">
          Get every engineered prompt in one lifetime bundle
        </h2>
        <p className="m-0 mt-2 max-w-[560px] text-[15px] leading-6 text-white/60">
          {BUNDLE.description}
        </p>

        <ul className="m-0 mt-6 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
          {BUNDLE.includes.slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[14px] leading-5 text-white/80">
              <Check size={16} className="mt-0.5 shrink-0 text-gop-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-7">
          <CheckoutButton variant="gold" size="md" productId={bundleProductId}>
            Unlock the Complete AI Bundle
          </CheckoutButton>
        </div>
      </section>
    </main>
  );
}
