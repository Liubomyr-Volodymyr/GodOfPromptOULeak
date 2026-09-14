"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { CABINET_DEFAULT_HREF } from "@/components/cabinet/navigation";
import LoginForm from "./LoginForm";

/**
 * SignInDialog — the sign-in popup opened from the navbar "Sign In" control.
 * A blurred backdrop over the LoginForm; Esc / backdrop / X close it.
 */
export default function SignInDialog({
  open,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after a successful sign-in so the nav can reflect the session. */
  onSignedIn?: () => void;
}) {
  const router = useRouter();

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      className="fixed inset-0 z-[200] flex min-h-full items-center justify-center overflow-y-auto p-4 py-10 motion-safe:animate-[pg-panel-in_180ms_ease-out]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-[rgba(20,20,20,0.55)] backdrop-blur-[6px]"
      />

      <div className="relative">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
        >
          <X size={18} aria-hidden />
        </button>
        <LoginForm
          onSuccess={() => {
            onSignedIn?.();
            onClose();
            router.push(CABINET_DEFAULT_HREF);
          }}
          onCreateAccount={() => {
            onClose();
            router.push("/signup");
          }}
        />
      </div>
    </div>
  );
}
