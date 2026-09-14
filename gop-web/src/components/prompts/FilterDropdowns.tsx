"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { ChevronDown, CornerDownRight, LayoutGrid, Sparkles, Users, type LucideIcon } from "lucide-react";
import { categoryIcon } from "@/lib/category-icons";
import { getToolBrand } from "@/lib/tool-brand";
import { fetchOptionCounts, type CountAxis } from "@/lib/api";
import { GLASS_PANEL } from "@/components/blocks/GlassMenu";

/**
 * FilterDropdowns — the compact filter pill group (Figma 1725:7398) and its
 * dark dropdown panels (Figma 1725:7425). Three pills: Category (roots with
 * per-count badges + inline-expandable subcategory lists), Models, Roles.
 *
 * Every row is a real <Link> to a canonical URL (hrefs built server-side in
 * LibraryView) and panels are hidden-not-unmounted, so the whole facet graph
 * stays in the SSR HTML for crawlers. The client only owns open/close and
 * subcategory expansion.
 */

export type DropdownRow = {
  slug: string;
  name: string;
  href: string;
  count: number | null;
  active: boolean;
  disabled?: boolean;
};

export type CategoryDropRow = DropdownRow & { subs: DropdownRow[] };

export type LibraryDropdownData = {
  categories: CategoryDropRow[];
  models: DropdownRow[];
  roles: DropdownRow[];
};

type PanelKey = "category" | "models" | "roles";

const PILLS: { key: PanelKey; label: string; Icon: LucideIcon }[] = [
  { key: "category", label: "Category", Icon: LayoutGrid },
  { key: "models", label: "Models", Icon: Sparkles },
  { key: "roles", label: "Roles", Icon: Users },
];

export default function FilterDropdowns({ data }: { data: LibraryDropdownData }) {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Partial<Record<PanelKey, HTMLButtonElement | null>>>({});
  // Panels live OUTSIDE the scrollable capsule (an absolute child inside it
  // would be clipped), so each panel's x is measured from its own pill at
  // open time — capsule scroll included.
  const [panelLeft, setPanelLeft] = useState(0);

  // Which slugs each panel needs counts for. Rows that already carry a
  // server-side count are skipped.
  const categoryCountEntries = useMemo(
    () => [
      { axis: "category" as CountAxis, slugs: data.categories.filter((r) => r.count == null).map((r) => r.slug) },
      {
        axis: "subcategory" as CountAxis,
        slugs: data.categories.flatMap((r) => r.subs.filter((s) => s.count == null).map((s) => s.slug)),
      },
    ],
    [data.categories],
  );
  const modelCountEntries = useMemo(
    () => [{ axis: "tool" as CountAxis, slugs: data.models.filter((r) => r.count == null).map((r) => r.slug) }],
    [data.models],
  );
  const roleCountEntries = useMemo(
    () => [{ axis: "audience" as CountAxis, slugs: data.roles.filter((r) => r.count == null).map((r) => r.slug) }],
    [data.roles],
  );

  const toggle = (key: PanelKey) => {
    setOpen((prev) => {
      const next = prev === key ? null : key;
      if (next) {
        const btn = btnRefs.current[key];
        const scrolled = capsuleRef.current?.scrollLeft ?? 0;
        setPanelLeft(Math.max(0, (btn?.offsetLeft ?? 0) - scrolled));
      }
      return next;
    });
  };

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex max-w-full">
      <div ref={capsuleRef} className="flex items-center gap-0.5 overflow-x-auto rounded-full bg-gop-capsule p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PILLS.map(({ key, label, Icon }) => (
          <button
            key={key}
            ref={(el) => {
              btnRefs.current[key] = el;
            }}
            type="button"
            aria-expanded={open === key}
            aria-controls={`lib-panel-${key}`}
            onClick={() => toggle(key)}
            className={[
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white pl-4 pr-2",
              "text-[14px] leading-5 text-gop-ink transition-colors",
              open === key ? "text-gop-ink" : "hover:text-gop-ink",
            ].join(" ")}
          >
            <Icon size={16} strokeWidth={1.8} className="text-gop-ink-muted" />
            {label}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[8px] border border-gop-ink-hairline bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <ChevronDown
                size={14}
                className={`text-[#4F4E4F] transition-transform duration-200 ${open === key ? "rotate-180" : ""}`}
              />
            </span>
          </button>
        ))}
      </div>

      {/* Panels — kept in the DOM (hidden) so facet links are crawlable.
          Counts load lazily per panel (see CountsProvider). */}
      <Panel id="lib-panel-category" hidden={open !== "category"} leftPx={panelLeft}>
        <CountsProvider active={open === "category"} entries={categoryCountEntries}>
          <CategoryPanel rows={data.categories} />
        </CountsProvider>
      </Panel>
      <Panel id="lib-panel-models" hidden={open !== "models"} leftPx={panelLeft}>
        <CountsProvider active={open === "models"} entries={modelCountEntries}>
          <FlatList
            rows={data.models}
            iconFor={(row) => {
              const Icon = getToolBrand(row.name).Icon;
              return <Icon size={16} />;
            }}
          />
        </CountsProvider>
      </Panel>
      <Panel id="lib-panel-roles" hidden={open !== "roles"} leftPx={panelLeft}>
        <CountsProvider active={open === "roles"} entries={roleCountEntries}>
          <FlatList rows={data.roles} iconFor={() => <Users size={15} strokeWidth={1.8} />} />
        </CountsProvider>
      </Panel>
    </div>
  );
}

/* ── panel chrome — DS "Context Menu" glass (Figma 547-6998 recipe:
      rgba(20,20,20,.8) + blur-24 + layered shadow w/ inset highlights;
      same surface as the navbar Tools dropdown) ─────────────────────── */

function Panel({
  id,
  hidden,
  leftPx,
  children,
}: {
  id: string;
  hidden: boolean;
  leftPx: number;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      hidden={hidden}
      style={{ left: leftPx }}
      className="absolute top-[calc(100%+8px)] z-30 w-[280px] max-w-[calc(100vw-32px)] max-[640px]:!left-0"
    >
      <nav className={`max-h-[70vh] overflow-y-auto [scrollbar-width:thin] ${GLASS_PANEL}`}>
        {children}
      </nav>
    </div>
  );
}

const ROW_BASE =
  "flex h-9 items-center justify-between gap-3 rounded-full px-3 text-[14px] no-underline transition-colors";

/* ── live option counts (meta.total) ──────────────────────────────────
   There is no facets endpoint; `GET /api/library/prompts?limit=1&<filter>`
   already returns the count in `meta.total`. We fetch per option the first
   time a panel opens, stream results in, and count up to the number so the
   wait reads as motion rather than a blank slot. ─────────────────────── */
const CountsCtx = createContext<Record<string, number | null>>({});

/**
 * Fetches counts for one or more axes the first time `active` flips true
 * (i.e. the panel is opened), then keeps them. Results stream in per option.
 */
function CountsProvider({
  entries,
  active,
  children,
}: {
  entries: Array<{ axis: CountAxis; slugs: string[] }>;
  active: boolean;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const started = useRef(false);
  // Stable key so the effect doesn't refire on every parent render.
  const key = entries.map((e) => `${e.axis}:${e.slugs.join(",")}`).join("|");

  useEffect(() => {
    if (!active || started.current || !key) return;
    started.current = true;
    let alive = true;
    for (const { axis, slugs } of entries) {
      void fetchOptionCounts(axis, slugs, (slug, count) => {
        if (alive) setCounts((prev) => (slug in prev ? prev : { ...prev, [slug]: count }));
      });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` encodes `entries`
  }, [active, key]);

  return <CountsCtx.Provider value={counts}>{children}</CountsCtx.Provider>;
}

/** Eases 0 → value once the real number arrives. Respects reduced-motion. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion: land on the final value, no animation
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const DURATION = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setShown(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Fail-safe: rAF is throttled to zero in background tabs (and in some
    // embedded webviews), which would strand the number at 0. Always land on
    // the real value once the animation window has passed.
    const settle = setTimeout(() => setShown(value), DURATION + 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [value]);

  return <>{shown.toLocaleString()}</>;
}

/**
 * Count slot. Falls back to the server-provided `count` when present,
 * otherwise the live meta.total for this row's slug. While in flight it shows
 * a subtle pulsing placeholder so the row height never jumps.
 */
function RowCount({ count, slug }: { count: number | null; slug?: string }) {
  const live = useContext(CountsCtx);
  const resolved = count ?? (slug ? live[slug] : undefined);

  if (resolved === null) return null; // fetched, but unavailable
  if (resolved === undefined) {
    return (
      <span
        aria-hidden
        className="h-3 w-6 shrink-0 animate-pulse rounded-full bg-white/15"
      />
    );
  }
  return (
    <span className="shrink-0 tabular-nums text-white/50">
      <CountUp value={resolved} />
    </span>
  );
}

/* ── category panel: roots + inline subcategory lists ─────────────── */

/** Roots shown before the "More" row (Figma 1725:7425 shows six). */
const ROOTS_COLLAPSED = 6;

export function CategoryPanel({ rows }: { rows: CategoryDropRow[] }) {
  const activeRoot = rows.find((r) => r.active || r.subs.some((s) => s.active));
  // Open the root you're browsing, and ONLY that one. Defaulting to rows[0]
  // meant a page with no category selected opened on Art and Design's 16
  // children, pushing every other root below the fold.
  const [expanded, setExpanded] = useState<string | null>(activeRoot?.slug ?? null);
  const [showAll, setShowAll] = useState(false);

  // 21 roots is a scroll, not a menu. Show the first six — plus the active one
  // wherever it sits in the list, so the panel never opens without the category
  // you're currently on visible — and reveal the rest IN PLACE. "More" is an
  // expander, not a link out to another page.
  const activeIndex = activeRoot ? rows.indexOf(activeRoot) : -1;
  const visible = showAll
    ? rows
    : rows.filter((r, i) => i < ROOTS_COLLAPSED || i === activeIndex);
  const hidden = rows.length - visible.length;

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {visible.map((root, i) => {
        const isOpen = expanded === root.slug && root.subs.length > 0;
        return (
          <li key={root.slug} className="flex flex-col">
            {i > 0 && <span aria-hidden className="mx-1 my-0.5 h-px bg-white/[0.06]" />}
            <span className="flex items-center gap-1">
              <Link
                href={root.href}
                aria-current={root.active ? "true" : undefined}
                className={[
                  ROW_BASE,
                  "min-w-0 flex-1 text-[15px]",
                  root.active ? "bg-white/[0.16] text-white" : "text-[#F7F7F7] hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <RootIcon slug={root.slug} />
                  <span className="truncate">{root.name}</span>
                </span>
                <RowCount count={root.count} slug={root.slug} />
              </Link>
              {root.subs.length > 0 && (
                <button
                  type="button"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${root.name} subcategories`}
                  aria-expanded={isOpen}
                  // The panel closes on any click that reaches it (picking a
                  // value navigates). These in-panel controls are the exception:
                  // expanding must not dismiss the menu you're expanding.
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((cur) => (cur === root.slug ? null : root.slug));
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8F8E8F] transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </span>

            {root.subs.length > 0 && (
              <ul hidden={!isOpen} className="m-0 flex list-none flex-col gap-0.5 py-1 pl-2 pr-0">
                {root.subs.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={sub.href}
                      aria-current={sub.active ? "true" : undefined}
                      className={[
                        ROW_BASE,
                        sub.active ? "bg-white/[0.16] text-[#F7F7F7]" : "text-white/75 hover:bg-white/[0.08] hover:text-white",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CornerDownRight size={14} className="shrink-0 text-[#8F8E8F]" />
                        <span className="truncate">{sub.name}</span>
                      </span>
                      <RowCount count={sub.count} slug={sub.slug} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}

      {(hidden > 0 || showAll) && (
        <li className="flex flex-col">
          <span aria-hidden className="mx-1 my-0.5 h-px bg-white/[0.06]" />
          <button
            type="button"
            aria-expanded={showAll}
            onClick={(e) => {
              e.stopPropagation();
              setShowAll((v) => !v);
            }}
            className="flex items-center justify-center gap-1.5 rounded-gop px-3 py-2.5 text-[14px] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            {showAll ? "Less" : `More`}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`} />
          </button>
        </li>
      )}
    </ul>
  );
}

function RootIcon({ slug }: { slug: string }) {
  // categoryIcon is a lookup into a module-level map — the component
  // reference is stable across renders (createElement keeps the
  // static-components lint happy about the dynamic tag).
  return createElement(categoryIcon(slug), {
    size: 16,
    strokeWidth: 1.8,
    className: "shrink-0 text-white/80",
  });
}

/* ── flat list panel (models / roles) ─────────────────────────────── */

function FlatList({
  rows,
  iconFor,
}: {
  rows: DropdownRow[];
  iconFor: (row: DropdownRow) => React.ReactNode;
}) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((row, i) => (
        <li key={row.slug} className="flex flex-col">
          {i > 0 && <span aria-hidden className="mx-1 my-0.5 h-px bg-white/[0.06]" />}
          {row.disabled ? (
            <span title="Not available with the current selection" className={`${ROW_BASE} cursor-not-allowed text-white/30`}>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 opacity-60">{iconFor(row)}</span>
                <span className="truncate">{row.name}</span>
              </span>
              <RowCount count={row.count} slug={row.slug} />
            </span>
          ) : (
            <Link
              href={row.href}
              aria-current={row.active ? "true" : undefined}
              className={[
                ROW_BASE,
                row.active ? "bg-white/[0.16] text-white" : "text-[#F7F7F7] hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0">{iconFor(row)}</span>
                <span className="truncate">{row.name}</span>
              </span>
              <RowCount count={row.count} slug={row.slug} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
