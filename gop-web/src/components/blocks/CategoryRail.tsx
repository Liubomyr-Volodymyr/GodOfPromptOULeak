import Link from "@/components/ui/Link";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import { CATEGORY_BAR, type CategoryBarItem } from "@/lib/category-icons";
import SearchPill from "./SearchPill";

/**
 * CategoryRail — the shared category icon rail (Figma 1617:13029). Square icon
 * tiles + a trailing "More" tile, optionally a "Search ⌘K" pill.
 *
 * A block for the whole site. Two modes, driven by `hrefFor`:
 *   - interactive: `hrefFor(slug)` returns a URL → each tile is a real <Link>
 *     (the prompt library links to /prompt-library/category/[slug]).
 *   - inert: omit `hrefFor` → tiles render as plain, non-hover divs (the guides
 *     page shows the rail for visual completeness before per-guide categories
 *     exist).
 * The active tile is filled dark; idle tiles are white with a soft top glow.
 */

const TILE =
  "relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] transition-colors duration-200";
const TILE_IDLE =
  "bg-white text-gop-ink-muted shadow-[0_8px_12px_-4px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.08)] group-hover:text-gop-ink";
const TILE_ACTIVE = "bg-gop-dark text-white";
const GLOW =
  "pointer-events-none absolute -top-1.5 left-1/2 h-5 w-[85%] -translate-x-1/2 rounded-full bg-white opacity-60 blur-[5px]";
const ITEM_BASE = "flex w-24 shrink-0 flex-col items-center gap-3 no-underline max-[640px]:w-[76px]";

function Tile({ Icon, label, active }: { Icon: LucideIcon; label: string; active: boolean }) {
  return (
    <>
      <span className={`${TILE} ${active ? TILE_ACTIVE : TILE_IDLE}`}>
        {!active && <span aria-hidden className={GLOW} />}
        <Icon size={23} strokeWidth={1.8} className="relative" />
      </span>
      <span className={`text-[13px] leading-4 ${active ? "font-medium text-gop-ink" : "text-[#4F4E4F]"}`}>
        {label}
      </span>
    </>
  );
}

export default function CategoryRail({
  items = CATEGORY_BAR,
  activeSlug,
  hrefFor,
  moreHref,
  moreLabel = "More",
  showSearch = false,
}: {
  items?: CategoryBarItem[];
  activeSlug?: string;
  /** slug → URL. Return null/undefined (or omit the prop) for an inert tile. */
  hrefFor?: (slug: string) => string | null | undefined;
  /** "More" tile target; inert when omitted. */
  moreHref?: string | null;
  moreLabel?: string;
  /** Append the "Search ⌘K" pill (opens the command palette). */
  showSearch?: boolean;
}) {
  const item = (interactive: boolean) => (interactive ? `group ${ITEM_BASE}` : ITEM_BASE);

  return (
    <nav
      aria-label="Browse categories"
      className="flex items-start justify-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[900px]:justify-start"
    >
      {items.map(({ slug, label, Icon }) => {
        const active = slug === activeSlug;
        const href = hrefFor?.(slug);
        return href ? (
          <Link key={slug} href={href} aria-current={active ? "page" : undefined} className={item(true)}>
            <Tile Icon={Icon} label={label} active={active} />
          </Link>
        ) : (
          <div key={slug} className={item(false)}>
            <Tile Icon={Icon} label={label} active={active} />
          </div>
        );
      })}

      {moreHref ? (
        <Link href={moreHref} className={item(true)}>
          <Tile Icon={LayoutGrid} label={moreLabel} active={false} />
        </Link>
      ) : (
        <div className={item(false)}>
          <Tile Icon={LayoutGrid} label={moreLabel} active={false} />
        </div>
      )}

      {showSearch && (
        <div className="shrink-0 pl-2">
          <SearchPill />
        </div>
      )}
    </nav>
  );
}
