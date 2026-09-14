import Link from "@/components/ui/Link";
import { Star, Eye } from "lucide-react";
import ToolChip from "./ToolChip";
import { LikeButton, BookmarkButton, ShareButton } from "./CardReactions";
import { formatCount } from "@/lib/utils";
import type { Prompt } from "@/lib/api";

/**
 * CardMeta — the shared plaques of a prompt card (Figma 1602:4702 family):
 * gold "Popular" badge, star rating, chip row, and the stats footer.
 * Split out of PromptCard so all three card variants compose the same
 * pieces and each file stays small.
 */

/** Prompts at/above this view count wear the gold "Popular" badge. */
const POPULAR_VIEWS = 300;

export function isPopular(views: number): boolean {
  return views >= POPULAR_VIEWS;
}

/** Gold "Popular" pill — brand gradient token (one gold family site-wide,
 *  same surface as CtaButton gold), white hairline per the Figma badge. */
export function PopularBadge() {
  return (
    <span
      className="relative inline-flex h-5 items-center overflow-hidden rounded-full border border-white/50 px-2 text-[13px] leading-5 font-medium text-gop-dark"
      style={{ background: "var(--gop-gradient-gold)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 left-1/2 h-3 w-[90%] -translate-x-1/2 rounded-full bg-white opacity-50 blur-[3px]"
      />
      <span className="relative">Popular</span>
    </span>
  );
}

/** Gold stars + "4.9/5" (Figma 1602:4777). Renders ONLY for a real rating —
 *  returns null when the prompt has none (no fabricated stars). The gold fill
 *  is clipped to the exact rating fraction (a 4.2 shows 4.2 stars filled, not
 *  5) so the glyphs never overstate the number beside them. */
export function CardStars({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const label = rating.toFixed(1);
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = [0, 1, 2, 3, 4].map((i) => (
    <Star key={i} size={12} className="shrink-0 fill-current" strokeWidth={0} />
  ));
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${label} out of 5`}>
      <span aria-hidden className="relative inline-flex">
        <span className="inline-flex text-white/25">{row}</span>
        <span
          className="absolute inset-y-0 left-0 inline-flex overflow-hidden text-gop-gold"
          style={{ width: `${pct}%` }}
        >
          {row}
        </span>
      </span>
      <span className="text-[13px] leading-4 text-white/75 tabular-nums">{label}/5</span>
    </span>
  );
}

/** Neutral tag plaque — a Link to its taxonomy listing when it has an href,
 *  else a plain span. Sits above the card's overlay link (callers wrap it in
 *  z-[2]), so a tag click filters the library instead of opening the prompt. */
function TagChip({ label, href }: { label: string; href?: string }) {
  const cls =
    "inline-flex h-[22px] items-center rounded-gop-sm bg-white/10 px-1.5 text-[13px] leading-4 text-white/90";
  return href ? (
    <Link href={href} className={`${cls} no-underline transition-colors hover:bg-white/20`}>
      {label}
    </Link>
  ) : (
    <span className={cls}>{label}</span>
  );
}

type CardTag = { label: string; href?: string };

/** Chip row: brand model chip(s) first, then category / subcategory / role
 *  plaques (Figma 1602:4710). Every chip is a real link to its taxonomy
 *  listing — layered above the card's overlay link so a tag click filters
 *  the library while a click anywhere else opens the prompt. */
export function CardTags({ prompt, maxTools = 1 }: { prompt: Prompt; maxTools?: number }) {
  const tools = (prompt.tools ?? []).slice(0, maxTools);
  const tags: CardTag[] = [];
  if (prompt.category) tags.push({ label: prompt.category.name, href: `/prompt-library/category/${prompt.category.slug}` });
  if (prompt.subcategory) tags.push({ label: prompt.subcategory.name, href: `/prompt-library/category/${prompt.subcategory.slug}` });
  if (prompt.role) tags.push({ label: prompt.role, href: prompt.roleSlug ? `/prompt-library/for/${prompt.roleSlug}` : undefined });
  if (tools.length === 0 && tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tools.map((tool) => (
        <ToolChip key={tool.id} webName={tool.webName ?? tool.name} slug={tool.slug} size="sm" />
      ))}
      {tags.slice(0, 3).map((t) => (
        <TagChip key={t.label} label={t.label} href={t.href} />
      ))}
    </div>
  );
}

/** Stats footer: like + bookmark (interactive), views pill, share
 *  (Figma 1602:4716). Rendered above the card's stretched link. */
export function CardStatsRow({ prompt }: { prompt: Prompt }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <LikeButton slug={prompt.slug} baseLikes={prompt.likes} />
        <BookmarkButton slug={prompt.slug} baseCount={prompt.bookmarks} />
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 text-gop-caption tabular-nums text-white/60">
          <Eye size={13} strokeWidth={1.7} />
          {formatCount(prompt.views)}
        </span>
      </div>
      <ShareButton slug={prompt.slug} title={prompt.title} />
    </div>
  );
}
