"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getToolBrand } from "@/lib/tool-brand";

/**
 * ChipRotator — ONE centered line of content-width chips with uniform gaps.
 * Every 7–10s it swaps 1–3 chips for fresh ones from the pool. When a swapped
 * chip's width changes, a FLIP pass slides every other chip smoothly to its new
 * position (they float/rearrange rather than jump) while the swapped chip
 * cross-fades. Reduced motion: static, no rotation.
 *
 * A shared block (was components/home/CategoryChipsRotator) so the library's
 * subcategory row is literally the homepage row with a different pool — same
 * single line, same rotation, same FLIP.
 *
 * TWO MODES:
 *   decorative (default) — aria-hidden, tabIndex -1, opens in a new tab. The
 *     homepage pairs it with its own sr-only list of crawlable links, so the
 *     rotating copy must not be announced or focusable twice.
 *   interactive — real in-page navigation: focusable, same tab, labelled list,
 *     and `activeKey` fills the current page's chip. Use when the row IS the
 *     navigation rather than decoration over a hidden list.
 *
 * `pinned` chips never rotate out and always lead the row — the escape hatch
 * ("All Marketing") and the chip for the page you're on, which must not drift
 * away while you're looking at it.
 */
export type Chip = {
  key: string;
  label: string;
  href: string;
  brand?: string; // tool brand → icon; absent = text-only
  /** Small trailing number (e.g. a thin subcategory's prompt count). */
  badge?: string | number;
};

const FADE_MS = 300;
const SLIDE_MS = 620;

const CHIP_BASE =
  "inline-flex h-[43px] items-center gap-2 whitespace-nowrap rounded-xl border px-4 font-mono text-[13px] leading-6 no-underline transition-[opacity,border-color,background-color,color] duration-300 ease-out";
const CHIP_IDLE =
  "border-gop-ink-hairline bg-white text-gop-ink hover:border-gop-ink/30 hover:bg-gop-ink-wash";
const CHIP_ACTIVE = "border-transparent bg-gop-dark text-white";

export default function ChipRotator({
  pool,
  pinned = [],
  visible = 9,
  interactive = false,
  activeKey,
  ariaLabel,
}: {
  pool: Chip[];
  /** Always shown, always first, never rotated out. */
  pinned?: Chip[];
  /** How many rotating slots the line holds (pinned chips sit outside this). */
  visible?: number;
  interactive?: boolean;
  activeKey?: string;
  ariaLabel?: string;
}) {
  const byKey = useRef(new Map(pool.map((c) => [c.key, c]))).current;
  const [slots, setSlots] = useState<string[]>(() => pool.slice(0, visible).map((c) => c.key));
  const [fading, setFading] = useState<Record<number, boolean>>({});
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  // How many rotating slots actually FIT on one line right now. Labels vary
  // from "Ad Copy" to "Positioning and Messaging", so a fixed count either
  // clips or leaves a gap. Decorative rows can clip under the edge mask;
  // navigation must not — you can't click half a chip.
  const ulRef = useRef<HTMLUListElement>(null);
  const [fit, setFit] = useState(visible);

  useLayoutEffect(() => {
    if (!interactive) return;
    const ul = ulRef.current;
    if (!ul) return;
    // Shrink until it fits; grow back (capped at `visible`) when there's room.
    if (ul.scrollWidth > ul.clientWidth + 1 && fit > 1) setFit(fit - 1);
    else if (ul.scrollWidth <= ul.clientWidth - 140 && fit < visible) setFit(fit + 1);
  });

  useEffect(() => {
    if (!interactive) return;
    const onResize = () => setFit(visible);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [interactive, visible]);

  // FLIP: remember each chip's left edge; after a swap re-lays-out the row,
  // slide every chip from its old x to its new x.
  const liRefs = useRef<(HTMLLIElement | null)[]>([]);
  const prevLefts = useRef<number[]>([]);

  useLayoutEffect(() => {
    const els = liRefs.current;
    els.forEach((el, i) => {
      if (!el) return;
      const newLeft = el.getBoundingClientRect().left;
      const prev = prevLefts.current[i];
      if (prev != null) {
        const dx = prev - newLeft;
        if (Math.abs(dx) > 0.5) {
          el.style.transition = "none";
          el.style.transform = `translateX(${dx}px)`;
          // next frame: release to the new position
          requestAnimationFrame(() => {
            el.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.22,1,0.36,1)`;
            el.style.transform = "";
          });
        }
      }
      prevLefts.current[i] = newLeft;
    });
  }, [slots]);

  useEffect(() => {
    if (pool.length <= visible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let alive = true;
    const timers: number[] = [];
    const rand = (n: number) => Math.floor(Math.random() * n);

    const swap = (slot: number, taken: Set<string>) => {
      const current = slotsRef.current;
      const offscreen = pool.filter((c) => !current.includes(c.key) && !taken.has(c.key));
      if (!offscreen.length) return;
      const incoming = offscreen[rand(offscreen.length)].key;
      taken.add(incoming);
      setFading((f) => ({ ...f, [slot]: true }));
      timers.push(
        window.setTimeout(() => {
          if (!alive) return;
          setSlots((prev) => {
            const next = [...prev];
            next[slot] = incoming;
            return next;
          });
          setFading((f) => ({ ...f, [slot]: false }));
        }, FADE_MS),
      );
    };

    const tick = () => {
      if (!alive) return;
      const count = 1 + rand(3); // 1–3 per cycle
      const chosen = new Set<number>();
      while (chosen.size < count) chosen.add(rand(visible));
      const taken = new Set<string>();
      [...chosen].forEach((slot, i) => timers.push(window.setTimeout(() => alive && swap(slot, taken), i * 220)));
      timers.push(window.setTimeout(tick, 7000 + rand(3000))); // 7–10s
    };

    timers.push(window.setTimeout(tick, 7000 + rand(3000)));
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [pool, visible]);

  const renderChip = (c: Chip, i: number, isPinned: boolean) => {
    const Icon = c.brand ? getToolBrand(c.brand).Icon : null;
    const active = interactive && c.key === activeKey;
    return (
      <li
        key={isPinned ? `pin:${c.key}` : i}
        ref={
          isPinned
            ? undefined
            : (el) => {
                liRefs.current[i] = el;
              }
        }
        className="shrink-0 will-change-transform"
      >
        <a
          href={c.href}
          {...(interactive
            ? { "aria-current": active ? ("page" as const) : undefined }
            : { target: "_blank", rel: "noopener noreferrer", tabIndex: -1 })}
          style={isPinned ? undefined : { opacity: fading[i] ? 0 : 1 }}
          className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
        >
          {Icon && <Icon size={16} aria-hidden className="shrink-0" />}
          {c.label}
          {c.badge != null && (
            <span className={active ? "text-white/50" : "text-gop-ink-soft"}>{c.badge}</span>
          )}
        </a>
      </li>
    );
  };

  return (
    <ul
      ref={ulRef}
      {...(interactive ? { "aria-label": ariaLabel } : { "aria-hidden": true })}
      className={`m-0 flex list-none flex-nowrap items-center justify-center gap-2.5 overflow-hidden p-0${
        // The edge mask reads as "there's more" on a decorative marquee. On the
        // navigation row nothing is clipped, so a fade would just dim real chips.
        interactive ? "" : " [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
      }`}
    >
      {pinned.map((c, i) => renderChip(c, i, true))}
      {slots.slice(0, interactive ? fit : slots.length).map((key, i) => {
        const c = byKey.get(key);
        return c ? renderChip(c, i, false) : null;
      })}
    </ul>
  );
}
