import type { PromptTool } from "@/lib/api";

/**
 * Side-effect helpers + data for PromptTerminal — split out to keep the
 * component file lean. No JSX here.
 */

export const GENERATOR_URL = "/prompt-generator";

const OPEN_IN_URLS: Record<string, string> = {
  Claude: "https://claude.ai/new",
  "Claude Code": "https://claude.ai/new",
  ChatGPT: "https://chatgpt.com",
  Gemini: "https://gemini.google.com/app",
  Grok: "https://x.com/i/grok",
  DeepSeek: "https://chat.deepseek.com",
  Midjourney: "https://www.midjourney.com",
  "Nano Banana": "https://gemini.google.com/app",
  NotebookLM: "https://notebooklm.google.com",
  Qwen: "https://chat.qwen.ai",
  Cursor: "https://cursor.com",
  Windsurf: "https://codeium.com/windsurf",
};

/**
 * Open a tool's "new chat" page in a new tab. Prefers the official URL from
 * the API record, then the static map. No tool deep-links prompt text, so we
 * copy the (filled) prompt first — the user pastes on arrival.
 */
export function openInTool(tool: PromptTool, body: string | null) {
  const name = tool.webName ?? tool.name;
  const url = tool.url || OPEN_IN_URLS[name] || GENERATOR_URL;
  if (body && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(body).catch(() => { /* non-blocking */ });
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Pull variable values out of the get-context reply. PCP's response shape
 * isn't pinned in its OpenAPI spec, so this stays tolerant: it accepts a flat
 * { "kebab-key": "value" } map, the same map nested under
 * values/context/variables/data/result, or an array of
 * { key|name|variable, value } records — and keeps only the keys this prompt
 * actually declares. Returns the trimmed string values.
 *
 * NOTE: confirm the real response shape with the backend and tighten this.
 */
export function extractContextValues(data: unknown, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data || typeof data !== "object" || keys.length === 0) return out;
  const root = data as Record<string, unknown>;

  const fromArray = (arr: unknown[]): Record<string, unknown> => {
    const m: Record<string, unknown> = {};
    for (const it of arr) {
      if (it && typeof it === "object") {
        const r = it as Record<string, unknown>;
        const k = r.key ?? r.name ?? r.variable;
        if (typeof k === "string") m[k] = r.value ?? r.val ?? r.content;
      }
    }
    return m;
  };

  const containers: unknown[] = [
    root.values, root.context, root.variables, root.data, root.result, root,
  ];
  for (const c of containers) {
    const map = Array.isArray(c)
      ? fromArray(c)
      : c && typeof c === "object"
        ? (c as Record<string, unknown>)
        : null;
    if (!map) continue;
    for (const k of keys) {
      if (out[k]) continue;
      const v = map[k];
      const s =
        typeof v === "string"
          ? v
          : v && typeof v === "object" && typeof (v as Record<string, unknown>).value === "string"
            ? ((v as Record<string, string>).value)
            : "";
      if (s && s.trim()) out[k] = s;
    }
    if (Object.keys(out).length === keys.length) break;
  }
  return out;
}
