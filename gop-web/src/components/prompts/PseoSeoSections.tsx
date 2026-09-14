import Link from "@/components/ui/Link";
import AccordionRow from "./AccordionRow";
import { pseoRelated, pseoSections } from "@/lib/seo/pseo";
import type { LibrarySelection } from "@/lib/library-selection";

/**
 * PseoSeoSections — the accordion SEO body under the grid (Figma
 * 1434:16313 "Prompt Summary Sections"). Native <details>/<summary> rows
 * (zero-JS, content stays in the SSR HTML for crawlers): white 12px-radius
 * rows, 20px medium titles, chevron toggle; the expanded body sits on the
 * light page tone. Last row is "Related resources" — real <Link>s to
 * sibling canonical pages (the internal-link mesh between combos).
 * Plain HTML Q&A on purpose: no FAQPage schema (deprecated).
 */

const ROW = "group overflow-hidden rounded-xl border border-gop-ink-hairline bg-white";
const SUMMARY =
  "flex cursor-pointer select-none list-none items-center justify-between gap-4 px-6 py-4 " +
  "text-[clamp(16px,1.5vw,20px)] font-medium leading-6 text-gop-ink [&::-webkit-details-marker]:hidden";
const BODY = "border-t border-gop-ink-hairline bg-gop-page px-6 py-5 text-[14px] leading-[1.7] text-gop-ink-muted";

export default function PseoSeoSections({
  selection,
  total,
}: {
  selection: LibrarySelection;
  total: number | null;
}) {
  const sections = pseoSections(selection, total);
  const related = pseoRelated(selection);

  return (
    <section aria-label="About these prompts" className="flex flex-col gap-3">
      {sections.map((s, i) => (
        <AccordionRow key={s.id} title={s.title} headingLevel={2} defaultOpen={i === 0} className={ROW} summaryClassName={SUMMARY} chevronStrokeWidth={2}>
          <div className={BODY}>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)} className="m-0 [&+p]:mt-3">
                {p}
              </p>
            ))}
          </div>
        </AccordionRow>
      ))}

      {related.length > 0 && (
        <AccordionRow title="Related resources" headingLevel={2} className={ROW} summaryClassName={SUMMARY} chevronStrokeWidth={2}>
          <nav aria-label="Related prompt collections" className={`${BODY} flex flex-wrap gap-2`}>
            {related.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex h-8 items-center rounded-full border border-gop-ink-hairline bg-white px-3.5 text-[13px] font-medium text-gop-ink-muted no-underline transition-colors hover:border-gop-ink-faint hover:text-gop-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </AccordionRow>
      )}
    </section>
  );
}
