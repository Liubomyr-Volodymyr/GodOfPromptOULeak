/**
 * firstSymbol — return at most ONE display symbol from a prompt's `icon`
 * field. Some records ship buggy multi-emoji or "emoji + text" values;
 * the UI only ever shows a single glyph. Grapheme-aware so ZWJ emoji
 * (e.g. 👨‍💻) stay intact instead of being split mid-sequence.
 */
export function firstSymbol(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const trimmed = icon.trim();
  if (!trimmed) return null;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = seg.segment(trimmed)[Symbol.iterator]().next().value;
    return first ? first.segment : null;
  }
  // Fallback: first code point (good enough where Segmenter is absent).
  return Array.from(trimmed)[0] ?? null;
}
