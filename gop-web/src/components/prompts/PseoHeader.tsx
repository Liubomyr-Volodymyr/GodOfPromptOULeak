import { getToolBrand } from "@/lib/tool-brand";
import { pseoBits, qualifier } from "@/lib/seo/pseo";
import type { LibrarySelection } from "@/lib/library-selection";

/**
 * PseoHeader — the combinatoric page's single <h1> (Figma 1434:16251).
 * "525 Grok Prompts for Marketing": live count in Roboto Light,
 * tool as brand glyph + semibold italic, connector text light, target
 * (audience or category) semibold italic. The slot before "Prompts" comes
 * from qualifier() in lib/seo/pseo.ts: the format name when one is selected,
 * NOTHING when a model is picked (the model already says it's AI), else the
 * neutral "AI". Facets absent from the route drop out, so every combination
 * stays grammatical (mirrors pseoPhrase exactly):
 *
 *   {category}            → "1,240 AI Prompts for Marketing"
 *   {tool}                → "525 Grok Prompts"
 *   {category, role}      → "310 Marketing AI Prompts for Lawyers"
 *   {format}              → "1,240 Image Prompts"
 *   {tool, format, role}  → "1,982 ChatGPT Text Prompts for Solopreneurs"
 *   {format, role}        → "980 Text Prompts for Lawyers"
 *   {category, format, role} → "35 Marketing Image Prompts for Agencies"
 */

const EM = "font-semibold italic tracking-[-0.015em]";

export default function PseoHeader({
  total,
  selection,
}: {
  // `null` when a real total isn't available (e.g. output-type pages whose
  // count the backend can't compute) — the count is OMITTED rather than
  // showing a fabricated fetch-limit. Never render a number we can't back.
  total: number | null;
  selection: LibrarySelection;
}) {
  const { tool, format, catAdj, target } = pseoBits(selection);
  const Brand = tool ? getToolBrand(tool.name).Icon : null;

  return (
    <h1 className="m-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[clamp(24px,2.4vw,32px)] font-light leading-[1.1] tracking-[-0.03em] text-gop-ink">
      {total != null && <span className="tabular-nums">{total.toLocaleString("en-US")}</span>}
      {tool && (
        <span className={`inline-flex items-center gap-1.5 ${EM}`}>
          {Brand && (
            <span aria-hidden className="inline-flex not-italic">
              <Brand size={30} />
            </span>
          )}
          {tool.name}
        </span>
      )}
      {catAdj && <span className={EM}>{catAdj.name}</span>}
      {/* Qualifier before "Prompts" — see qualifier() in lib/seo/pseo.ts:
          the format name (emphasised) when one is selected, nothing when a
          model is picked ("ChatGPT Prompts", never "ChatGPT AI Prompts"),
          else the neutral "AI". One flex item so it reads tight. */}
      <span>
        {format ? <span className={EM}>{format.name}</span> : qualifier(tool, format)} Prompts
      </span>
      {target && (
        <>
          <span>for</span>
          <span className={EM}>{target.name}</span>
        </>
      )}
    </h1>
  );
}
