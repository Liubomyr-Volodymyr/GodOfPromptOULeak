import type { ReactNode } from "react";

/**
 * Section — the shared homepage section shell. Standardizes the content
 * width, vertical rhythm, and the eyebrow / H2 / intro header so heading
 * hierarchy stays clean (one H1 in the hero; every section header is an H2).
 * Page stays transparent for the dot background — only cards carry surfaces.
 */
export default function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
  headingClassName = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
  headingClassName?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-[1100px] px-6 py-16 max-[640px]:px-4 max-[640px]:py-12 ${className}`}
    >
      {(eyebrow || title || intro) && (
        <div className="mb-9 max-w-[680px]">
          {eyebrow && (
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gop-ink-soft">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2
              className={`m-0 text-gop-h4 max-[640px]:text-gop-h5 font-semibold tracking-[-0.02em] text-gop-ink ${headingClassName}`}
            >
              {title}
            </h2>
          )}
          {intro && (
            <p className="m-0 mt-4 text-gop-body-lg leading-relaxed text-gop-ink-muted">{intro}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/** Canonical CTA pair styles (brand: solid ink primary, hairline secondary). */
export const CTA_PRIMARY =
  "inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-gop-ink px-7 text-gop-body-sm font-medium text-white no-underline transition-colors hover:bg-gop-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-ink";
export const CTA_SECONDARY =
  "inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-gop-ink-hairline bg-white px-7 text-gop-body-sm font-medium text-gop-ink no-underline transition-colors hover:bg-gop-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-ink";
