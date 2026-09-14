import { Check } from "lucide-react";
import type { Product } from "@/lib/api";

type Benefit = {
  title: string;
  bullets: string[];
};

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export default function ProductsBenefits({
  bundle,
  automation,
  expertise,
}: {
  bundle: Product | null;
  automation: Product | null;
  expertise: Product | null;
}) {
  const benefits: Benefit[] = [
    {
      title: "One bundle, every paid toolkit",
      bullets: bundle?.features.slice(0, 3) ?? [],
    },
    {
      title: "Automate the work you hate",
      bullets: automation?.features.slice(0, 3) ?? [],
    },
    {
      title: "Expert-level output without the expertise",
      bullets: expertise?.features.slice(0, 3) ?? [],
    },
    {
      title: "Supplied for life",
      bullets: unique([
        bundle?.features.find((feature) => /update/i.test(feature)),
        automation?.features.find((feature) => /lifetime/i.test(feature)),
        expertise?.features.find((feature) => /lifetime/i.test(feature)),
      ]),
    },
  ].filter((benefit) => benefit.bullets.length > 0);

  if (!benefits.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-6 py-20 max-[640px]:px-4 max-[640px]:py-14">
      <header className="text-center">
        <h2 className="m-0 text-[clamp(30px,3.7vw,46px)] font-light leading-[1.1] tracking-[-0.035em] text-gop-ink">
          Ready to act in AI?
          <span className="mt-1 block font-black italic">We&apos;ve got your back, for life.</span>
        </h2>
      </header>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {benefits.map((benefit) => (
          <article
            key={benefit.title}
            className="rounded-[22px] border border-gop-ink-hairline bg-white px-7 py-7 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.35)]"
          >
            <h3 className="m-0 text-[21px] font-semibold tracking-[-0.02em] text-gop-ink">
              {benefit.title}
            </h3>
            <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
              {benefit.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-[15px] leading-6 text-gop-ink-muted"
                >
                  <Check size={17} className="mt-1 shrink-0 text-gop-gold-dark" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
