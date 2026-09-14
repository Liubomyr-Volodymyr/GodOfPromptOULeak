import Link from "@/components/ui/Link";

/**
 * Breadcrumb — the prompt/library trail (Figma x-gop-design-system
 * 1552:4710). 13px/400 muted crumbs, the brand ">_" terminal glyph as the
 * separator (NOT a plain chevron), the current page in ink and truncated.
 *
 * Every item with an `href` renders as a real <Link> (hover darkens to
 * ink); the last item — or any item without an href — is plain text with
 * aria-current="page". Pass items already in order, root first.
 *
 *   <Breadcrumb items={[
 *     { label: "Prompts", href: "/prompt-library" },
 *     { label: "Marketing", href: "/prompt-library/category/marketing" },
 *     { label: "Get AI Business Plans" },        // current — no href
 *   ]} />
 */
export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex min-w-0 items-center gap-2 font-sans text-[13px] leading-4 ${className}`}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-2">
            {i > 0 && <TerminalSeparator />}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="shrink-0 whitespace-nowrap text-gop-ink-muted no-underline transition-colors hover:text-gop-ink focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={last ? "min-w-0 truncate text-gop-ink" : "shrink-0 whitespace-nowrap text-gop-ink-muted"}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** ">_" terminal separator — traced 1:1 from the Figma vector (8×7 stroke,
 *  1.5 round). Chevron + baseline dash; currentColor so it tints with the
 *  crumb muted tone. */
function TerminalSeparator() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="-1 -1 10 9"
      fill="none"
      aria-hidden
      className="shrink-0 text-[#6F6E6F]"
    >
      <path
        d="M0 0 L3 3 L0 6 M4 7 L8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
