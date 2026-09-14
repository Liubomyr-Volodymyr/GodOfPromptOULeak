import type { ReactNode } from "react";
import Link from "@/components/ui/Link";

/**
 * Menu primitives — dark dropdown / command-palette rows. Figma 554-1425
 * "x-gop-design-system" menu system.
 *
 * Surface: context_menu-bg (#141414). Item states:
 *   default   icon tertiary (#8f8e8f) · label item-primary (#f7f7f7)
 *   hover     icon + label brand yellow (#fcd94a) + inner-glow bg
 *   active    same yellow, persistent (selected)
 *   focus     keyboard-highlighted (same visual as hover)
 *
 * These are presentational only — keyboard nav + selection state live in
 * the consumer (e.g. the command palette).
 */

/* ── Shortcut key chip ────────────────────────────────────────────── */
export function MenuShortcut({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/12 bg-white/5 px-1.5 font-mono text-gop-caption text-gop-menu-item-2">
      {children}
    </kbd>
  );
}

/* ── Item row ─────────────────────────────────────────────────────── */
type MenuItemProps = {
  icon?: ReactNode;
  label: ReactNode;
  subtitle?: ReactNode;
  shortcut?: ReactNode;
  badge?: ReactNode; // e.g. a "Free" pill
  active?: boolean; // selected / keyboard-highlighted
  onSelect?: () => void;
  onMouseEnter?: () => void;
  /** When set, the row is a real <a>/Link (cmd/middle-clickable, prefetched,
   *  crawlable). onSelect still fires on plain click for side-effects. */
  href?: string;
};

export function MenuItem({
  icon,
  label,
  subtitle,
  shortcut,
  badge,
  active = false,
  onSelect,
  onMouseEnter,
  href,
}: MenuItemProps) {
  const className = [
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left no-underline",
    "transition-colors duration-100 ease-out",
    // Hover/active share the same inner-glow highlight + yellow text.
    active
      ? "bg-white/[0.06] shadow-[inset_0_0.6px_2px_rgba(255,255,255,0.16)]"
      : "hover:bg-white/[0.06] hover:shadow-[inset_0_0.6px_2px_rgba(255,255,255,0.16)]",
  ].join(" ");

  const inner = (
    <>
      {icon && (
        <span
          className={[
            "inline-flex h-5 w-5 shrink-0 items-center justify-center",
            active
              ? "text-gop-menu-hover"
              : "text-gop-menu-icon group-hover:text-gop-menu-hover",
          ].join(" ")}
        >
          {icon}
        </span>
      )}

      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span
          className={[
            "truncate text-gop-body",
            active
              ? "text-gop-menu-hover"
              : "text-gop-menu-item group-hover:text-gop-menu-hover",
          ].join(" ")}
        >
          {label}
        </span>
        {subtitle && (
          <span className="truncate text-gop-body-sm text-gop-menu-item-2">
            {subtitle}
          </span>
        )}
      </span>

      {badge && <span className="shrink-0">{badge}</span>}
      {shortcut && <span className="shrink-0">{shortcut}</span>}
    </>
  );

  // A real link when navigable (cmd/middle-click → new tab, SEO);
  // onSelect still fires on plain click for side-effects (remember + close).
  if (href) {
    return (
      <Link
        href={href}
        role="option"
        aria-selected={active}
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
        className={className}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={className}
    >
      {inner}
    </button>
  );
}
