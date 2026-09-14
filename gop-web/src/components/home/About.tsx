import Image from "next/image";
import { ABOUT } from "@/lib/home";

/**
 * About — the mission block (Figma 2033:20310): "About Us" pill, the
 * positioning headline, then the mascot beside a quotable belief statement.
 * The lead paragraphs stay in the DOM (self-contained passages answer engines
 * can cite) under the pull-quote.
 */
export default function About() {
  return (
    <section aria-label="About God of Prompt" className="mx-auto w-full max-w-[1100px] px-6 py-14 text-center max-[640px]:px-4 max-[640px]:py-10">
      <span className="inline-flex items-center rounded-full border border-gop-ink-hairline bg-white px-3.5 py-1 text-[13px] font-medium text-gop-ink-muted">
        {ABOUT.eyebrow}
      </span>
      <h2 className="mx-auto m-0 mt-4 max-w-[22ch] text-[clamp(24px,3vw,34px)] font-semibold leading-[1.25] tracking-[-0.02em] text-gop-ink">
        About God of Prompt — the #1 most powerful AI prompt library for marketing, business and
        creativity
      </h2>

      <div className="mt-8 flex items-center justify-center gap-6 max-[640px]:flex-col max-[640px]:gap-4">
        <Image
          src="/images/brand/mascot/primary.avif"
          alt=""
          width={160}
          height={160}
          aria-hidden
          className="h-[120px] w-auto shrink-0 object-contain"
        />
        <p className="m-0 max-w-[42ch] rounded-2xl border border-gop-ink-hairline bg-white px-6 py-5 text-left text-[16px] italic leading-6 text-gop-ink max-[640px]:text-center">
          We believe in making AI accessible and easy-to-use through our expertly curated products.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-[72ch] space-y-4 text-left">
        {ABOUT.body.map((p, i) => (
          <p key={i} className="m-0 text-[16px] leading-relaxed text-gop-ink-muted">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
