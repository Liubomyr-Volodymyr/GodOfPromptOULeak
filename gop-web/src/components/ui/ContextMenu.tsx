"use client";

import {
  useEffect, useId, useRef, useState, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X, CornerDownLeft } from "lucide-react";

/**
 * ContextMenu — the dark "Context Menu Small" dropdown from the design
 * system (Figma 1412:12405 / 1404:9717). A floating glass panel anchored
 * to a trigger, with keycap-style item badges and a ⏎ hint on the active
 * row. Full keyboard nav (↑/↓ move, ⏎ select, Esc close), click-outside,
 * and focus return to the trigger on close.
 *
 *   <ContextMenu
 *     trigger={(p) => <button {...p}>⋮</button>}
 *     title="Share Prompt"
 *     items={[{ id, label, icon, hint?, badgeClass?, onSelect }]}
 *     footer={{ icon, label, onSelect }}   // optional (Profile menu)
 *   />
 *
 * Rendered in a portal so it escapes any clipping ancestor and floats
 * above the page; positioned from the trigger's rect (right-aligned).
 */

export type ContextMenuItem = {
  id: string;
  label: string;
  /** Secondary line (profile category, etc.). Omit for plain actions. */
  hint?: string;
  /** Leading glyph shown inside the keycap badge. */
  icon: ReactNode;
  /** Override the keycap badge background (profile avatar colours). */
  badgeClass?: string;
  /** Marks the current selection (renders highlighted at rest). */
  selected?: boolean;
  onSelect: () => void;
};

type Footer = { icon: ReactNode; label: string; onSelect: () => void };

type TriggerProps = {
  ref: (el: HTMLButtonElement | null) => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  onClick: () => void;
};

export default function ContextMenu({
  trigger,
  title,
  items,
  footer,
  width = 240,
  align = "right",
}: {
  trigger: (props: TriggerProps) => ReactNode;
  title: string;
  items: ContextMenuItem[];
  footer?: Footer;
  width?: number;
  align?: "left" | "right";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const place = () => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const left = align === "right" ? r.right - width : r.left;
    setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // Open: place, default active to the selected item, focus the panel.
  useEffect(() => {
    if (!open) return;
    place();
    const sel = items.findIndex((i) => i.selected);
    setActive(sel >= 0 ? sel : 0);
    const raf = requestAnimationFrame(() => panelRef.current?.focus());
    const onScrollResize = () => place();
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const choose = (i: ContextMenuItem) => { i.onSelect(); close(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = items.length + (footer ? 1 : 0);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % n); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + n) % n); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(n - 1); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (footer && active === items.length) { footer.onSelect(); close(); }
      else choose(items[active]);
    }
  };

  return (
    <>
      {trigger({
        ref: (el) => { triggerRef.current = el; },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        onClick: () => setOpen((v) => !v),
      })}

      {mounted && open && pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={title}
            tabIndex={-1}
            id={id}
            aria-activedescendant={`${id}-item-${active}`}
            onKeyDown={onKeyDown}
            style={{ position: "fixed", top: pos.top, left: pos.left, width }}
            className="z-[100] flex flex-col gap-2 rounded-[24px] border border-white/[0.06] bg-gop-menu-bg/80 p-3 text-left shadow-[0_-3px_5px_rgba(0,0,0,0.09),0_12px_13px_rgba(0,0,0,0.17),0_4px_6px_rgba(0,0,0,0.06),0_-12px_30px_rgba(0,0,0,0.12)] backdrop-blur-[48px] outline-none [animation:gop-menu-in_140ms_var(--gop-ease-standard)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 py-1">
              <span className="flex items-baseline gap-2 min-w-0">
                <span className="truncate font-sans text-[16px] leading-6 text-gop-menu-item">{title}</span>
                <span className="shrink-0 font-sans text-[12px] leading-4 text-gop-menu-item-2">{items.length} items</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => close()}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#6f6e6f] outline-none transition-colors hover:text-gop-menu-item focus-visible:text-gop-menu-item focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1">
              {items.map((it, i) => (
                <Row
                  key={it.id}
                  id={`${id}-item-${i}`}
                  item={it}
                  active={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(it)}
                />
              ))}
            </div>

            {/* Footer (optional) */}
            {footer && (
              <>
                <div className="mx-0 h-px bg-white/[0.04]" />
                <button
                  type="button"
                  id={`${id}-item-${items.length}`}
                  role="menuitem"
                  onMouseEnter={() => setActive(items.length)}
                  onClick={() => { footer.onSelect(); close(); }}
                  className={[
                    "flex items-center gap-2 rounded-[12px] px-3 py-1.5 transition-colors",
                    active === items.length ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center text-gop-menu-item-2">{footer.icon}</span>
                  <span className="flex-1 text-left font-sans text-[12px] leading-4 text-gop-menu-item-2">{footer.label}</span>
                  <Keycap muted />
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function Row({
  id, item, active, onMouseEnter, onClick,
}: { id: string; item: ContextMenuItem; active: boolean; onMouseEnter: () => void; onClick: () => void }) {
  return (
    <button
      type="button"
      id={id}
      role="menuitem"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      aria-current={item.selected ? "true" : undefined}
      className={[
        "flex items-center gap-3 rounded-[999px] px-3 py-2.5 transition-colors",
        active ? "bg-white/[0.16]" : item.selected ? "bg-white/[0.06]" : "hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {/* leading keycap badge */}
      <span
        className={[
          "relative inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-white/[0.24] text-gop-menu-item",
          "shadow-[0_0_0_1px_#000]",
          item.badgeClass ?? "bg-gop-menu-avatar-bg",
        ].join(" ")}
      >
        {/* glossy top sheen */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-3 h-[22px] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,255,255,0.5),transparent_72%)] blur-[6px]" />
        <span className="relative inline-flex">{item.icon}</span>
      </span>

      {/* label + hint */}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate font-sans text-[15px] leading-5 text-gop-menu-item">{item.label}</span>
        {item.hint && <span className="truncate font-sans text-[13px] leading-4 text-gop-menu-item-2">{item.hint}</span>}
      </span>

      {/* enter-key hint on the active row */}
      {active && <Keycap />}
    </button>
  );
}

/** The little ⏎ keycap shown on the active row / footer. */
function Keycap({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-white/[0.24] bg-gop-menu-avatar-bg shadow-[0_0_0_1px_#000]"
    >
      <span className="pointer-events-none absolute inset-x-0 -top-3 h-[22px] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,255,255,0.5),transparent_72%)] blur-[6px]" />
      <CornerDownLeft size={13} className={`relative ${muted ? "text-gop-menu-icon" : "text-gop-menu-item"}`} />
    </span>
  );
}
