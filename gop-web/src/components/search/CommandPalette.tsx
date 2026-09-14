"use client";

import Image from "next/image";
import { Search, CornerDownLeft, FileText, Loader2, Clock, TrendingUp } from "lucide-react";
import { MenuShortcut } from "@/components/ui/menu";
import TypewriterPlaceholder from "./TypewriterPlaceholder";
import { Group, Row, Empty } from "./PaletteRows";
import { usePaletteSearch } from "./usePaletteSearch";

/**
 * CommandPalette — global ⌘K / Ctrl+K search. Figma 554-1425 dark
 * context-menu surface; UX adapted from gop-web-temp's SearchModal.
 *
 *   Empty query → Recent Prompts (localStorage) + Suggested Prompts.
 *   Typing      → live results from /api/search (debounced, same-origin).
 *   Keyboard    → ↑/↓ move (scroll-into-view), ↵ open, Esc close, Tab trapped.
 *   Footer      → GOP logo + "Open prompt ↵" hint.
 *
 * Mounted once in the root layout. Opens on ⌘K or the "gop:open-search"
 * event (fired by the navbar Search button). Selecting a prompt records
 * it to Recent for next time. All stateful wiring (open/close, abortable
 * search, focus trap + restore + inert background, keyboard nav) lives in
 * usePaletteSearch; the row sub-components live in PaletteRows.
 */

const LIST_ID = "palette-listbox";

export default function CommandPalette() {
  const {
    open, setOpen, mounted, query, setQuery, results, recent, loading,
    active, setActive, searching, rows, recentCount, pick, hrefFor, onListKey,
    inputRef, listRef, panelRef, rootRef,
  } = usePaletteSearch();

  if (!open) return null;

  const activeDescendant = active >= 0 ? `palette-row-${active}` : undefined;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[var(--gop-z-modal,50)] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search prompts"
    >
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={[
          "absolute inset-0 cursor-default bg-black/45 backdrop-blur-[6px]",
          "transition-opacity duration-200 ease-out",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <div
        ref={panelRef}
        onKeyDown={onListKey}
        style={{ transformOrigin: "center top" }}
        className={[
          "relative z-[1] flex w-full max-w-[600px] flex-col overflow-hidden",
          "rounded-[20px] border border-white/10 bg-[#161514]",
          "shadow-[0_28px_80px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
          // Fast, subtle entrance (keyboard-frequent → never sluggish).
          "transition-[opacity,transform,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "motion-reduce:!scale-100",
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]",
        ].join(" ")}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-5 py-[18px]">
          <Search size={19} strokeWidth={1.9} className="shrink-0 text-gop-menu-icon" />
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search prompts"
              role="combobox"
              aria-expanded={true}
              aria-controls={LIST_ID}
              aria-activedescendant={activeDescendant}
              className={[
                "w-full bg-transparent text-[16px] leading-6 tracking-[-0.01em] text-gop-menu-item focus:outline-none",
                // While empty, the animated typewriter carries the cursor;
                // hide the real caret so there aren't two. It returns on type.
                query === "" ? "caret-transparent" : "caret-gop-accent-yellow",
              ].join(" ")}
            />
            {query === "" && <TypewriterPlaceholder />}
          </div>
          {loading
            ? <Loader2 size={16} className="animate-spin text-gop-menu-icon" />
            : <MenuShortcut>Esc</MenuShortcut>}
        </div>

        {/* hairline under the input — only when there's a body below */}
        <div aria-hidden className="mx-4 h-px bg-white/[0.07]" />

        {/* Results / idle body */}
        <div
          ref={listRef}
          id={LIST_ID}
          role="listbox"
          aria-label="Search results"
          className="max-h-[54vh] overflow-y-auto p-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.14)_transparent]"
        >
          {searching ? (
            <Group label="Results" count={loading ? "searching…" : `${results.length} items`}>
              {results.length === 0 && !loading ? (
                <Empty>No prompts match “{query}”</Empty>
              ) : (
                results.map((r, i) => (
                  <Row key={r.id} hit={r} index={i} active={i === active} href={hrefFor(r)}
                       onHover={() => setActive(i)} onSelect={() => pick(r)} icon={<FileText size={16} />} />
                ))
              )}
            </Group>
          ) : (
            <>
              {recent.length > 0 && (
                <Group label="Recent" count={`${recent.length}`} icon={<Clock size={12} />}>
                  {recent.map((r, i) => (
                    <Row key={`recent-${r.slug}`} hit={r} index={i} active={i === active} href={hrefFor(r)}
                         onHover={() => setActive(i)} onSelect={() => pick(r)} icon={<Clock size={16} />} />
                  ))}
                </Group>
              )}
              {rows.length > recentCount && (
                <Group label="Suggested" count={`${rows.length - recentCount}`} icon={<TrendingUp size={12} />}>
                  {rows.slice(recentCount).map((r, i) => {
                    const idx = recentCount + i;
                    return (
                      <Row key={r.id} hit={r} index={idx} active={idx === active} href={hrefFor(r)}
                           onHover={() => setActive(idx)} onSelect={() => pick(r)} icon={<TrendingUp size={16} />} />
                    );
                  })}
                </Group>
              )}
              {rows.length === 0 && (
                <Empty>Start typing to search the library</Empty>
              )}
            </>
          )}
        </div>

        {/* Footer hint bar */}
        <div className="mx-4 h-px bg-white/[0.07]" aria-hidden />
        <div className="flex items-center justify-between px-5 py-3">
          <Image
            src="/images/brand/gop-logo.svg"
            alt="God of Prompt"
            width={24}
            height={24}
            className="h-6 w-6 opacity-80"
          />
          <div className="flex items-center gap-4 text-gop-caption text-gop-menu-item-2">
            <span className="inline-flex items-center gap-1.5">
              <MenuShortcut>↑</MenuShortcut>
              <MenuShortcut>↓</MenuShortcut>
              navigate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MenuShortcut><CornerDownLeft size={12} /></MenuShortcut>
              open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
