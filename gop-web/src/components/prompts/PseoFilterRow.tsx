"use client";

import { createElement, useState } from "react";
import Link from "@/components/ui/Link";
import { Bot, Code2, Image as ImageIcon, Presentation, Type, Users } from "lucide-react";
import FilterDropdown from "@/components/blocks/FilterDropdown";
import FilterHint from "@/components/blocks/FilterHint";
import { MenuLink, MenuOption } from "@/components/blocks/GlassMenu";
import { CategoryPanel } from "./FilterDropdowns";
import { buildCategoryRows } from "./category-rows";
import { categoryIcon } from "@/lib/category-icons";
import { getRoles } from "@/lib/roles";
import { getPromptedOutputTypes } from "@/lib/categories";
import { getToolBrand } from "@/lib/tool-brand";
import { facetEnabled, disabledReason, type Selection } from "@/lib/taxonomy-graph";
import {
  hrefWith, hrefWithout,
  type FacetAxis, type Facetish, type LibrarySelection,
} from "@/lib/library-selection";
import { TOOL_FACETS } from "@/lib/seo/pseo";
import type { Facet, Facets } from "@/lib/api";

/**
 * PseoFilterRow — the template's filter bar (Figma 1725:7656). Left: a
 * light-grey capsule holding three white dropdown pills PRE-SEEDED by the
 * route facets (subcategory / model / audience); picking a value navigates
 * to that combination's canonical page (hrefWith → canonicalHref). Right:
 * client-side sort + the All/Text/Image format toggle. When the route has
 * no format facet the toggle filters the grid in place (query state); on
 * /type/ routes it navigates between the type pages.
 */

export type PseoSort = "popular" | "newest";
/** An output-type slug, or "" for All. Not a closed union: the set comes
 *  from the backend, so a new type appears without a code change. */
export type ClientFormat = string;

const SORT_LABELS: Record<PseoSort, string> = { popular: "Popular", newest: "Newest" };
/** Every output type with at least one prompt behind it. `code` (236) and
 *  `presentation` (1) were invisible while this was hardcoded to text+image. */
const FORMATS: Facetish[] = getPromptedOutputTypes().map((t) => ({ slug: t.slug, name: t.name }));

function used(live: Facet[] | undefined, fallback: Facetish[]): Facetish[] {
  if (live && live.length) return live.map((f) => ({ slug: f.slug, name: f.name }));
  return fallback;
}

/** One facet dropdown: "All …" row + a row per value (toggle-aware links). */
function FacetMenu({
  selection, axis, items, activeSlug, allLabel,
}: {
  selection: LibrarySelection;
  axis: FacetAxis;
  items: Facetish[];
  activeSlug?: string;
  allLabel: string;
}) {
  return (
    <>
      <MenuLink href={hrefWithout(selection, axis)} active={!activeSlug}>
        {allLabel}
      </MenuLink>
      {items.map((item) => (
        <MenuLink
          key={item.slug}
          href={item.slug === activeSlug ? hrefWithout(selection, axis) : hrefWith(selection, axis, item)}
          active={item.slug === activeSlug}
        >
          {item.name}
        </MenuLink>
      ))}
    </>
  );
}

export default function PseoFilterRow({
  selection, facets, sort, onSortChange, clientFormat, onClientFormatChange,
}: {
  selection: LibrarySelection;
  facets: Facets | null;
  sort: PseoSort;
  onSortChange: (s: PseoSort) => void;
  clientFormat: ClientFormat;
  onClientFormatChange: (f: ClientFormat) => void;
}) {
  const graphSel: Selection = {
    tool: selection.tool?.slug,
    role: selection.role?.slug,
    category: (selection.subcategory ?? selection.category)?.slug,
    type: selection.format?.slug,
  };

  // The pill shows the narrowest active term; the panel itself carries the
  // whole tree (buildCategoryRows), so no flat item list is assembled here.
  const catActive = selection.subcategory ?? selection.category;
  // createElement over lookup results: the component identities are stable
  // (registry maps), we just can't prove it to react-hooks/static-components.
  const catIcon = createElement(categoryIcon((selection.subcategory ?? selection.category)?.slug), {
    size: 16,
    strokeWidth: 1.8,
  });

  const toolItems = used(facets?.models, TOOL_FACETS)
    .filter((t) => facetEnabled("tool", t.slug, graphSel));
  const toolIcon = selection.tool
    ? createElement(getToolBrand(selection.tool.name).Icon, { size: 16 })
    : <Bot size={16} strokeWidth={1.8} />;

  const roleItems = used(facets?.roles, getRoles().map((r) => ({ slug: r.slug, name: r.name })));

  // The three facet axes always show (Category / Model / Role). A page is at
  // most a 2-facet combo, so once two are selected the third is BLANKED (not
  // removed) — a click on it explains you can't stack a third.
  const catSel = !!catActive;
  const toolSel = !!selection.tool;
  const roleSel = !!selection.role;
  const selectedCount = [catSel, toolSel, roleSel].filter(Boolean).length;
  const lockHint = "You can combine at most two filters — clear one to switch.";
  const lockedOut = (sel: boolean) => !sel && selectedCount >= 2;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Seeded facet pills — always three; the unselected third blanks out on
          a 2-facet page. No overflow clip (it would clip the popovers). */}
      <div className="flex items-center gap-0.5 rounded-full bg-gop-capsule p-0.5">
        {/* The SAME panel the hub uses (Figma 1725:7425): roots with icons and
            counts, subcategories nested under each. These pages previously got
            a flat list — one axis, two shapes, depending on the route. */}
        <FilterDropdown ariaLabel="Filter by category" icon={catIcon} value={catActive?.name ?? "Category"} active={catSel} disabled={lockedOut(catSel)} disabledHint={lockHint}>
          <CategoryPanel rows={buildCategoryRows(selection, facets)} />
        </FilterDropdown>
        <FilterDropdown ariaLabel="Filter by AI model" icon={toolIcon} value={selection.tool?.name ?? "Model"} active={toolSel} disabled={lockedOut(toolSel)} disabledHint={lockHint}>
          <FacetMenu selection={selection} axis="tool" items={toolItems} activeSlug={selection.tool?.slug} allLabel="All models" />
        </FilterDropdown>
        <FilterDropdown ariaLabel="Filter by role" icon={<Users size={16} strokeWidth={1.8} />} value={selection.role?.name ?? "Role"} active={roleSel} disabled={lockedOut(roleSel)} disabledHint={lockHint}>
          <FacetMenu selection={selection} axis="role" items={roleItems} activeSlug={selection.role?.slug} allLabel="All roles" />
        </FilterDropdown>
      </div>

      {/* sort + format toggle */}
      <div className="flex shrink-0 items-center gap-2">
        <FilterDropdown ariaLabel="Sort prompts" prefix="Sort by:" value={SORT_LABELS[sort]} size="sm" align="right">
          {(Object.keys(SORT_LABELS) as PseoSort[]).map((key) => (
            <MenuOption key={key} active={key === sort} onSelect={() => onSortChange(key)}>
              {SORT_LABELS[key]}
            </MenuOption>
          ))}
        </FilterDropdown>

        <FormatToggle
          selection={selection}
          graphSel={graphSel}
          clientFormat={clientFormat}
          onClientFormatChange={onClientFormatChange}
        />
      </div>
    </div>
  );
}

const SEG_BASE =
  "group/fmt inline-flex h-6 items-center rounded-full px-2.5 text-[13px] leading-none transition-colors duration-150";
const SEG_ON = "border border-gop-ink-faint/60 bg-white font-medium text-gop-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
const SEG_OFF = "text-gop-ink-muted hover:text-gop-ink";

// Output-type labels idle collapsed (icon-only segment); unroll on hover,
// stay out while active. Collapse is max-width-based so the name never
// leaves the accessibility tree.
const segLabel = (on: boolean) =>
  [
    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] duration-200 ease-out",
    on
      ? "ml-1 max-w-[72px] opacity-100"
      : "ml-0 max-w-0 opacity-0 group-hover/fmt:ml-1 group-hover/fmt:max-w-[72px] group-hover/fmt:opacity-100",
  ].join(" ");

/** All / Text / Image — links between /type/ pages when the route carries a
 *  format facet, an in-place grid filter everywhere else. An output type a
 *  selected tool can't produce (modality lock) stays visible but BLANKED —
 *  a click explains why instead of the option silently disappearing. */
function FormatToggle({
  selection, graphSel, clientFormat, onClientFormatChange,
}: {
  selection: LibrarySelection;
  graphSel: Selection;
  clientFormat: ClientFormat;
  onClientFormatChange: (f: ClientFormat) => void;
}) {
  const routed = !!selection.format;
  const activeSlug = selection.format?.slug ?? clientFormat;
  const [hintSlug, setHintSlug] = useState<string | null>(null);
  const icons: Record<string, React.ReactNode> = {
    text: <Type size={13} strokeWidth={1.8} />,
    image: <ImageIcon size={13} strokeWidth={1.8} />,
    code: <Code2 size={13} strokeWidth={1.8} />,
    presentation: <Presentation size={13} strokeWidth={1.8} />,
  };

  const segCls = (on: boolean) => `${SEG_BASE} ${on ? SEG_ON : SEG_OFF}`;

  return (
    <div className="inline-flex h-8 items-center gap-0.5 rounded-full border border-gop-ink-faint/60 bg-white p-1">
      {routed ? (
        <Link href={hrefWithout(selection, "format")} className={`${segCls(false)} no-underline`}>All</Link>
      ) : (
        <button type="button" onClick={() => onClientFormatChange("")} className={segCls(activeSlug === "")}>All</button>
      )}
      {FORMATS.map((f) => {
        const on = f.slug === activeSlug;
        if (!facetEnabled("type", f.slug, graphSel)) {
          return (
            <span key={f.slug} className="relative inline-flex">
              <button
                type="button"
                aria-disabled
                onClick={() => setHintSlug(f.slug)}
                className={`${SEG_BASE} cursor-not-allowed text-gop-ink-faint`}
              >
                {icons[f.slug]}
                <span className={segLabel(false)}>{f.name}</span>
              </button>
              <FilterHint
                show={hintSlug === f.slug}
                message={disabledReason("type", f.slug, graphSel) ?? `No ${f.name.toLowerCase()} prompts here`}
                onDismiss={() => setHintSlug(null)}
                align="right"
              />
            </span>
          );
        }
        return routed ? (
          <Link
            key={f.slug}
            href={on ? hrefWithout(selection, "format") : hrefWith(selection, "format", f)}
            aria-current={on ? "page" : undefined}
            className={`${segCls(on)} no-underline`}
          >
            {icons[f.slug]}
            <span className={segLabel(on)}>{f.name}</span>
          </Link>
        ) : (
          <button
            key={f.slug}
            type="button"
            aria-pressed={on}
            onClick={() => onClientFormatChange(on ? "" : (f.slug as ClientFormat))}
            className={segCls(on)}
          >
            {icons[f.slug]}
            <span className={segLabel(on)}>{f.name}</span>
          </button>
        );
      })}
    </div>
  );
}
