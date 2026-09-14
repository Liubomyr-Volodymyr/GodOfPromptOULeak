import { getRootCategories, getPromptedAudiences, mintableTools } from "@/lib/categories";
import ChipRotator, { type Chip } from "@/components/blocks/ChipRotator";

/**
 * CategoryChips — the rotating rail of links into filtered prompt-library
 * pages (Figma 2033:17264). Reads the taxonomy snapshot, where every term is
 * guaranteed ≥1 prompt — a browse chip must never link to a dead page:
 *   tools      → /prompt-library/tool/{slug}
 *   categories → /prompt-library/category/{slug}
 *   audiences  → /prompt-library/for/{slug}
 * The full (prompted) pool is also emitted as visually-hidden crawlable links
 * so every populated taxonomy page stays linked from the homepage.
 */
const CANONICAL_TOOL_BRAND: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
  deepseek: "DeepSeek",
  midjourney: "Midjourney",
  "nano-banana": "Nano Banana",
};

export default async function CategoryChips() {
  // Snapshot-backed and synchronous: no per-term probe requests at build time.
  // Tools use the substance floor (a chip promising "browse by tool" should
  // land on a full grid, not the single prompt that asana or notion have).
  const tools = mintableTools();
  const categories = getRootCategories();
  const audiences = getPromptedAudiences();

  const toolChips: Chip[] = tools.map((t) => ({
    key: `tool:${t.slug}`,
    label: t.name,
    href: `/prompt-library/tool/${t.slug}`,
    // Only the canonical library models have a brand glyph; the rest render text-only.
    brand: CANONICAL_TOOL_BRAND[t.slug],
  }));
  const categoryChips: Chip[] = categories.map((c) => ({
    key: `cat:${c.slug}`,
    label: c.name,
    href: `/prompt-library/category/${c.slug}`,
  }));
  const audienceChips: Chip[] = audiences.map((r) => ({
    key: `aud:${r.slug}`,
    label: r.name,
    href: `/prompt-library/for/${r.slug}`,
  }));

  // Interleave kinds so the rotator mixes tools/categories/audiences instead
  // of showing a run of one kind. Deterministic order (no hydration mismatch).
  const pool = interleave([toolChips, categoryChips, audienceChips]);
  if (!pool.length) return null;

  return (
    <nav aria-label="Browse prompts by category or model" className="mx-auto w-full max-w-[1280px] px-6 py-3 max-[640px]:px-4">
      <ChipRotator pool={pool} />

      {/* Full pool as crawlable links (every taxonomy page linked from home). */}
      <ul className="sr-only">
        {pool.map((c) => (
          <li key={c.key}>
            <a href={c.href}>{c.label} prompts</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Round-robin merge so kinds alternate; preserves each list's own order. */
function interleave(lists: Chip[][]): Chip[] {
  const out: Chip[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}
