import Image from "next/image";
import CtaButton from "@/components/ui/CtaButton";
import { SITE } from "@/lib/home";

/**
 * FounderStory — the dark "Our Story" card (Figma 2033:19702): founder photo
 * panel on the left, story copy + community/X/LinkedIn actions on the right.
 * Card is the design's dark gradient (#333233 → #242223). Copy is the
 * founder's real first-person story (carried over from gop-web-temp). Still
 * an E-E-A-T signal tied to the Person entity in the Organization schema.
 */
export default function FounderStory() {
  return (
    <section aria-label="Our story" className="mx-auto w-full max-w-[1180px] px-6 py-12 max-[640px]:px-4 max-[640px]:py-8">
      <div className="grid overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#333233_0%,#242223_60%)] shadow-[0_40px_80px_-48px_rgba(0,0,0,0.55)] md:grid-cols-[375px_minmax(0,1fr)] max-[767px]:grid-cols-1">
        {/* Founder photo panel */}
        <div className="relative min-h-[280px] md:min-h-full">
          <Image
            src="/images/home/founder.webp"
            alt={`${SITE.founder}, founder of God of Prompt`}
            fill
            sizes="(max-width: 767px) 100vw, 375px"
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-start gap-5 p-10 max-[640px]:p-7">
          <span className="inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-[13px] font-medium text-white/80">
            Our Story
          </span>
          <h2 className="m-0 text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
            Built by an entrepreneur, for entrepreneurs
          </h2>
          <p className="m-0 max-w-[52ch] text-[16px] leading-relaxed text-white/60">
            I walked away from urban planning and went all-in on AI — obsessed with automating
            the work nobody wants to do. Today God of Prompt is the operating system thousands of
            marketers, founders and creators run their AI work on.
          </p>
          <div className="mt-1 flex flex-nowrap items-center gap-2.5">
            <CtaButton variant="gold" size="md" href={SITE.community}>
              Join the community
            </CtaButton>
            <a
              href={SITE.founderPersonalX}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow the founder on X"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] font-semibold text-white no-underline transition-colors hover:bg-white/12"
            >
              X
            </a>
            <a
              href={SITE.founderLinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-white/[0.06] px-5 text-[15px] font-medium text-white no-underline transition-colors hover:bg-white/12"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
