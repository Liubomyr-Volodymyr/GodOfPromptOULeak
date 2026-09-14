import type { SVGProps, ReactNode } from "react";
import paths from "./paths";

/**
 * Icon — unified SVG icon primitive.
 *
 *   <Icon name="copy" />              defaults: 20px, currentColor
 *   <Icon name="check" size={24} />
 *   <Icon name="eye" className="prompt-card__eye" />
 *
 * Two icon styles in the registry:
 *
 *   Hand-coded (stroke-based outlines)
 *     Path entries have only `d` attrs — no stroke/strokeWidth.
 *     The Icon root applies stroke="currentColor", strokeWidth=1.8,
 *     rounded line caps. Pass `color` (via CSS) to recolor.
 *
 *   Figma-exported (selfStyled: true)
 *     Every path/polyline/etc. carries its own stroke, strokeWidth,
 *     fill from the Figma file. The Icon root sets fill="none" but
 *     never overrides per-path attrs. Multi-color icons (Claude,
 *     model glyphs) render with their brand colors intact.
 *
 * To add an icon, append an entry in ./paths.tsx — never embed
 * raw <svg> in a feature component. For AI tool brand icons
 * (ChatGPT, Claude, Cursor, …) use @lobehub/icons instead.
 */

type IconDef = {
  paths: ReactNode;
  viewBox?: string;
  fill?: string;
  selfStyled?: boolean;
};

export type IconName = keyof typeof paths;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  title?: string;
};

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className = "",
  title,
  ...rest
}: IconProps) {
  const def = (paths as Record<string, IconDef>)[name];
  if (!def) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`<Icon name="${name}" /> — unknown icon name.`);
    }
    return null;
  }

  const {
    paths: pathData,
    viewBox = "0 0 24 24",
    fill = "none",
    selfStyled = false,
  } = def;

  // Figma-exported icons own their styling entirely; hand-coded icons
  // need the root to provide outline defaults so just the `d` attrs
  // produce a recognisable shape.
  const rootStroke      = selfStyled ? undefined : (fill === "none" ? "currentColor" : undefined);
  const rootStrokeWidth = selfStyled ? undefined : (fill === "none" ? strokeWidth : undefined);
  const rootLineCap     = selfStyled ? undefined : ("round" as const);
  const rootLineJoin    = selfStyled ? undefined : ("round" as const);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={rootStroke}
      strokeWidth={rootStrokeWidth}
      strokeLinecap={rootLineCap}
      strokeLinejoin={rootLineJoin}
      className={`gop-icon ${className}`.trim()}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      {pathData}
    </svg>
  );
}
