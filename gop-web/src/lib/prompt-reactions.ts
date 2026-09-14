/**
 * Prompt reactions — like & bookmark, localStorage-backed.
 *
 * The dev backend has no write endpoint for likes/bookmarks (single-writer
 * rule; mutations go through the API when it ships), so these are stored
 * client-side and applied optimistically. Keyed by slug (stable, URL-safe).
 *
 * A `gop:reactions` window event fires on every change so all card
 * instances + the detail page stay in sync without prop drilling.
 *
 *   toggleLike(slug)        → boolean (new state)
 *   toggleBookmark(slug)    → boolean
 *   isLiked(slug) / isBookmarked(slug)
 *   subscribeReactions(cb)  → unsubscribe
 */

const LIKE_KEY = "gop:liked-prompts";
const BOOKMARK_KEY = "gop:bookmarked-prompts";
const EVENT = "gop:reactions";

function read(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function write(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* quota / private mode — ignore */
  }
}

function toggle(key: string, slug: string): boolean {
  const set = read(key);
  let next: boolean;
  if (set.has(slug)) {
    set.delete(slug);
    next = false;
  } else {
    set.add(slug);
    next = true;
  }
  write(key, set);
  return next;
}

export const toggleLike = (slug: string) => toggle(LIKE_KEY, slug);
export const toggleBookmark = (slug: string) => toggle(BOOKMARK_KEY, slug);

export const isLiked = (slug: string) => read(LIKE_KEY).has(slug);
export const isBookmarked = (slug: string) => read(BOOKMARK_KEY).has(slug);

/** Subscribe to any reaction change (this tab + other tabs via `storage`). */
export function subscribeReactions(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
