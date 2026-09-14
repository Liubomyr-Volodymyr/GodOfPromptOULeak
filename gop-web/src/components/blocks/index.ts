/**
 * blocks — shared, site-wide UI blocks extracted from the prompt-library
 * surface so every page (library, guides, and future pages) composes the same
 * chrome instead of re-implementing it.
 *
 *   import { CategoryRail, FilterDropdown, MenuOption } from "@/components/blocks";
 *
 * Blocks:
 *   CategoryRail    — the category icon rail (interactive or inert)
 *   SearchPill      — the "Search ⌘K" pill → opens the command palette
 *   FilterDropdown  — a filter pill + glass popover (md/sm, disabled-aware)
 *   FilterHint      — the auto-dismissing "why is this blanked" bubble
 *   SegmentedToggle — a plain pill segmented control
 *   Pagination      — THE pager (Figma 1617:22409): hrefFor → links (SEO
 *                     archives), onPage → buttons (client grids)
 *   GlassMenu       — GLASS_PANEL recipe + MenuLink/MenuOption rows
 */
export { default as CategoryRail } from "./CategoryRail";
export { default as SearchPill } from "./SearchPill";
export { default as FilterDropdown } from "./FilterDropdown";
export { default as FilterHint } from "./FilterHint";
export { default as SegmentedToggle, type Segment } from "./SegmentedToggle";
export { default as Pagination } from "./Pagination";
export { GLASS_PANEL, MenuLink, MenuOption } from "./GlassMenu";
