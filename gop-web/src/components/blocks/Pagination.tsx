import Link from "@/components/ui/Link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination — THE site-wide pager (Figma 1617:22409 "Related Prompts
 * Footer" / DS small buttons). One implementation for every surface:
 *
 *   link mode    — pass `hrefFor(n)` → real <Link>s (+ rel prev/next), for
 *                  crawlable archives (blog category/author, future lists).
 *   button mode  — pass `onPage(n)` → buttons, for client-side grids that
 *                  re-query in place (pSEO results).
 *
 * DS skin, exact: 32px pills; idle = white with a faint top-to-bottom
 * darkening, #AFAFAF/24 border, 1px white outer ring and the blurred white
 * top-ellipse highlight; current page = the brand gold fill with #3F3000
 * text and a #FDC302 ring. Windowed numbers (1 … around current … last).
 */

const PILL_BASE =
  "relative inline-flex h-8 min-w-8 items-center justify-center overflow-hidden rounded-full px-2 " +
  "font-sans text-[14px] leading-5 tabular-nums no-underline transition-[color,filter,transform] duration-150";
const PILL_IDLE =
  "border border-[rgba(175,175,175,0.24)] text-[#4F4E4F] shadow-[0_0_0_1px_#fff] " +
  "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.06)_57%),linear-gradient(#fff,#fff)] " +
  "hover:text-gop-ink active:translate-y-px";
const PILL_ACTIVE =
  "border border-white/40 text-[#3F3000] shadow-[0_0_0_1px_#FDC302]";
const PILL_DISABLED = "cursor-default opacity-40 hover:text-[#4F4E4F] active:translate-y-0";

/** The DS button's blurred white ellipse peeking over the pill's top edge. */
function TopGlow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-2 left-1/2 h-3.5 w-[85%] -translate-x-1/2 rounded-full bg-white opacity-60 blur-[3px]"
    />
  );
}

/** Windowed page list: first, last, current ±1 (gaps become ellipses). */
function windowed(page: number, count: number): number[] {
  const set = new Set<number>([1, count, page, Math.max(1, page - 1), Math.min(count, page + 1)]);
  return [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
}

export default function Pagination({
  page,
  pageCount,
  hrefFor,
  onPage,
  disabled = false,
  ariaLabel = "Pagination",
}: {
  page: number;
  pageCount: number;
  /** Link mode — build the target URL for page n (page 1 = clean base). */
  hrefFor?: (n: number) => string;
  /** Button mode — client page change. */
  onPage?: (n: number) => void;
  /** Button mode only: lock the controls while a page is loading. */
  disabled?: boolean;
  ariaLabel?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = windowed(page, pageCount);

  const cell = (opts: {
    key: string | number;
    label: string;
    aria: string;
    target: number;
    active?: boolean;
    off?: boolean;
    children: React.ReactNode;
  }) => {
    const cls = [
      PILL_BASE,
      opts.active ? PILL_ACTIVE : PILL_IDLE,
      opts.off || disabled ? PILL_DISABLED : "",
    ].join(" ");
    const style = opts.active ? { background: "var(--gop-gradient-gold)" } : undefined;
    const rel = opts.target === page - 1 ? "prev" : opts.target === page + 1 ? "next" : undefined;

    if (hrefFor && !opts.off && !opts.active) {
      return (
        <Link key={opts.key} href={hrefFor(opts.target)} rel={rel} aria-label={opts.aria} className={cls} style={style}>
          <TopGlow />
          <span className="relative">{opts.children}</span>
        </Link>
      );
    }
    return (
      <button
        key={opts.key}
        type="button"
        aria-label={opts.aria}
        aria-current={opts.active ? "page" : undefined}
        disabled={opts.off || disabled || (opts.active && !!hrefFor)}
        onClick={onPage && !opts.off ? () => onPage(opts.target) : undefined}
        className={cls}
        style={style}
      >
        <TopGlow />
        <span className="relative">{opts.children}</span>
      </button>
    );
  };

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-1">
      {cell({
        key: "prev", label: "prev", aria: "Previous page", target: page - 1, off: page <= 1,
        children: <ChevronLeft size={15} strokeWidth={2} aria-hidden />,
      })}
      {pages.map((n, i) => {
        const gap = i > 0 && n - pages[i - 1] > 1;
        return (
          <span key={n} className="flex items-center gap-1">
            {gap && (
              <span aria-hidden className={`${PILL_BASE} ${PILL_IDLE} cursor-default active:translate-y-0`}>
                <TopGlow />
                <span className="relative">…</span>
              </span>
            )}
            {cell({ key: n, label: String(n), aria: `Page ${n}`, target: n, active: n === page, children: n })}
          </span>
        );
      })}
      {cell({
        key: "next", label: "next", aria: "Next page", target: page + 1, off: page >= pageCount,
        children: <ChevronRight size={15} strokeWidth={2} aria-hidden />,
      })}
    </nav>
  );
}
