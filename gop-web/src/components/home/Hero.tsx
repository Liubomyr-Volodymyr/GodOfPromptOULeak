import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "@/components/products/CheckoutButton";
import HeroIllustration from "./HeroIllustration";
import { HERO } from "@/lib/home";

/**
 * Hero — Apple-style: the accent lives entirely on the product (the floating
 * mascot scene), so the copy is calm. Headline is confident monochrome type,
 * the subhead is quiet, two DS actions. Kept short — no avatar stack, no
 * trust badge (the laurel lives in TrustBar, matching the design).
 */
export default function Hero({ bundleProductId }: { bundleProductId: string | null }) {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 pt-10 pb-12 max-[640px]:px-4 max-[640px]:pt-6 max-[640px]:pb-8">
      <div className="grid items-center gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] max-[900px]:grid-cols-1">
        {/* Copy */}
        <div className="flex flex-col items-start gap-5 max-[900px]:gap-5">
          {/* Figma 1895:16378 display headline: heavy Black-Italic lead line +
              light upright tail line. One <h1>, styled spans (SEO-safe). */}
          <h1 className="m-0 font-sans leading-[1.0] tracking-[-0.03em] text-gop-ink text-[clamp(40px,5vw,62px)]">
            <span className="block font-black italic">Your AI Superpowers</span>
            <span className="block font-light not-italic tracking-[-0.015em]">In One Click</span>
          </h1>

          <p className="m-0 max-w-[460px] text-[clamp(16px,1.2vw,18px)] leading-[1.5] tracking-[-0.01em] text-gop-ink-muted">
            {HERO.sub}
          </p>

          {/* Two actions — the design-system gold + dark buttons, as built. */}
          <div className="flex flex-wrap items-center gap-3">
            <CheckoutButton variant="gold" size="md" productId={bundleProductId}>
              {HERO.primary.label}
            </CheckoutButton>
            <CtaButton variant="primary" size="md" href={HERO.secondary.href}>
              {HERO.secondary.label}
            </CtaButton>
          </div>
        </div>

        {/* Product — the floating mascot scene (the accent) */}
        <div className="flex justify-center lg:justify-end max-[900px]:w-full">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
