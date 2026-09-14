"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Info } from "lucide-react";

/**
 * PromptGenLoader — the full-screen wait animation shown while a prompt is
 * being generated (revamped from the legacy /prompt-generator page). A blurred
 * backdrop over a white card: the GoP mascot floats inside a pulsing gold halo,
 * a rotating stage label + bouncing dots keep the wait feeling alive. No fake
 * progress bar — the backend reports no real progress, so motion + changing
 * copy carries it. Keyframes live in globals.css (pg-halo / pg-float / pg-dot).
 */
const STAGES = [
  "Mixing the ingredients",
  "Brewing your mega-prompt",
  "Calibrating tone & format",
  "Adding the guardrails",
  "Polishing the output",
  "Almost there",
];

const DEFAULT_STAGE_MS = 6500;

export default function PromptGenLoader({
  label,
  stageMs = DEFAULT_STAGE_MS,
}: {
  label?: string;
  stageMs?: number;
}) {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (label) return; // parent is driving the label — don't rotate
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), stageMs);
    return () => clearInterval(id);
  }, [label, stageMs]);

  const text = label ?? STAGES[stageIdx];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[50] flex items-center justify-center p-6 motion-safe:animate-[pg-panel-in_200ms_ease-out]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[rgba(245,245,245,0.6)] backdrop-blur-[14px] backdrop-saturate-[1.05]"
      />
      <div className="relative flex w-full max-w-[440px] flex-col items-center gap-5 rounded-[28px] border border-gop-ink-hairline bg-white px-8 pb-7 pt-9 shadow-[0_24px_60px_rgba(22,20,21,0.18),0_2px_6px_rgba(22,20,21,0.08)] motion-safe:animate-[pg-panel-in_320ms_ease-out] max-[640px]:px-6 max-[640px]:pt-7">
        {/* Stage — mascot floating in pulsing gold halos */}
        <div aria-hidden className="relative grid h-[140px] w-[140px] place-items-center max-[640px]:h-[120px] max-[640px]:w-[120px]">
          {[0, 0.55, 1.1].map((delay) => (
            <span
              key={delay}
              className="absolute inset-0 rounded-full opacity-0 motion-safe:animate-[pg-halo_2.2s_ease-out_infinite]"
              style={{
                animationDelay: `${delay}s`,
                background:
                  "radial-gradient(circle, rgba(253,195,2,0.45) 0%, rgba(253,195,2,0.15) 55%, rgba(253,195,2,0) 72%)",
              }}
            />
          ))}
          <Image
            src="/home/hero/mascot.webp"
            alt=""
            width={92}
            height={92}
            aria-hidden
            className="relative h-[92px] w-[92px] object-contain drop-shadow-[0_6px_12px_rgba(22,20,21,0.18)] motion-safe:animate-[pg-float_2.6s_ease-in-out_infinite] max-[640px]:h-[78px] max-[640px]:w-[78px]"
          />
        </div>

        <p key={text} className="m-0 min-h-6 text-center text-[18px] font-semibold tracking-[-0.01em] text-gop-ink max-[640px]:text-[16px]">
          {text}
        </p>

        <div aria-hidden className="inline-flex items-center gap-1.5">
          {[0, 0.18, 0.36].map((delay) => (
            <span
              key={delay}
              className="h-[7px] w-[7px] rounded-full bg-gop-accent-yellow motion-safe:animate-[pg-dot_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        <p className="m-0 text-center text-[13px] text-gop-ink-soft">
          This can take up to 3 minutes — hang tight.
        </p>

        <div
          role="note"
          className="mt-1 flex max-w-[340px] items-start gap-2 rounded-[10px] border border-[rgba(253,195,2,0.4)] bg-[rgba(253,195,2,0.12)] px-3.5 py-2.5 text-left text-[12.5px] leading-[1.45] text-[#4a3a00]"
        >
          <Info size={14} className="mt-0.5 shrink-0 text-[#8a6a00]" aria-hidden />
          <span>
            <strong className="font-semibold text-[#3a2d00]">Email delivery is temporarily delayed.</strong> Please
            keep this tab open — your prompt will appear here as soon as it&rsquo;s ready.
          </span>
        </div>
      </div>
    </div>
  );
}
