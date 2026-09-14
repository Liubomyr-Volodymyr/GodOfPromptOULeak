"use client";

import { useEffect } from "react";
import { rememberRecentPrompt } from "@/lib/recent-prompts";

/**
 * RememberVisit — fire-and-forget client effect that records the current
 * prompt into the Recent list (localStorage) on mount. Dropped into the
 * server-rendered prompt detail page so the command palette's "Recent"
 * section reflects what the user actually viewed. Renders nothing.
 */
export default function RememberVisit({
  slug, title, icon, isPremium,
}: {
  slug: string;
  title: string;
  icon: string | null;
  isPremium: boolean;
}) {
  useEffect(() => {
    rememberRecentPrompt({ slug, title, icon, isPremium });
  }, [slug, title, icon, isPremium]);
  return null;
}
