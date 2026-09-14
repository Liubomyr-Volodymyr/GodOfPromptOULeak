import { ChevronDown } from "lucide-react";
import { SITE } from "@/lib/home";

const QUESTIONS = [
  {
    question: "What is The Complete AI Bundle?",
    answer:
      "The Complete AI Bundle brings God of Prompt products together in one place, with the product access and updates described in the live catalogue.",
  },
  {
    question: "What are AI prompts, and how are they useful?",
    answer:
      "AI prompts are instructions you give a model such as ChatGPT or Claude. A well-structured prompt gives the model clearer context, constraints, and a useful output format.",
  },
  {
    question: "Can the bundle help me with prompt engineering?",
    answer:
      "Yes. The current catalogue includes prompt resources, guides, custom instructions, automation workflows, and tools for working with major AI models.",
  },
  {
    question: "Are product updates included?",
    answer:
      "The Complete AI Bundle and applicable toolkits list ongoing or lifetime updates in their live product details. Check the selected product card for its exact included features.",
  },
];

export default function ProductsFaq() {
  return (
    <section
      id="faq"
      aria-label="Products frequently asked questions"
      className="mx-auto w-full max-w-[1280px] px-6 py-16 max-[640px]:px-4 max-[640px]:py-10"
    >
      <div className="rounded-[32px] border border-white/10 bg-gop-dark px-[clamp(24px,5vw,72px)] py-[clamp(34px,5vw,64px)] shadow-[0_34px_70px_-45px_rgba(0,0,0,0.7)]">
        <header className="text-center">
          <h2 className="m-0 text-[clamp(28px,3.2vw,38px)] font-semibold tracking-[-0.025em] text-white">
            FAQs
          </h2>
          <p className="m-0 mt-2 text-[15px] text-white/55">
            Have questions? We&apos;ve got you!
          </p>
        </header>

        <div className="mx-auto mt-9 flex max-w-[1040px] flex-col gap-4">
          {QUESTIONS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/[0.08] px-6 open:bg-white/[0.11]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-white/45 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="m-0 max-w-[85ch] pb-6 pr-8 text-[15px] leading-6 text-white/60">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-9 flex justify-center">
          <a
            href={SITE.founderX}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-[13px] font-medium text-white no-underline transition-colors hover:bg-white/10"
          >
            Got another question?
          </a>
        </div>
      </div>
    </section>
  );
}
