"use client";

import { useEffect, useState } from "react";

/**
 * TypewriterPlaceholder — an animated placeholder for the search input that
 * types out real use-cases and cycles ("What are you solving with AI?" →
 * "Write a cold email that converts" → …). Shown only while the field is
 * empty; suggests what the library is for instead of a made-up prompt count.
 * Respects prefers-reduced-motion (renders the first line, static).
 */
const PHRASES = [
  "What are you solving with AI?",
  "Write a cold email that converts",
  "Plan a 30-day content calendar",
  "Turn a call transcript into a blog post",
  "Draft a product launch tweet",
  "Build a sales outreach sequence",
  "Create a brand voice guide",
];

export default function TypewriterPlaceholder() {
  const [text, setText] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(PHRASES[0]);
      return;
    }
    let phrase = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = PHRASES[phrase];
      char += deleting ? -1 : 1;
      setText(full.slice(0, char));

      if (!deleting && char === full.length) {
        deleting = true;
        timer = setTimeout(tick, 1700); // hold the finished phrase
      } else if (deleting && char === 0) {
        deleting = false;
        phrase = (phrase + 1) % PHRASES.length;
        timer = setTimeout(tick, 320); // pause before the next phrase
      } else {
        timer = setTimeout(tick, deleting ? 22 : 46 + Math.random() * 40);
      }
    };

    timer = setTimeout(tick, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[16px] leading-6 tracking-[-0.01em] text-gop-menu-icon"
    >
      {text}
      <span className="ml-px inline-block h-[18px] w-px translate-y-px bg-gop-accent-yellow/80 motion-safe:animate-pulse" />
    </span>
  );
}
