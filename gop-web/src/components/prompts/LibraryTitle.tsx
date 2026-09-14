import { getToolBrand } from "@/lib/tool-brand";
import { qualifier } from "@/lib/seo/pseo";
import type { LibrarySelection } from "@/lib/library-selection";

/**
 * LibraryTitle — the page's single <h1> (Figma 1617:13021).
 *
 * Hub: a fixed light-weight phrase + italic semibold accent
 *   "The #1 Most Powerful *Open Prompt Library*"
 *
 * Filtered pages: assembled from the active selection —
 *   "{total} {tool} {format} {category?} [AI] Prompts for {audience|category}"
 *   ("AI" drops out once a model or format is picked — see qualifier())
 * in the same type scale so every library page shares the hero voice.
 */
export default function LibraryTitle({
  total,
  selection,
  heading,
  headingAccent,
}: {
  total: number;
  selection: LibrarySelection;
  /** Override the assembled title with a fixed phrase (the hub's SEO h1). */
  heading?: string;
  /** Italic semibold tail appended to `heading` (Figma 1617:23110). */
  headingAccent?: string;
}) {
  if (heading) {
    return (
      <h1 className="m-0 text-center text-[clamp(24px,3vw,32px)] font-light leading-[1.1] tracking-[-0.01em] text-[#1B1A1A]">
        {heading}
        {headingAccent && (
          <>
            {" "}
            <em className="font-semibold italic">{headingAccent}</em>
          </>
        )}
      </h1>
    );
  }

  const tool = selection.tool;
  const format = selection.format;
  const cat = selection.subcategory ?? selection.category;
  const audience = selection.role;

  // "for {X}": audience if present, else the category (single-category page).
  const forTarget = audience ?? cat ?? null;
  // Category becomes an adjective ("Marketing AI Prompts for Lawyers") only
  // when an audience is the for-target.
  const catAdj = audience ? cat : null;

  const Brand = tool ? getToolBrand(tool.name).Icon : null;

  return (
    <h1 className="m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[clamp(22px,2.6vw,28px)] font-light leading-[1.2] tracking-[-0.01em] text-[#1B1A1A]">
      <span className="tabular-nums">{total.toLocaleString()}</span>
      {tool && Brand && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-gop-ink">
          <span aria-hidden className="inline-flex"><Brand size={24} /></span>
          {tool.name}
        </span>
      )}
      {format && <span className="font-semibold text-gop-ink">{format.name}</span>}
      {catAdj && <span className="font-semibold text-gop-ink">{catAdj.name}</span>}
      {/* "AI" is only the neutral stand-in: a picked model already says it's
          AI ("ChatGPT Prompts"), and a picked format owns the slot above.
          Mirrors qualifier() in lib/seo/pseo.ts. */}
      <span>{qualifier(tool ?? null, format ?? null) ? <>AI&nbsp;Prompts</> : "Prompts"}</span>
      {forTarget && (
        <>
          <span className="text-gop-ink-muted">for</span>
          <em className="font-semibold italic text-gop-ink">{forTarget.name}</em>
        </>
      )}
    </h1>
  );
}
