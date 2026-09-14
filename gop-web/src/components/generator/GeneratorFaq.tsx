import { ChevronDown } from "lucide-react";

import CtaButton from "@/components/ui/CtaButton";

const GENERATOR_FAQS = [
  {
    question: "What do I get with the custom prompt generator?",
    answer:
      "A structured prompt tailored to the goal you describe, ready to copy, adapt, and use in your preferred AI model.",
  },
  {
    question: "Which AI models do generated prompts work with?",
    answer:
      "The prompts are designed to work across major text models, including ChatGPT, Claude, Gemini, and other instruction-following assistants.",
  },
  {
    question: "Do I need an account?",
    answer:
      "You can describe your goal before signing in. An account is required to generate and keep your prompt history.",
  },
  {
    question: "Can I use generated prompts commercially?",
    answer:
      "Yes. You can use the prompts you generate in client work, products, courses, and internal workflows.",
  },
] as const;

export default function GeneratorFaq() {
  return (
    <section
      aria-labelledby="generator-faq-title"
      data-figma-node="2242:23532"
      className="mx-auto w-full max-w-[1248px] px-6 py-16 max-[640px]:px-4 max-[640px]:py-10"
    >
      <div
        className={[
          "relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl px-12 py-6",
          "bg-gradient-to-b from-[#343333] to-[#242223] text-[#f7f7f7]",
          "shadow-[0_1px_1px_rgba(0,0,0,0.07),0_2px_2px_rgba(0,0,0,0.07),0_4px_4px_rgba(0,0,0,0.07),0_8px_8px_rgba(0,0,0,0.07),0_16px_16px_rgba(0,0,0,0.07),0_32px_32px_rgba(0,0,0,0.07)]",
          "max-[640px]:px-5",
        ].join(" ")}
      >
        <header className="text-center">
          <h2
            id="generator-faq-title"
            className="m-0 text-[40px] font-bold leading-12 tracking-[-0.5px] max-[640px]:text-[32px]"
          >
            FAQs
          </h2>
          <p className="m-0 mt-2 text-[18px] leading-[27px] text-white/60">
            Have questions? We&apos;ve got you!
          </p>
        </header>

        <div className="flex w-full flex-col gap-4">
          {GENERATOR_FAQS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/[0.08] bg-white/15 px-6 shadow-[inset_0_27px_76px_rgba(255,255,255,0.06),inset_0_0.6px_2px_rgba(255,255,255,0.16)]"
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[18px] leading-6 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  size={24}
                  aria-hidden
                  className="shrink-0 text-white/75 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="m-0 max-w-[900px] pb-5 pr-10 text-[16px] leading-6 text-white/65">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <CtaButton href="/contact" variant="primary" size="md">
          Got another question?
        </CtaButton>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_32px_rgba(222,222,222,0.12)]"
        />
      </div>
    </section>
  );
}
