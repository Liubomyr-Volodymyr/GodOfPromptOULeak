import { ChevronDown } from "lucide-react";

/**
 * AccordionRow — the shared native-<details> SEO accordion shell for the
 * library (hub FAQ + pSEO SEO sections). Zero-JS: the body is always in the
 * SSR HTML for crawlers; the chevron rotates via group-open. Each caller
 * passes its own skin (the two surfaces are visually distinct by design) and
 * its body as children — this centralises only the summary/chevron boiler.
 *
 * The `className` must include `group` for the chevron rotation to work.
 */
export default function AccordionRow({
  title,
  defaultOpen = false,
  className,
  summaryClassName,
  chevronSize = 20,
  chevronStrokeWidth,
  chevronClassName = "shrink-0 text-gop-ink transition-transform duration-200 group-open:rotate-180",
  headingLevel,
  children,
}: {
  title: React.ReactNode;
  /**
   * Wrap the summary text in a real heading. The pSEO pages put their whole
   * body copy in these accordions, so without this the document went H1 →
   * H3 (card titles) with NO H2 at all — the section titles were only
   * <summary> text, invisible as structure to a crawler.
   *
   * `<summary>` may contain a heading; the disclosure widget still works.
   */
  headingLevel?: 2 | 3;
  defaultOpen?: boolean;
  className: string;
  summaryClassName: string;
  chevronSize?: number;
  chevronStrokeWidth?: number;
  chevronClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen || undefined} className={className}>
      <summary className={summaryClassName}>
        {headingLevel === 2 ? (
          <h2 className="m-0 font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit]">{title}</h2>
        ) : headingLevel === 3 ? (
          <h3 className="m-0 font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit]">{title}</h3>
        ) : (
          title
        )}
        <ChevronDown size={chevronSize} strokeWidth={chevronStrokeWidth} className={chevronClassName} />
      </summary>
      {children}
    </details>
  );
}
