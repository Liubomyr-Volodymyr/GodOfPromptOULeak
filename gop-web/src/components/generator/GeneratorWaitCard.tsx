"use client";

import { useEffect, useState } from "react";

import { AuthButton, AuthLogo, AUTH_SHADOW, cn } from "@/components/auth/auth-ui";

/**
 * GeneratorWaitCard — the post-checkout "your prompt is cooking" card
 * (Figma 2243:14251). Same design-system shell as the auth dialogs: gradient
 * dark card, logo, a rotating stage title, an animated 3-dot indicator, the
 * copy + the email-delay note, and a dark "Generate one more in parallel"
 * pill. No fake progress bar — the backend reports no real progress, so
 * rotating copy + motion carry the wait. Dot keyframe (pg-dot) is in globals.css.
 */
const STAGES = [
  "Mixing the ingredients",
  "Brewing your mega-prompt",
  "Calibrating tone & format",
  "Adding the guardrails",
  "Polishing the output",
  "Almost there",
];

const STAGE_MS = 6500;

export default function GeneratorWaitCard({
  onGenerateMore,
}: {
  onGenerateMore?: () => void;
}) {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), STAGE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      data-figma-node="2243:14251"
      className={cn(
        "relative flex w-full max-w-[420px] flex-col items-center gap-6 overflow-hidden rounded-[24px]",
        "bg-gradient-to-b from-[#343333] to-[#242223] p-4 text-[#f7f7f7]",
        AUTH_SHADOW,
      )}
    >
      <div className="flex w-full flex-col items-center gap-9">
        <AuthLogo />
        <div className="flex w-full flex-col items-center gap-3">
          <p
            key={stageIdx}
            className="m-0 text-center text-[20px] font-medium leading-6 tracking-[-0.5px] text-[#f7f7f7] motion-safe:animate-[pg-panel-in_320ms_ease-out]"
          >
            {STAGES[stageIdx]}
          </p>

          {/* animated 3-dot indicator */}
          <div aria-hidden className="flex h-4 items-center gap-1.5">
            {[0, 0.18, 0.36].map((delay) => (
              <span
                key={delay}
                className="h-[7px] w-[7px] rounded-full bg-gop-gold motion-safe:animate-[pg-dot_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>

          <p className="m-0 w-full text-center text-[16px] leading-6 tracking-[-0.5px] text-white/75">
            This can take up to 3 min — hang tight.
          </p>
        </div>
      </div>

      {/* email-delay note (Figma "Context menu-items" — white/16 card w/ inset) */}
      <div className="relative w-full rounded-[12px] bg-white/[0.16] p-4 shadow-[inset_0_27px_76px_rgba(255,255,255,0.06),inset_0_0.6px_2px_rgba(255,255,255,0.16)]">
        <p className="m-0 text-[14px] leading-5 text-white/75">
          Email delivery is temporarily delayed. Please keep this tab open — your prompt will appear
          here as soon as it&rsquo;s ready.
        </p>
      </div>

      {onGenerateMore && (
        <AuthButton kind="dark" onClick={onGenerateMore}>
          Generate one more in parallel
        </AuthButton>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_32px_rgba(222,222,222,0.12)]"
      />
    </div>
  );
}
