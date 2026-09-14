"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Bookmark, Share2, Check } from "lucide-react";
import {
  isLiked,
  isBookmarked,
  toggleLike,
  toggleBookmark,
  subscribeReactions,
} from "@/lib/prompt-reactions";

/**
 * Like & bookmark — interactive, localStorage-backed (see prompt-reactions).
 * Optimistic toggles with a little pop animation; all instances stay in
 * sync via the shared `gop:reactions` event. Rendered above the card's
 * stretched-link overlay (callers wrap in `relative z-[1]`).
 *
 * SSR renders the resting (unset) state; the real state hydrates after
 * mount to avoid a server/client mismatch.
 */

/** Heart toggle + live count. `baseLikes` is the real backend figure;
 * the viewer's own like is added on top so the number reacts. */
export function LikeButton({ slug, baseLikes }: { slug: string; baseLikes: number }) {
  const [mounted, setMounted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLiked(isLiked(slug));
    return subscribeReactions(() => setLiked(isLiked(slug)));
  }, [slug]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setLiked(toggleLike(slug));
      setPop(true);
      window.setTimeout(() => setPop(false), 220);
    },
    [slug],
  );

  const count = baseLikes + (mounted && liked ? 1 : 0);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={[
        "group/like inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 -mx-1",
        "text-gop-caption tabular-nums transition-colors duration-150",
        liked ? "text-gop-accent-yellow" : "text-white/45 hover:text-white/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
      ].join(" ")}
    >
      <Heart
        size={13}
        strokeWidth={1.8}
        className={[
          "transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:!scale-100",
          liked ? "fill-current" : "fill-transparent group-hover/like:scale-110",
          pop ? "scale-[1.35]" : "scale-100",
        ].join(" ")}
      />
      {count > 0 && <span suppressHydrationWarning>{count}</span>}
    </button>
  );
}

/** Bookmark toggle — compact, lives in the footer next to Like. Fills gold
 * when saved. Mirrors LikeButton so the two engagement actions read as a
 * pair. Pass `baseCount` to render a live count next to the icon (the new
 * card footer does; older callers omit it and get the icon-only button). */
export function BookmarkButton({ slug, baseCount }: { slug: string; baseCount?: number }) {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(isBookmarked(slug));
    return subscribeReactions(() => setSaved(isBookmarked(slug)));
  }, [slug]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSaved(toggleBookmark(slug));
      setPop(true);
      window.setTimeout(() => setPop(false), 220);
    },
    [slug],
  );

  const count = baseCount != null ? baseCount + (mounted && saved ? 1 : 0) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark"}
      className={[
        "group/bm inline-flex items-center gap-1 rounded-full p-1 -m-1",
        "text-gop-caption tabular-nums transition-colors duration-150",
        saved ? "text-gop-accent-yellow" : "text-white/45 hover:text-white/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
      ].join(" ")}
    >
      <Bookmark
        size={13}
        strokeWidth={1.8}
        className={[
          "transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:!scale-100",
          saved ? "fill-current" : "fill-transparent group-hover/bm:scale-110",
          pop ? "scale-[1.3]" : "scale-100",
        ].join(" ")}
      />
      {count != null && count > 0 && <span suppressHydrationWarning>{count}</span>}
    </button>
  );
}

/** Share — copies the prompt's URL (native share sheet where available).
 * Icon-only; flashes a check on success. Sits in the card footer opposite
 * the engagement pair. */
export function ShareButton({ slug, title }: { slug: string; title?: string }) {
  const [done, setDone] = useState(false);

  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/prompt-library/${slug}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: title ?? "God of Prompt", url });
        } else {
          await navigator.clipboard.writeText(url);
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      } catch {
        /* user dismissed the share sheet — nothing to flash */
      }
    },
    [slug, title],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share prompt"
      className={[
        "inline-flex items-center rounded-full p-1 -m-1 transition-colors duration-150",
        done ? "text-gop-accent-yellow" : "text-white/45 hover:text-white/80",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
      ].join(" ")}
    >
      {done ? <Check size={13} strokeWidth={2} /> : <Share2 size={13} strokeWidth={1.8} />}
    </button>
  );
}
