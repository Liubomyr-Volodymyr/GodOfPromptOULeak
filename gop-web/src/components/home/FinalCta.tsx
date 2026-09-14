import Link from "@/components/ui/Link";
import { ArrowUpRight } from "lucide-react";
import { CTA_SECONDARY } from "./Section";
import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "@/components/products/CheckoutButton";

/**
 * FinalCta — last conversion push to the bundle. Server-rendered.
 */
export default function FinalCta({ bundleProductId }: { bundleProductId: string | null }) {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 py-20 max-[640px]:px-4 max-[640px]:py-14">
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="m-0 max-w-[18ch] text-gop-h3 max-[640px]:text-gop-h5 font-semibold tracking-[-0.025em] text-gop-ink">
          Stop staring at the blank box.
        </h2>
        <p className="m-0 max-w-[48ch] text-gop-body-lg text-gop-ink-muted">
          Start from a prompt that already works. One-time purchase, lifetime updates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <CheckoutButton variant="gold" size="lg" productId={bundleProductId} iconAfter={<ArrowUpRight size={18} />}>
            Get Lifetime Access
          </CheckoutButton>
          <Link href="/prompt-library" className={CTA_SECONDARY}>
            Browse the library first
          </Link>
        </div>
      </div>
    </section>
  );
}
