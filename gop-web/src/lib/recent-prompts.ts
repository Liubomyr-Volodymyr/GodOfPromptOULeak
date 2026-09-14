/**
 * Recently-viewed prompts — localStorage-backed, used by the command
 * palette's empty state. Adapted from gop-web-temp's SearchModal.
 *
 *   rememberRecentPrompt(prompt)  — call when a prompt page is viewed
 *   loadRecentPrompts()           — read the list (newest first)
 */

const RECENT_KEY = "gop:recent-prompts";
const RECENT_LIMIT = 5;

export type RecentPrompt = {
  slug: string;
  title: string;
  icon: string | null;
  isPremium: boolean;
};

export function loadRecentPrompts(): RecentPrompt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

export function rememberRecentPrompt(p: {
  slug?: string;
  title?: string;
  icon?: string | null;
  isPremium?: boolean;
}): void {
  if (typeof window === "undefined" || !p?.slug || !p.title) return;
  try {
    const entry: RecentPrompt = {
      slug: p.slug,
      title: p.title,
      icon: p.icon ?? null,
      isPremium: !!p.isPremium,
    };
    const current = loadRecentPrompts().filter((x) => x.slug !== entry.slug);
    const next = [entry, ...current].slice(0, RECENT_LIMIT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore — quota / private mode */
  }
}
