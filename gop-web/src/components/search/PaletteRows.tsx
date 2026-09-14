import type { ReactNode } from "react";
import { MenuItem, MenuShortcut } from "@/components/ui/menu";
import { firstSymbol } from "@/lib/emoji";
import { CornerDownLeft } from "lucide-react";
import type { RecentPrompt } from "@/lib/recent-prompts";
import type { Hit } from "./usePaletteSearch";

/**
 * Presentational sub-components for the command palette — extracted from
 * CommandPalette.tsx to keep that file under the 300-line quality gate.
 * These are pure/presentational; all keyboard nav + selection state live
 * in the palette (via usePaletteSearch).
 */

/* ── Group header + body ──────────────────────────────────────────── */
export function Group({
  label,
  count,
  icon,
  children,
}: {
  label: string;
  count?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-1 flex flex-col">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <span className="inline-flex items-center gap-1.5 text-gop-caption font-medium uppercase tracking-[0.08em] text-gop-menu-icon">
          {icon}
          {label}
        </span>
        {count && <span className="text-gop-caption text-gop-menu-icon">{count}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── Navigable row ────────────────────────────────────────────────── */
export function Row({
  hit,
  index,
  active,
  href,
  onHover,
  onSelect,
  icon,
}: {
  hit: Hit | RecentPrompt;
  index: number;
  active: boolean;
  href: string;
  onHover: () => void;
  onSelect: () => void;
  icon: ReactNode;
}) {
  // `id` + `data-row` carry the listbox-option identity used by
  // aria-activedescendant and scroll-into-view keyboard nav.
  return (
    <div id={`palette-row-${index}`} data-row={index}>
      <MenuItem
        active={active}
        href={href}
        onMouseEnter={onHover}
        onSelect={onSelect}
        icon={
          firstSymbol(hit.icon) ? (
            <span className="text-[18px] leading-none">{firstSymbol(hit.icon)}</span>
          ) : (
            icon
          )
        }
        label={hit.title}
        shortcut={active ? <MenuShortcut><CornerDownLeft size={12} /></MenuShortcut> : undefined}
      />
    </div>
  );
}

/* ── Empty / hint state ───────────────────────────────────────────── */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-6 text-center text-gop-body-sm text-gop-menu-item-2">
      {children}
    </p>
  );
}
