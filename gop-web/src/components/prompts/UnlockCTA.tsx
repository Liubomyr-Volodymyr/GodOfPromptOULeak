import { Loader } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";

/**
 * UnlockCTA — the "Unlock Full Experience" card that sits INSIDE the hub's
 * card mosaic (Figma 1617:13094 "banner"). Near-black surface with a faint
 * dot matrix, a gold glow arc at the bottom, gold spinner mark, and the
 * gold "Start Now" pill → the custom-prompt generator.
 *
 * (Figma copy reads "Expirience" — corrected here.)
 */

// Same target as CustomPromptCTA (sibling-owned file — value duplicated,
// not imported, to keep the ownership boundary clean).
const GENERATOR_URL = "/prompt-generator";

export default function UnlockCTA({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "relative flex min-h-[220px] flex-col items-center justify-center gap-4 overflow-hidden",
        "rounded-[20px] border border-white/[0.08] bg-gop-ink-deeper p-6 text-center text-white",
        className,
      ].join(" ")}
    >
      {/* faint dot matrix (Figma Group 8154) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(rgba(217,217,217,0.9) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* gold glow arc rising from the bottom edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 left-1/2 h-32 w-[130%] -translate-x-1/2 rounded-[100%] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(50% 60% at 50% 50%, rgba(253,195,2,0.55), transparent 70%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(253,195,2,0.8), transparent)" }}
      />

      {/* gold spinner mark (Figma Group 14) */}
      <span aria-hidden className="relative inline-flex text-gop-gold">
        <Loader size={26} strokeWidth={2.2} />
      </span>

      <div className="relative flex flex-col gap-1">
        <h3 className="m-0 text-[22px] font-medium leading-7 tracking-[-0.01em] text-white">
          Unlock Full Experience
        </h3>
        <p className="m-0 text-[14px] leading-5 text-white/75">Customise Prompt for Max Result</p>
      </div>

      {/* Site CTA primitive, not a bespoke gold pill — one gold family. */}
      <CtaButton variant="gold" size="sm" href={GENERATOR_URL} className="relative">
        Start Now
      </CtaButton>
    </div>
  );
}
