/**
 * Taxonomy graph — the relationship engine behind the library's adaptive
 * browse. The library is a graph: a prompt links to a Category, a Role, a
 * Tool, and an output Type; combos are where two axis-nodes meet. The
 * browse "adapts" by only offering facets that have a valid edge to the
 * current selection.
 *
 * Some edges are FACTUAL and known today (a tool's output capability —
 * Claude is text-only, Midjourney is image-only), so those constraints
 * work now. Edges that depend on which prompts exist (role×tool,
 * category×tool …) need per-prompt tags from the backend; until those land
 * the engine is permissive on those pairs (everything enabled) rather than
 * inventing relationships.
 */

export type Axis = "tool" | "role" | "category" | "type";

export type Selection = Partial<Record<Axis, string>>; // axis -> slug

/* ── Factual edge: which output types each tool can produce ─────────── */

type Modality = "text" | "image";

/**
 * Which output modalities each tool can actually produce.
 *
 * Derived from the backend's own `tool.type` classification
 * (GET /api/library/tools) rather than a hand-kept list — the catalogue has
 * 50 tools and the previous map covered 7, so 43 tools blocked nothing and a
 * user could ask Suno or Runway for "text prompts".
 *
 * TYPE_MODALITIES maps each backend type to what it emits; MULTIMODAL_LLMS
 * is the one thing `type` can't express (every chat model is typed "llm",
 * but only some also generate images).
 *
 * Refresh TOOL_TYPE from the API when the catalogue grows; unknown slugs stay
 * permissive so a new tool is never wrongly blocked.
 */
const TYPE_MODALITIES: Record<string, Modality[]> = {
  llm: ["text"],                 // + image for MULTIMODAL_LLMS below
  "coding-ai": ["text"],
  "research-ai": ["text"],
  "automation-saas": ["text"],
  "productivity-saas": ["text"],
  "image-ai": ["image"],
  // Emit neither text nor image — every output type is blocked for these.
  "video-ai": [],
  "audio-ai": [],
  "3d-ai": [],
};

/** Chat models that ALSO generate images (backend types them all "llm"). */
const MULTIMODAL_LLMS = new Set(["chatgpt", "gemini", "grok"]);

/** Tools the backend leaves untyped but whose modality is not in doubt. */
const SLUG_MODALITIES: Record<string, Modality[]> = {
  midjourney: ["image"],
  "nano-banana": ["image"],
};

const TOOL_TYPE: Record<string, string> = {
  "airtable": "productivity-saas",
  "asana": "productivity-saas",
  "bolt": "coding-ai",
  "cartesia": "audio-ai",
  "chatgpt": "llm",
  "claude": "llm",
  "claude-code": "coding-ai",
  "cursor": "coding-ai",
  "dall-e": "image-ai",
  "deepseek": "llm",
  "elevenlabs": "audio-ai",
  "exa": "research-ai",
  "flux": "image-ai",
  "gemini": "llm",
  "grok": "llm",
  "higgsfield": "video-ai",
  "ideogram": "image-ai",
  "kling": "video-ai",
  "krea": "image-ai",
  "langchain": "automation-saas",
  "linear": "productivity-saas",
  "lovable": "coding-ai",
  "luma-genie": "3d-ai",
  "make": "automation-saas",
  "meshy": "3d-ai",
  "midjourney": "unknown",
  "mistral": "llm",
  "n8n": "automation-saas",
  "nano-banana": "unknown",
  "notebooklm": "research-ai",
  "notion": "productivity-saas",
  "obsidian": "productivity-saas",
  "perplexity": "research-ai",
  "phind": "research-ai",
  "pika": "video-ai",
  "pipedream": "automation-saas",
  "replit": "coding-ai",
  "rodin": "3d-ai",
  "runway": "video-ai",
  "slack": "productivity-saas",
  "sora": "video-ai",
  "spline-ai": "3d-ai",
  "suno": "audio-ai",
  "tripo": "3d-ai",
  "udio": "audio-ai",
  "v0": "coding-ai",
  "veo": "video-ai",
  "windsurf": "coding-ai",
  "you-com": "research-ai",
  "zapier": "automation-saas",
};

/** Output-type slug ↔ modality / id. */
const TYPE_BY_SLUG: Record<string, { id: number; modality: Modality }> = {
  text: { id: 1, modality: "text" },
  image: { id: 2, modality: "image" },
  // `code` and `presentation` are text-modality: a token-emitting model makes
  // them, an image model does not. Absent from this map they fell through to
  // the permissive default, so Midjourney would have offered "Code".
  code: { id: 3, modality: "text" },
  presentation: { id: 4, modality: "text" },
};

/** The modalities a tool can produce, or null when we genuinely don't know. */
function modalitiesOf(toolSlug: string): Modality[] | null {
  const explicit = SLUG_MODALITIES[toolSlug];
  if (explicit) return explicit;
  const type = TOOL_TYPE[toolSlug];
  if (!type) return null; // unknown tool → permissive
  const base = TYPE_MODALITIES[type];
  if (!base) return null;
  if (type === "llm" && MULTIMODAL_LLMS.has(toolSlug)) return ["text", "image"];
  return base;
}

function toolDoes(toolSlug: string, modality: Modality): boolean {
  const m = modalitiesOf(toolSlug);
  return m ? m.includes(modality) : true; // unknown tool → permissive
}

/* ── Constraint engine ──────────────────────────────────────────────── */

/**
 * Is a candidate facet still reachable given the current selection?
 * Returns false only when a KNOWN edge rules it out (so the UI can dim it);
 * defaults to true wherever the relationship isn't yet data-backed.
 */
export function facetEnabled(axis: Axis, slug: string, selection: Selection): boolean {
  // Re-selecting the already-active value in an axis is always allowed
  // (it's the "remove this filter" affordance).
  if (selection[axis] === slug) return true;

  // Tool ↔ Type capability (the factual constraint).
  if (axis === "type") {
    const tool = selection.tool;
    const t = TYPE_BY_SLUG[slug];
    if (tool && t && !toolDoes(tool, t.modality)) return false;
  }
  if (axis === "tool") {
    const typeSlug = selection.type;
    if (typeSlug) {
      const t = TYPE_BY_SLUG[typeSlug];
      if (t && !toolDoes(slug, t.modality)) return false;
    }
  }

  // role / category edges are not data-backed yet → permissive.
  return true;
}

/** Human-readable reason a facet is disabled (for tooltips). */
export function disabledReason(axis: Axis, slug: string, selection: Selection): string | null {
  if (facetEnabled(axis, slug, selection)) return null;
  if (axis === "type" && selection.tool) {
    return `${labelFor("tool", selection.tool)} doesn't generate ${slug} output`;
  }
  if (axis === "tool" && selection.type) {
    return `${labelFor("tool", slug)} doesn't generate ${selection.type} output`;
  }
  return "Not available with the current selection";
}

function labelFor(_axis: Axis, slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ── Canonical URL for a selection ──────────────────────────────────── */

/**
 * The canonical page a selection maps to (crawlable hrefs + "view as page").
 * Implements the SEO combination spec — only the 4 BUILD 2-axis combos are
 * minted; everything else collapses to the most valuable axis it contains:
 *
 *   BUILD combos (priority order):
 *     tool × audience      → /tool/{tool}/for/{audience}
 *     category × audience  → /category/{category}/for/{audience}   (deduped)
 *     type × audience      → /type/{type}/for/{audience}
 *     tool × category      → /tool/{tool}/{category}
 *   Singles:  /tool/{t} · /for/{audience} · /category/{c} · /type/{t}
 *
 * Tool × Type is NEVER minted (tools are modality-locked → skip). Category ×
 * Type and all 3-/4-axis selections collapse here (no thin pages). The
 * audience axis ("role") lives at /for/{audience} (buyer-intent pattern).
 */
export function canonicalHref(selection: Selection): string {
  const { tool, role, category, type } = selection;
  // 2-axis BUILD combos — audience combos first (highest buyer-intent).
  if (tool && role) return `/prompt-library/tool/${tool}/for/${role}`;
  if (category && role && category !== role) return `/prompt-library/category/${category}/for/${role}`;
  if (type && role) return `/prompt-library/type/${type}/for/${role}`;
  if (tool && category) return `/prompt-library/tool/${tool}/${category}`;
  // Singles — audience before category so a profession-slug dedupes to /for/.
  if (tool) return `/prompt-library/tool/${tool}`;
  if (role) return `/prompt-library/for/${role}`;
  if (category) return `/prompt-library/category/${category}`;
  if (type) return `/prompt-library/type/${type}`;
  return "/prompt-library/all";
}
