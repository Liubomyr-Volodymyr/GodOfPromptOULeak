"use client";

import { useState } from "react";
import { MoreVertical, Link2, Check, Share } from "lucide-react";
import ContextMenu, { type ContextMenuItem } from "@/components/ui/ContextMenu";
import styles from "./PromptTerminal.module.css";

/**
 * SharePromptMenu — opens the "Share Prompt" dropdown (Figma 1412:12405):
 * Copy link, Bluesky, LinkedIn, X. Copy writes the page URL; the socials
 * open an intent in a new tab.
 *
 * Two trigger looks:
 *   - "terminal" (default): the dark hover-expand pill in the prompt block.
 *   - "header": a white round share pill for the page header stat row
 *     (Figma 1266:4592), sitting beside the stat pills + donate button.
 */
export default function SharePromptMenu({
  title,
  variant = "terminal",
}: {
  title: string;
  variant?: "terminal" | "header";
}) {
  const [copied, setCopied] = useState(false);

  const url = () => (typeof window !== "undefined" ? window.location.href : "");
  const text = `${title} · God of Prompt`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  };
  const openShare = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const items: ContextMenuItem[] = [
    {
      id: "copy",
      label: copied ? "Copied!" : "Copy link",
      icon: copied ? <Check size={15} strokeWidth={2} /> : <Link2 size={15} strokeWidth={2} />,
      onSelect: copyLink,
    },
    {
      id: "bluesky",
      label: "Bluesky",
      icon: <BlueskyIcon />,
      onSelect: () => openShare(`https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url()}`)}`),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: <LinkedInIcon />,
      onSelect: () => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`),
    },
    {
      id: "x",
      label: "X",
      icon: <XIcon />,
      onSelect: () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url())}`),
    },
  ];

  return (
    <ContextMenu
      title="Share Prompt"
      width={240}
      align="right"
      items={items}
      trigger={(p) =>
        variant === "header" ? (
          <button
            type="button"
            {...p}
            title="Share prompt"
            aria-label="Share prompt"
            className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(175,175,175,0.24)] bg-white text-gop-dark shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors duration-150 hover:bg-gop-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow"
          >
            <Share size={15} strokeWidth={1.8} />
          </button>
        ) : (
          <button
            type="button"
            {...p}
            title="Share prompt"
            aria-label="Share prompt"
            className={styles.actionPill}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center justify-self-center">
              <MoreVertical size={16} strokeWidth={2} />
            </span>
            <span className={styles.actionLabel}>Share</span>
          </button>
        )
      }
    />
  );
}

/* ── Brand glyphs (16px, currentColor) ───────────────────────────── */
function BlueskyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
