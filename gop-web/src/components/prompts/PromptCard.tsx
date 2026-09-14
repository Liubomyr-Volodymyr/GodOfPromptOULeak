import Link from "@/components/ui/Link";
import CardHero from "./CardHero";
import { PopularBadge, CardStars, CardTags, CardStatsRow, isPopular } from "./CardMeta";
import { firstSymbol } from "@/lib/emoji";
import type { Prompt } from "@/lib/api";

/**
 * PromptCard — a single prompt tile (Figma 1617:13068 grid), three variants:
 *
 *   "standard"  dark card: badge/stars, title, chips, description, stats
 *   "code"      standard + an inset mono preview of the prompt body with a
 *               bottom fade (the tall cards in the hub mosaic)
 *   "photo"     full-bleed example-output image, scrim, overlaid title/chips
 *
 * All variants: #242223 surface, r-20, whole-card stretched <Link>
 * (SEO-crawlable + opens the prompt modal); interactive plaques (chips,
 * reactions) sit above the overlay. Default variant is "standard" so
 * existing `<PromptCard prompt={p} />` call sites keep working.
 */
export type PromptCardVariant = "standard" | "code" | "photo";

const SURFACE = [
  "group relative flex flex-col overflow-hidden rounded-[20px]",
  "border border-white/[0.08] bg-gop-card text-white",
  "transition-[transform,box-shadow,border-color] duration-200 ease-out",
  "hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_16px_34px_-14px_rgba(0,0,0,0.6)]",
  "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gop-accent-yellow",
].join(" ");

export default function PromptCard({
  prompt,
  variant = "standard",
  className = "",
}: {
  prompt: Prompt;
  variant?: PromptCardVariant;
  className?: string;
}) {
  if (variant === "photo" && prompt.heroImage) {
    return <PhotoCard prompt={prompt} className={className} />;
  }
  return <TextCard prompt={prompt} code={variant === "code"} className={className} />;
}

/* ── shared bits ──────────────────────────────────────────────────── */

function CardTitle({ prompt, clamp = 2 }: { prompt: Prompt; clamp?: 1 | 2 }) {
  const symbol = firstSymbol(prompt.icon);
  return (
    <h3 className="m-0 flex items-start gap-2 text-[19px] font-medium leading-6 tracking-[-0.01em] text-white">
      {symbol && <span aria-hidden className="shrink-0 leading-6">{symbol}</span>}
      <span className={clamp === 1 ? "line-clamp-1" : "line-clamp-2"}>{prompt.title}</span>
    </h3>
  );
}

/** True when the badge row has anything to show (Popular badge or a real
 *  rating) — used to drop the row entirely instead of leaving dead space. */
function hasBadges(prompt: Prompt): boolean {
  return isPopular(prompt.views) || prompt.rating != null;
}

function BadgeRow({ prompt }: { prompt: Prompt }) {
  return (
    <div className="flex min-h-5 items-center gap-3">
      {isPopular(prompt.views) && <PopularBadge />}
      <CardStars rating={prompt.rating} />
    </div>
  );
}

/** Whole-card link → the prompt page (modal via intercepting route). */
function Overlay({ prompt }: { prompt: Prompt }) {
  return (
    <Link
      href={`/prompt-library/${prompt.slug}`}
      aria-label={prompt.title}
      className="absolute inset-0 z-[1] outline-none"
    />
  );
}

/* ── standard / code (Figma 1602:4702 · 1184:2793) ────────────────── */

function TextCard({ prompt, code, className }: { prompt: Prompt; code: boolean; className?: string }) {
  const showCode = code && !!prompt.body;
  const showBadges = hasBadges(prompt);
  return (
    <article className={`${SURFACE} gap-4 p-4 ${className}`}>
      <Overlay prompt={prompt} />

      {/* The code preview absorbs the spare height on tall cards; on
          standard cards the lower block stretches instead. The whole top
          block is dropped when there's neither code nor a badge/rating, so
          plain cards don't carry an empty strip. */}
      {(showCode || showBadges) && (
        <div className={`relative flex min-h-0 flex-col gap-3 ${showCode ? "flex-1" : ""}`}>
          {showBadges && <BadgeRow prompt={prompt} />}
          {showCode && <CodePreview body={prompt.body!} />}
        </div>
      )}

      <div className={`relative flex flex-col gap-3 ${showCode ? "" : "min-h-0 flex-1"}`}>
        <CardTitle prompt={prompt} />
        <div className="relative z-[2] w-fit">
          <CardTags prompt={prompt} />
        </div>
        {prompt.description && (
          <p className="m-0 text-[14px] leading-5 text-white/60 line-clamp-2">{prompt.description}</p>
        )}
        <div className="relative z-[2] mt-auto pt-1">
          <CardStatsRow prompt={prompt} />
        </div>
      </div>
    </article>
  );
}

/** Inset mono preview of the prompt body with a fade-out (Figma 1602:4762). */
function CodePreview({ body }: { body: string }) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px] bg-white/[0.08] p-4">
      <pre className="m-0 max-h-[200px] overflow-hidden whitespace-pre-wrap break-words font-mono text-[12px] leading-[22px] text-white/50 sm:h-full sm:max-h-none">
        {body.slice(0, 900)}
      </pre>
      {/* bottom fade (Figma Background Shape) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-[16px]"
        style={{ background: "linear-gradient(180deg, rgba(45,42,43,0) 0%, #2a2829 92%)" }}
      />
    </div>
  );
}

/* ── photo (Figma 1442:4403) ──────────────────────────────────────── */

function PhotoCard({ prompt, className }: { prompt: Prompt; className?: string }) {
  return (
    <article className={`${SURFACE} min-h-[220px] justify-between p-4 ${className}`}>
      {/* full-bleed image + legibility scrim (Figma Rectangle 40359) */}
      <CardHero src={prompt.heroImage!} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(16,15,15,0.12) 30%, rgba(16,15,15,0.78) 100%)" }}
      />
      <Overlay prompt={prompt} />

      <div className="relative flex min-h-5 items-center">
        {isPopular(prompt.views) && <PopularBadge />}
      </div>

      <div className="relative mt-auto flex flex-col gap-3 pt-6">
        <CardStars rating={prompt.rating} />
        <CardTitle prompt={prompt} clamp={1} />
        <div className="relative z-[2] w-fit">
          <CardTags prompt={prompt} />
        </div>
        <div className="relative z-[2] pt-1">
          <CardStatsRow prompt={prompt} />
        </div>
      </div>
    </article>
  );
}
