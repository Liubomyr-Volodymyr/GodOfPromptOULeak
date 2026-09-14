import {
  hrefForSelection,
  type Facetish,
  type LibrarySelection,
} from "@/lib/library-selection";
import { getRootCategories } from "@/lib/categories";
import { getRoles } from "@/lib/roles";

/**
 * pSEO copy engine — ONE grammar for every combinatoric library page
 * (Figma 1434:16236). The same phrase feeds the H1 (PseoHeader), the
 * <title> (each route's generateMetadata) and the accordion SEO body
 * (PseoSeoSections), so a page can never disagree with its own metadata.
 *
 * Pattern: "[Tool] [CategoryAdj] [Format | AI | —] Prompts [for Target]" where
 * Target = audience when present, else the (sub)category; the category only
 * becomes an adjective when an audience takes the "for" slot; and the slot
 * before "Prompts" is decided by `qualifier()`:
 *
 *   {tool}                   → "525 Grok Prompts"                (no "AI")
 *   {tool, format, role}     → "1,982 ChatGPT Text Prompts for Solopreneurs"
 *   {category}               → "1,240 AI Prompts for Marketing"
 *   {format}                 → "1,240 Image Prompts"
 *   {category, role}         → "310 Marketing AI Prompts for Lawyers"
 *   {category, format, role} → "35 Marketing Image Prompts for Agencies"
 */

/** Canonical tool facet list (mirrors the /tool/[slug] route map). */
export const TOOL_FACETS: Facetish[] = [
  { slug: "chatgpt", name: "ChatGPT" },
  { slug: "claude", name: "Claude" },
  { slug: "gemini", name: "Gemini" },
  { slug: "grok", name: "Grok" },
  { slug: "deepseek", name: "DeepSeek" },
  { slug: "midjourney", name: "Midjourney" },
  { slug: "nano-banana", name: "Nano Banana" },
];

export type PseoBits = {
  tool: Facetish | null;
  format: Facetish | null;
  /** Category rendered as an adjective (only when an audience is the target). */
  catAdj: Facetish | null;
  /** The "for {X}" object: audience if present, else subcategory/category. */
  target: Facetish | null;
};

/** Decompose a selection into the H1's word groups. */
export function pseoBits(sel: LibrarySelection): PseoBits {
  const target = sel.role ?? sel.subcategory ?? sel.category ?? null;
  const catAdj = sel.role ? (sel.subcategory ?? sel.category ?? null) : null;
  return { tool: sel.tool ?? null, format: sel.format ?? null, catAdj, target };
}

/**
 * The qualifier that sits right before "Prompts".
 *
 *   format selected → the format name ("Text" / "Image")
 *   else a tool     → nothing. The model IS the qualifier; "ChatGPT AI
 *                     Prompts" is redundant, so it reads "ChatGPT Prompts".
 *   else            → the neutral "AI"
 *
 * Never two qualifiers ("Image AI Prompts") and never a redundant one.
 */
export function qualifier(tool: Facetish | null, format: Facetish | null): string | null {
  if (format) return format.name;
  return tool ? null : "AI";
}

/** The page phrase without the count — "Grok Prompts for Marketing",
 *  "Image Prompts for Agencies", "ChatGPT Text Prompts for Solopreneurs". */
function pseoPhrase(sel: LibrarySelection): string {
  const { tool, format, catAdj, target } = pseoBits(sel);
  const head = [tool?.name, catAdj?.name, qualifier(tool, format), "Prompts"]
    .filter(Boolean)
    .join(" ");
  return target ? `${head} for ${target.name}` : head;
}

/** <title> for a combinatoric page — coherent with the H1 by construction.
 *  Bare phrase only: the root layout's title template appends the brand
 *  ("%s — God of Prompt"), so adding a suffix here would double it. */
export function pseoTitle(sel: LibrarySelection): string {
  return pseoPhrase(sel);
}

/* ── Accordion SEO body (Figma "Prompt Summary Sections") ───────────── */

export type PseoSection = { id: string; title: string; body: string[] };
export type PseoLink = { href: string; label: string };

/** Prose variant of the phrase ("Grok AI prompts for Marketing",
 *  "Marketing image prompts for Agencies") — lowercase the "Prompts" head. */
function prosePhrase(sel: LibrarySelection): string {
  // Keep acronyms upright — "AI Prompts" must not become "ai prompts", which
  // read wrong once these phrases became real <h2> headings.
  const KEEP = new Set(["AI", "GPT", "GPTs", "SEO", "HR"]);
  return pseoPhrase(sel).replace(/(\w+) Prompts/, (_, q) =>
    `${KEEP.has(q) ? q : q.toLowerCase()} prompts`,
  );
}

/** The editorial + FAQ accordion rows, parameterised by the facets. */
export function pseoSections(sel: LibrarySelection, total: number | null): PseoSection[] {
  const { tool, target } = pseoBits(sel);
  const prose = prosePhrase(sel);
  // `total` is null when a real count isn't available (output-type pages) —
  // the prose then avoids a fabricated number rather than writing "null".
  const n = total != null ? total.toLocaleString("en-US") : null;
  const t = target?.name;

  const what: PseoSection = {
    id: "what",
    title: `What are ${prose}?`,
    body: [
      `${prose} are engineered instructions that already work${tool ? `, written and tested for ${tool.name}` : ""} — not one-line questions. Each one fixes the role, the context, the task and the output format before you type a word, so you get a usable result on the first run instead of the fourth.`,
      t
        ? `They cover the work ${t} actually get asked for: research and briefs, copy and content, analysis and reporting, planning, outreach and the admin that eats the day. Open a card to see the full prompt and the output it returns.`
        : `They cover the work that actually fills a week: research, briefs, copy, content, analysis, reporting, planning and outreach. Open a card to see the full prompt and the output it returns.`,
      n != null
        ? `${n} on this page${t ? `, every one scoped to ${t}` : ""} — free to read, free to copy.`
        : `Free to read, free to copy${t ? `, all scoped to ${t}` : ""}.`,
    ],
  };

  const why: PseoSection = {
    id: "why",
    title: t ? `Why these prompts work for ${t}` : "Why these prompts beat writing your own",
    body: [
      "A weak prompt costs you the hour you were trying to save: you rewrite it three times, get something generic, then finish the job by hand. An engineered prompt front-loads that thinking once.",
      t
        ? `In ${t} that means first drafts you can send, analysis you can act on, and the repetitive work handed off — so the time goes into judgement instead of typing.`
        : "That means first drafts you can send, analysis you can act on, and the repetitive work handed off — so the time goes into judgement instead of typing.",
      "Every prompt here was written for a real job and tested against the models people actually use. Nothing scraped from a thread.",
    ],
  };

  const how: PseoSection = {
    id: "how",
    title: `How to use these prompts${tool ? ` in ${tool.name}` : ""}`,
    body: [
      "Open a prompt, copy it, and replace the [bracketed] variables with your own product, audience or topic. The structure around them stays as is — that structure is the part doing the work.",
      tool
        ? `Paste it into ${tool.name} and run. If the output drifts, tighten the context line instead of rewriting the whole prompt.`
        : "Paste it into ChatGPT, Claude, Gemini, Grok or the model you already use. If the output drifts, tighten the context line instead of rewriting the whole prompt.",
      "No account needed to copy one. No setup, no extension, nothing to install.",
    ],
  };

  const fit: PseoSection = tool
    ? {
        id: "fit",
        title: `Do these prompts only work with ${tool.name}?`,
        body: [
          `They are tuned for ${tool.name}, but the skeleton — role, context, task, format — carries over to any capable model. Swap model-specific settings like tone or length when you move.`,
        ],
      }
    : {
        id: "fit",
        title: `Which AI tool works best for ${t ? `${t} prompts` : "these prompts"}?`,
        body: [
          "Text prompts here run well in ChatGPT, Claude, Gemini and Grok; image prompts target Midjourney and Nano Banana. Each card lists the models it was tested with.",
        ],
      };

  const free: PseoSection = {
    id: "free",
    title: "Are these AI prompts free to use?",
    body: [
      "A big part of the library is free: open a prompt, copy it, use it. Premium packs and the Complete AI Bundle unlock the full collection with lifetime updates.",
    ],
  };

  const custom: PseoSection = {
    id: "custom",
    title: "How do I adapt these prompts to my use case?",
    body: [
      "Start with the [variables]: niche, audience, constraints. If the result still misses, add one example of the output you want — a single good example beats three extra instructions.",
      "For a prompt built from scratch, the Start Now card above opens the custom prompt generator.",
    ],
  };

  return [what, why, how, fit, free, custom];
}

/* ── Related pages (internal links between combinatoric routes) ─────── */

/** The selection a candidate COLLAPSES to — mirrors canonicalHref's branch
 *  order (only BUILD combos are minted), so link labels always describe the
 *  page they land on, never a dropped axis. */
function canonicalSelection(sel: LibrarySelection): LibrarySelection {
  const cat = sel.subcategory ?? sel.category;
  if (sel.tool && sel.role) return { tool: sel.tool, role: sel.role };
  if (cat && sel.role && cat.slug !== sel.role.slug)
    return { category: sel.category, subcategory: sel.subcategory, role: sel.role };
  if (sel.format && sel.role) return { format: sel.format, role: sel.role };
  if (sel.tool && cat) return { tool: sel.tool, category: sel.category, subcategory: sel.subcategory };
  if (sel.tool) return { tool: sel.tool };
  if (sel.role) return { role: sel.role };
  if (cat) return { category: sel.category, subcategory: sel.subcategory };
  if (sel.format) return { format: sel.format };
  return {};
}

/** Sibling/step-up canonical pages for the "Related resources" row.
 *  Candidates collapse to their canonical selection first, so href AND
 *  label always agree. */
export function pseoRelated(sel: LibrarySelection): PseoLink[] {
  const seen = new Set<string>([hrefForSelection(sel), "/prompt-library/all"]);
  const out: PseoLink[] = [];
  const push = (raw: LibrarySelection) => {
    const candidate = canonicalSelection(raw);
    const href = hrefForSelection(candidate);
    if (seen.has(href)) return;
    seen.add(href);
    out.push({ href, label: pseoPhrase(candidate) });
  };

  if (!sel.tool) for (const tool of TOOL_FACETS.slice(0, 4)) push({ ...sel, tool });
  if (!sel.category)
    for (const c of getRootCategories().slice(0, 4))
      push({ ...sel, subcategory: undefined, category: { slug: c.slug, name: c.name } });
  if (!sel.role)
    for (const r of getRoles().slice(0, 3))
      push({ ...sel, role: { slug: r.slug, name: r.name } });

  // Step back up to the single-axis hubs from combo pages.
  if (sel.tool && (sel.category || sel.role)) push({ tool: sel.tool });
  if (sel.category && (sel.tool || sel.role)) push({ category: sel.category });
  if (sel.role && (sel.tool || sel.category || sel.format)) push({ role: sel.role });

  return out.slice(0, 10);
}
