/**
 * Tool brand registry — maps a tool's `webName` to:
 *   1. A Tailwind CSS class for the brand background (used by ToolChip)
 *   2. A Lobehub icon component (used to render the brand mark)
 *
 * Adding a new tool: register here, then add its color token in
 * globals.css under the `--color-gop-model-*` block. Never inline
 * brand colors in components.
 *
 * Lobehub icons are imported individually for tree-shaking — each
 * brand pulls in only the SVG it needs (~1-2KB each).
 */
import { createElement, type ComponentType, type SVGProps } from "react";
import {
  Anthropic,
  Claude,
  Cursor,
  DeepSeek,
  Gemini,
  Grok,
  Midjourney,
  NanoBanana,
  NotebookLM,
  OpenAI,
  Qwen,
  Windsurf,
} from "@lobehub/icons";

export type ToolBrand = {
  /** Tailwind utility(ies) for the chip background. Either a single
   * `bg-*` class or a gradient string. */
  bg: string;
  /** Tailwind utility for the chip text colour. */
  fg: string;
  /** Lobehub icon component (single-colour Mono variant). */
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

/** Brand lookup — keyed by lower-cased webName so "ChatGPT", "chatgpt",
 * "CHATGPT" all resolve identically. Unknown brands fall back to the
 * card-tag style (translucent white). */
const BRANDS: Record<string, ToolBrand> = {
  chatgpt:       { bg: "bg-gop-model-chatgpt",      fg: "text-white", Icon: OpenAI },
  claude:        { bg: "bg-gop-model-claude",       fg: "text-white", Icon: Claude },
  "claude code": { bg: "bg-gop-model-claude-code",  fg: "text-white", Icon: Anthropic },
  cursor:        { bg: "bg-gop-model-cursor",       fg: "text-white", Icon: Cursor },
  deepseek:      { bg: "bg-gop-model-deepseek",     fg: "text-white", Icon: DeepSeek },
  gemini:        { bg: "bg-gradient-to-r from-gop-model-gemini-from to-gop-model-gemini-to", fg: "text-white", Icon: Gemini },
  grok:          { bg: "bg-gop-model-grok",         fg: "text-white", Icon: Grok },
  midjourney:    { bg: "bg-gop-model-midjourney",   fg: "text-white", Icon: Midjourney },
  // Design system (568-1600): off-white text + subtle shadow on the
  // yellow fill — NOT dark ink.
  "nano banana": { bg: "bg-gop-model-nano-banana",  fg: "text-[#f7f7f7] [text-shadow:0_1px_1px_rgba(0,0,0,0.1)]", Icon: NanoBanana },
  notebooklm:    { bg: "bg-gop-model-notebooklm",   fg: "text-white", Icon: NotebookLM },
  qwen:          { bg: "bg-gop-model-qwen",         fg: "text-white", Icon: Qwen },
  windsurf:      { bg: "bg-gop-model-windsurf",     fg: "text-white", Icon: Windsurf },
};

/**
 * Neutral mark for tools we have no logo for — a plain sparkle, NOT another
 * company's logo.
 *
 * This used to be `OpenAI`, which was not "rarely hit": the backend serves 50
 * tools and this map covers 12, so 41 tool pages (Perplexity, Mistral, Sora,
 * Veo, Runway, ElevenLabs, Suno, Lovable, v0, Replit, Claude Code, …) rendered
 * OpenAI's mark as if it were their own — wrong brand on the page and, in the
 * H1, an accessible name that read "OpenAI Perplexity AI Prompts".
 *
 * Only ToolDirectoryCard/GuideCard guarded with `hasToolBrand()`; the other
 * seven call sites use `.Icon` directly, so the fallback has to be safe by
 * itself.
 */
function GenericToolMark(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props;
  return createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "currentColor",
      "aria-hidden": true,
      focusable: false,
      ...rest,
    },
    createElement("path", {
      d: "M12 2.5 14.2 9l6.5 2.2-6.5 2.2L12 20l-2.2-6.6L3.3 11.2 9.8 9 12 2.5Z",
    }),
  );
}

const FALLBACK: ToolBrand = {
  bg: "bg-white/15",
  fg: "text-white",
  Icon: GenericToolMark,
};

export function getToolBrand(webName: string | undefined | null): ToolBrand {
  if (!webName) return FALLBACK;
  return BRANDS[webName.toLowerCase()] ?? FALLBACK;
}

/** Whether a real brand mark exists for this tool — lets the directory show a
 *  branded tile only when we truly have the logo (else an initial fallback),
 *  never the generic stand-in as if it were the tool's own mark. */
export function hasToolBrand(webName: string | undefined | null): boolean {
  return !!webName && webName.toLowerCase() in BRANDS;
}
