import AccordionRow from "./AccordionRow";

/**
 * LibraryFaq — the hub's FAQ accordion (Figma 1617:22420). White pill rows;
 * an open row sits in a grey wrapper with the rich answer below. Shared
 * native-<details> shell (AccordionRow) — no client JS, every answer in the
 * SSR HTML (the visible copy is the schema source; per the hub's SEO
 * invariant we render plain HTML Q&A, no FAQPage schema).
 */
export type FaqItem = { id: string; question: string; html: string };

export default function LibraryFaq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section id="faq" aria-label="Frequently asked questions" className="flex flex-col gap-3">
      {items.map((faq) => (
        <AccordionRow
          key={faq.id}
          title={faq.question}
          className="group rounded-[14px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] open:bg-[#EAEAEA] open:pb-1.5 open:shadow-none"
          summaryClassName={[
            "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[14px] bg-white px-5 py-3",
            "text-[17px] font-medium leading-6 text-[#1B1A1A] [&::-webkit-details-marker]:hidden",
            "group-open:shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
          ].join(" ")}
          chevronSize={18}
          chevronClassName="shrink-0 text-gop-dark transition-transform duration-200 group-open:rotate-180"
        >
          <div
            className="prose-hub px-5 py-4 [&_li]:text-[14px] [&_p]:text-[14px] [&_p]:leading-[1.6]"
            dangerouslySetInnerHTML={{ __html: faq.html }}
          />
        </AccordionRow>
      ))}
    </section>
  );
}
