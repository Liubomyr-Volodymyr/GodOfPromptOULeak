import Link from "@/components/ui/Link";
import { Star } from "lucide-react";
import { getToolBrand, hasToolBrand } from "@/lib/tool-brand";
import type { Tool } from "@/lib/api";

/**
 * ToolDirectoryCard — one entry in the AI Tools directory (Figma 1887:9687):
 * brand thumbnail · name · blurb · rating. Everything is real backend data —
 * the thumbnail falls back to an initial tile when we don't have the logo, and
 * the rating renders ONLY when the backend ships `rating`/`reviewCount` (never
 * a fabricated "4.9"). Links to the tool's page.
 */
export default function ToolDirectoryCard({
  tool,
  rating,
  reviewCount,
}: {
  tool: Tool;
  // Not on the API yet → undefined → the rating row is hidden.
  rating?: number | null;
  reviewCount?: number | null;
}) {
  const brand = getToolBrand(tool.name);
  const known = hasToolBrand(tool.name);
  const showRating = typeof rating === "number" && rating > 0;

  return (
    <Link
      href={`/prompt-library/tool/${tool.slug}`}
      className="group flex gap-4 rounded-gop-lg border border-gop-ink-hairline bg-white p-4 no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-gop-ink-faint hover:shadow-[0_10px_30px_-16px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-accent-yellow motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Thumbnail — brand tile when we have the logo, else an initial tile */}
      {tool.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tool.heroImageUrl}
          alt=""
          className="h-[76px] w-[76px] shrink-0 rounded-gop-md object-cover"
        />
      ) : known ? (
        <span className={`grid h-[76px] w-[76px] shrink-0 place-items-center rounded-gop-md ${brand.bg} ${brand.fg}`}>
          <brand.Icon size={34} />
        </span>
      ) : (
        <span className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-gop-md bg-gop-ink-wash text-[26px] font-semibold text-gop-ink-soft">
          {tool.name.charAt(0)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="m-0 truncate text-[17px] font-semibold text-gop-ink group-hover:text-gop-ink">
          {tool.name}
        </h3>
        {tool.description && (
          <p className="mt-1 mb-0 line-clamp-2 text-[14px] leading-5 text-gop-ink-muted">{tool.description}</p>
        )}

        {showRating ? (
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-gop-ink-muted">
            <span className="font-medium text-gop-ink">{rating!.toFixed(1)}</span>
            <Star size={13} className="fill-gop-accent-yellow text-gop-accent-yellow" aria-hidden />
            {typeof reviewCount === "number" && <span>({reviewCount.toLocaleString("en-US")})</span>}
          </div>
        ) : (
          tool.type && (
            <span className="mt-2 inline-flex items-center rounded-full bg-gop-ink-wash px-2.5 py-0.5 text-[12px] font-medium text-gop-ink-soft">
              {typeLabel(tool.type)}
            </span>
          )
        )}
      </div>
    </Link>
  );
}

const TYPE_LABELS: Record<string, string> = {
  llm: "LLM",
  "image-ai": "Image",
  "video-ai": "Video",
  "audio-ai": "Audio",
  "coding-ai": "Coding",
  "research-ai": "Research",
  "3d-ai": "3D",
  "automation-saas": "Automation",
  "productivity-saas": "Productivity",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "AI Tool";
}
