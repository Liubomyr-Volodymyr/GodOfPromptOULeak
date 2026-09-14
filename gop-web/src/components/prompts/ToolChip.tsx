import Link from "@/components/ui/Link";
import { getToolBrand } from "@/lib/tool-brand";

/**
 * ToolChip — brand-color model pill. Figma 568-1195 "PromptCardModels".
 *
 *   <ToolChip webName="ChatGPT" slug="chatgpt" />
 *   <ToolChip webName="Claude"  slug="claude" size="md" />
 *   <ToolChip webName="Cursor"  interactive={false} />
 *
 * Three sizes:
 *   sm  22px tall — canonical (cards, eyebrow row)
 *   md  32px tall — prompt-detail "Recommended tools" row
 *   lg  40px tall — design system gallery
 *
 * Brand colors live in src/lib/tool-brand.ts. Lobehub mono icons are
 * pulled per-brand for tight tree-shaking.
 */
type Size = "sm" | "md" | "lg";

type Props = {
  webName: string;
  slug?: string;
  size?: Size;
  interactive?: boolean;
  /** pill shape (rounded-full) — used in the browse bar so model chips
   *  sit flush with the neutral pill chips. */
  pill?: boolean;
  /** current taxonomy page — draws the selection ring. */
  selected?: boolean;
  /** override the default /tool/{slug} link target (e.g. a combo page). */
  href?: string;
  /** open the taxonomy page in a new tab (prompt-page strip behaviour). */
  newTab?: boolean;
  className?: string;
};

// sm matches the design system tag (568-1600): h22, rounded-lg, px6, gap4.
const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-[22px] gap-1 rounded-gop-sm px-1.5 text-[13px] leading-4",
  md: "h-8 gap-1.5 rounded-[10px] px-3 text-gop-sm leading-5",
  lg: "h-10 gap-2 rounded-xl px-3.5 text-gop-md leading-6",
};

const ICON_SIZES: Record<Size, number> = { sm: 16, md: 18, lg: 22 };

export default function ToolChip({
  webName,
  slug,
  size = "sm",
  interactive = true,
  pill = false,
  selected = false,
  href,
  newTab = false,
  className = "",
}: Props) {
  const brand = getToolBrand(webName);
  const { Icon } = brand;

  const cls = [
    "inline-flex items-center justify-center whitespace-nowrap select-none",
    "font-sans font-medium tracking-tight no-underline border-0 overflow-hidden",
    // shares the action-button language: gop motion + press feedback
    "transition-[filter,box-shadow,transform] duration-150 [transition-timing-function:var(--gop-ease-standard)]",
    brand.bg,
    brand.fg,
    SIZE_CLASSES[size],
    pill ? "!rounded-full" : "",
    interactive && slug
      ? "cursor-pointer hover:brightness-[1.06] active:translate-y-px active:brightness-95"
      : "cursor-default",
    selected ? "ring-2 ring-gop-ink ring-offset-2 ring-offset-white shadow-sm" : "",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-accent-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    className,
  ].join(" ");

  const inner = (
    <>
      <span className="inline-flex shrink-0 items-center justify-center">
        <Icon size={ICON_SIZES[size]} />
      </span>
      <span>{webName}</span>
    </>
  );

  const target = href ?? (slug ? `/prompt-library/tool/${slug}` : undefined);
  if (interactive && target) {
    return (
      <Link href={target} className={cls} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
        {inner}
      </Link>
    );
  }

  return <span className={cls}>{inner}</span>;
}
