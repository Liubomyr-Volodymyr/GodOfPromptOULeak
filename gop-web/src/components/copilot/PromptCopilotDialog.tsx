"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { AUTH_SHADOW, AuthButton, cn } from "@/components/auth/auth-ui";
import { buildAuthorizeUrl } from "@/lib/pcp-auth";

/**
 * PromptCopilotDialog — sign-in prompt surfaced from the navbar pill when the
 * user has no Prompt Copilot session yet. "Connect" sends them through the
 * cross-domain SSO handoff (see lib/pcp-auth.ts); on return the navbar swaps
 * this pill for the connected control and this dialog is no longer shown.
 */
export default function PromptCopilotDialog({
  open,
  onClose,
  returnTo = "/",
}: {
  open: boolean;
  onClose: () => void;
  /** Path to land back on once the SSO handoff completes. */
  returnTo?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const connect = () => {
    window.location.href = buildAuthorizeUrl(returnTo);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-dialog-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 motion-safe:animate-[pg-panel-in_180ms_ease-out]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(20,20,20,0.55)] backdrop-blur-[6px]"
      />

      <div
        className={cn(
          "relative flex w-[440px] max-w-full flex-col items-center gap-5 overflow-hidden rounded-[24px]",
          "bg-gradient-to-b from-[#343333] to-[#242223] px-10 py-9 text-center text-[#f7f7f7] max-[520px]:px-6",
          AUTH_SHADOW,
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          <X size={18} aria-hidden />
        </button>

        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3a3939] to-[#242223] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <Image src="/images/icons/navbar-copilot.svg" alt="" width={26} height={26} className="size-[26px]" />
        </span>

        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gop-gold/40 bg-gop-gold/10 px-2.5 py-1 text-[12px] font-medium text-gop-gold">
            Connect your account
          </span>
          <h2 id="copilot-dialog-title" className="m-0 text-[24px] font-semibold tracking-[-0.5px]">
            Prompt Copilot
          </h2>
          <p className="m-0 max-w-[320px] text-[15px] leading-6 text-white/70">
            Link your Prompt Copilot account to pull saved context straight into prompts here on
            God of Prompt.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-2">
          <AuthButton kind="gold" onClick={connect}>
            Connect Prompt Copilot
          </AuthButton>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center px-4 text-[13.5px] text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
          >
            Not now
          </button>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_32px_rgba(222,222,222,0.12)]"
        />
      </div>
    </div>
  );
}
