import type { ElementType, ReactNode } from "react";

/**
 * Typography primitives — semantic wrappers around the Figma 516-341
 * type scale tokens. Every text style on the site should flow through
 * <Heading> or <Text> so changes propagate from a single place and
 * no page hand-writes `text-[44px] leading-[48px] tracking-tight`.
 *
 *   <Heading level={1}>Master AI prompts.</Heading>
 *   <Heading level={3} as="h2">Library</Heading>
 *   <Text variant="body-lg">Lead paragraph…</Text>
 *   <Text variant="caption">Last updated 3d ago</Text>
 *   <Text variant="code">prompt_body</Text>
 *
 * Notes:
 *   - Levels 1–7 map to the bold display scale (h1=96px → h7=32px).
 *   - "as" overrides the rendered tag for semantic correctness; visual
 *     weight comes from the `level` prop.
 *   - Default color is `text-gop-ink`; pass `muted` / `soft` to drop
 *     a step on the contrast ladder.
 *   - For responsive scale-down (h1 = 96px on desktop, 56px on phone),
 *     use the responsive prop — it applies `max-[640px]:text-gop-h{3}`
 *     etc. automatically.
 */

type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Tone = "ink" | "muted" | "soft" | "on-dark" | "on-dark-muted";

const TONE_CLASSES: Record<Tone, string> = {
  "ink":           "text-gop-ink",
  "muted":         "text-gop-ink-muted",
  "soft":          "text-gop-ink-soft",
  "on-dark":       "text-gop-on-dark",
  "on-dark-muted": "text-gop-on-dark-muted",
};

const HEADING_CLASSES: Record<Level, string> = {
  1: "text-gop-h1",
  2: "text-gop-h2",
  3: "text-gop-h3",
  4: "text-gop-h4",
  5: "text-gop-h5",
  6: "text-gop-h6",
  7: "text-gop-h7",
};

/** Responsive scale-down — desktop level → mobile level (drops 3 steps,
 * floored at h7). Override with `responsive={false}` for fixed scales. */
const RESPONSIVE_DOWN: Record<Level, Level> = {
  1: 4,   // 96 → 56
  2: 5,   // 80 → 48
  3: 5,   // 64 → 48
  4: 6,   // 56 → 40
  5: 6,   // 48 → 40
  6: 7,   // 40 → 32
  7: 7,   // 32 → 32 (no further drop)
};

const RESPONSIVE_CLASSES: Record<Level, string> = {
  1: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[1]]}`,
  2: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[2]]}`,
  3: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[3]]}`,
  4: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[4]]}`,
  5: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[5]]}`,
  6: `max-[640px]:${HEADING_CLASSES[RESPONSIVE_DOWN[6]]}`,
  7: "",
};

type HeadingProps = {
  level: Level;
  as?: ElementType;
  tone?: Tone;
  responsive?: boolean;
  className?: string;
  children: ReactNode;
};

export function Heading({
  level,
  as,
  tone = "ink",
  responsive = true,
  className = "",
  children,
}: HeadingProps) {
  const Tag = (as ?? (`h${level}` as ElementType)) as ElementType;
  const cls = [
    "m-0 font-sans",
    HEADING_CLASSES[level],
    responsive && RESPONSIVE_CLASSES[level],
    TONE_CLASSES[tone],
    className,
  ].filter(Boolean).join(" ");
  return <Tag className={cls}>{children}</Tag>;
}

/* ── Body / subtitle / caption / code ─────────────────────────────── */

type TextVariant =
  | "subtitle-lg" | "subtitle" | "subtitle-sm"
  | "body-lg"    | "body"     | "body-sm"
  | "caption"
  | "code";

const TEXT_CLASSES: Record<TextVariant, string> = {
  "subtitle-lg": "text-gop-subtitle-lg",
  "subtitle":    "text-gop-subtitle",
  "subtitle-sm": "text-gop-subtitle-sm",
  "body-lg":     "text-gop-body-lg",
  "body":        "text-gop-body",
  "body-sm":     "text-gop-body-sm",
  "caption":     "text-gop-caption",
  "code":        "text-gop-code font-mono",
};

type TextProps = {
  variant?: TextVariant;
  as?: ElementType;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Text({
  variant = "body",
  as = "p",
  tone = "ink",
  className = "",
  children,
}: TextProps) {
  const Tag = as as ElementType;
  const cls = [
    "m-0 font-sans",
    TEXT_CLASSES[variant],
    TONE_CLASSES[tone],
    className,
  ].filter(Boolean).join(" ");
  return <Tag className={cls}>{children}</Tag>;
}
