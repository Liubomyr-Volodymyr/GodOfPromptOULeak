import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

/**
 * CtaButton — the site CTA primitive, ported 1:1 from the design system
 * (gop-web-temp Button + Figma 10152:9919). Pill-shaped, three variants and
 * three sizes. This is the brand marketing CTA — distinct from the shadcn
 * `ui/button` used for app chrome.
 *
 *   <CtaButton variant="gold" size="lg" href="/complete-ai-bundle">Get Lifetime Access</CtaButton>
 *   <CtaButton variant="primary" size="lg" href="/prompt-library">Explore Prompts</CtaButton>
 *
 * Brand rule: any CTA to /complete-ai-bundle or /products says "Get Lifetime
 * Access" and uses variant="gold".
 */

type Variant = "gold" | "primary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-sans tracking-[-0.3px] whitespace-nowrap no-underline " +
  "transition-[background,color,border-color,box-shadow,transform,filter] duration-[180ms] ease-out active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold focus-visible:ring-offset-2";

const SIZE: Record<Size, string> = {
  sm: "h-10 px-4 text-[14px] font-medium",
  md: "h-11 px-[18px] text-[16px] font-medium",
  lg: "h-[52px] px-[26px] text-[17px] font-semibold",
};

// Composed from the design-system tokens in globals.css (Figma 516-341),
// not raw hex: gop-gold / gop-gradient-gold, gop-menu-avatar-bg ("button bg"),
// gop-dark, gop-page, gop-surface-alt.
const VARIANT: Record<Variant, string> = {
  // gradient gold + 1.4px gold ring (the brand "highlighted" pill)
  gold: "text-gop-dark !font-semibold border-white/50 shadow-[0_0_0_1.4px_var(--color-gop-gold)] hover:brightness-[1.03]",
  // dark near-black pill — the canonical primary CTA
  primary: "bg-[var(--color-gop-menu-avatar-bg)] text-gop-page border-white/24 shadow-[0_0_0_1px_#000] hover:bg-gop-dark-hover",
  // soft grey, low-priority
  ghost: "bg-gop-surface-alt text-gop-dark border-gop-ink-hairline hover:bg-gop-ink-hairline",
};

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  /** Render a real <button> (e.g. form submit) when there's no href. */
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  iconAfter?: ReactNode;
  iconBefore?: ReactNode;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

export default function CtaButton({
  variant = "primary",
  size = "lg",
  href,
  type,
  onClick,
  disabled,
  iconAfter,
  iconBefore,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = [BASE, SIZE[size], VARIANT[variant], disabled ? "opacity-70 pointer-events-none" : "", className]
    .filter(Boolean)
    .join(" ");
  // gold uses the shared gradient token (matches the headline pill exactly)
  const style = variant === "gold" ? { background: "var(--gop-gradient-gold)" } : undefined;
  const inner = (
    <>
      {iconBefore && <span className="inline-flex h-5 w-5 items-center justify-center">{iconBefore}</span>}
      <span>{children}</span>
      {iconAfter && <span className="inline-flex h-5 w-5 items-center justify-center">{iconAfter}</span>}
    </>
  );

  // No href → a real button (form submit / onClick). Keeps every CTA on the
  // one DS primitive instead of hand-rolled pills.
  if (!href) {
    return (
      <button type={type ?? "button"} onClick={onClick} disabled={disabled} className={cls} style={style} {...rest}>
        {inner}
      </button>
    );
  }
  if (!href.startsWith("http")) {
    return (
      <Link href={href} className={cls} style={style} {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} {...rest}>
      {inner}
    </a>
  );
}
