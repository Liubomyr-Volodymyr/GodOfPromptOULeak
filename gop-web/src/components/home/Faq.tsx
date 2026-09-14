import { ChevronDown } from "lucide-react";
import { FAQS, SITE } from "@/lib/home";

/**
 * Faq — the dark FAQ card (Figma 2033:21103): "FAQs" + "Have questions? We've
 * got you!" over accordion rows, with a "Got another question?" action.
 *
 * Still plain HTML <details> (zero JS) and NO FAQPage schema (deprecated for
 * most results) — the answers stay self-contained passages that answer engines
 * can quote, which is the real win.
 */
export default function Faq() {
  return (
    <section id="faq" aria-label="Frequently asked questions" className="mx-auto w-full max-w-[1180px] px-6 py-14 max-[640px]:px-4 max-[640px]:py-10">
      <div
        data-dots-frame
        className="rounded-[32px] border border-white/[0.1] bg-gop-dark px-[clamp(24px,5vw,72px)] py-[clamp(32px,4vw,60px)] shadow-[0_40px_80px_-48px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-8 text-center">
          <h2 className="m-0 text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em] text-white">
            FAQs
          </h2>
          <p className="m-0 mt-2 text-[15px] text-white/55">Have questions? We&apos;ve got you!</p>
        </div>

        <div className="mx-auto flex max-w-[860px] flex-col gap-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 transition-colors open:bg-white/[0.06]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-white/45 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="m-0 pb-5 pr-8 text-[15px] leading-relaxed text-white/60">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href={`${SITE.founderX}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-full bg-white/10 px-6 text-[15px] font-medium text-white no-underline transition-colors hover:bg-white/15"
          >
            Got another question?
          </a>
        </div>
      </div>
    </section>
  );
}
