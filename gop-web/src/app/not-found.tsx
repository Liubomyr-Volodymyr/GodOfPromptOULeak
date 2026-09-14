import type { Metadata } from "next";
import Image from "next/image";
import CtaButton from "@/components/ui/CtaButton";
import Mascot from "@/components/brand/Mascot";

// Bare title — the root layout template appends " — God of Prompt".
export const metadata: Metadata = { title: "Page not found" };

/**
 * 404 — "Page not found" (Figma 2158:14052). Heading + gold CTA above the
 * big "404" numerals (one exported SVG) with the saluting mascot overlaid at
 * the design's own geometry (left 33.3% / top 29.3% / width 37.3% of the
 * numerals' frame — mascot's cloud spills below the baseline). The global
 * dots canvas supplies the background.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 pb-36 pt-24 text-center max-[640px]:px-4 max-[640px]:pb-20 max-[640px]:pt-12">
      <h1 className="m-0 font-sans text-[clamp(28px,3.4vw,40px)] font-black italic tracking-[-0.02em] text-gop-ink">
        Page not found
      </h1>
      <div className="mt-4">
        <CtaButton variant="gold" size="md" href="/">
          Back to Homepage
        </CtaButton>
      </div>

      {/* 404 numerals + mascot composition — 24px under the CTA (design gap) */}
      <div className="relative mt-6 w-full max-w-[828px]">
        <Image
          src="/images/brand/numbers/404.svg"
          alt=""
          width={956}
          height={480}
          priority
          aria-hidden
          className="h-auto w-full"
        />
        <Mascot
          name="saluting"
          width={309}
          priority
          className="absolute left-[33.3%] top-[29.3%] !h-auto !w-[37.3%]"
        />
      </div>
    </div>
  );
}
