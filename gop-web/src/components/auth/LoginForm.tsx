"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/icon/Icon";
import { loginUser, googleAuthUrl, AuthError } from "@/lib/api";
import { storeSession } from "@/lib/auth";
import {
  AuthButton,
  AuthHeading,
  AuthSeparator,
  AuthShell,
  cn,
  FORM_GAP,
} from "./auth-ui";

/**
 * LoginForm — the working sign-in flow. Renders from the shared auth-ui
 * primitives so it matches the design gallery + registration. Submits to
 * gop-back `POST /api/auth/login` and stores the JWT pair on success.
 *
 *   login  POST /api/auth/login { email, password } -> { access_token, refresh_token }
 *
 * (An unverified account returns "Email not verified" and re-sends a code —
 * surfaced as an error for now; verify-from-login is a follow-up.)
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Controlled field matching the design's AuthField (focus ring, floating label). */
function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  reveal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  reveal?: boolean;
}) {
  const [show, setShow] = useState(false);
  const filled = value.length > 0;
  const inputType = reveal ? (show ? "text" : "password") : type;

  return (
    <label className="flex w-full flex-col">
      <span className="relative flex h-11 w-full items-center rounded-[12px] border border-[#ffffff0a] bg-[#ffffff0a] px-4 transition-colors focus-within:border-[#fcd94a]">
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          {filled && (
            <span className="text-[11px] font-normal leading-4 tracking-[0.2px] text-[#ffffffbf]">{label}</span>
          )}
          <input
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            type={inputType}
            autoComplete={autoComplete}
            className="h-5 w-full border-0 bg-transparent p-0 text-[14px] font-normal leading-5 text-[#f7f7f7] outline-none placeholder:text-[#ffffffbf]"
          />
        </span>
        {reveal && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            onClick={() => setShow((s) => !s)}
            className={cn(
              "ml-1 inline-flex size-6 shrink-0 items-center justify-center transition-colors hover:text-[#f7f7f7]",
              show ? "text-[#f7f7f7]" : "text-[#8f8e8f]",
            )}
          >
            <Icon name="eye" size={24} />
          </button>
        )}
      </span>
    </label>
  );
}

export default function LoginForm({
  onSuccess,
  onCreateAccount,
  className,
}: {
  /** Called after a successful sign-in (tokens already stored). */
  onSuccess?: () => void;
  /** "Create an account" action — e.g. close the modal and route to /signup. */
  onCreateAccount?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const tokens = await loginUser(email.trim().toLowerCase(), password);
      storeSession(tokens, email.trim().toLowerCase());
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof AuthError || err instanceof Error
          ? err.message
          : "Couldn't sign you in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const createAccount = () => {
    if (onCreateAccount) onCreateAccount();
    else router.push("/signup");
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <AuthShell
        as="form"
        onSubmit={onSubmit}
        height="auto"
        nodeId="2092:28801"
        className="py-6"
        heading={<AuthHeading title="Welcome back" subtitle="Sign in to your account to continue" height="auto" />}
      >
        <div className={FORM_GAP}>
          <AuthButton kind="google" onClick={() => { window.location.href = googleAuthUrl(); }}>
            Continue with Google
          </AuthButton>
          <AuthSeparator>Or sign in with</AuthSeparator>

          <div className="flex w-full flex-col gap-5">
            <Field label="Email Address" value={email} onChange={setEmail} type="email" autoComplete="email" />
            <Field label="Password" value={password} onChange={setPassword} autoComplete="current-password" reveal />
          </div>

          {error && (
            <p role="alert" className="m-0 w-full text-center text-[13px] leading-5 text-[#fc4a4a]">
              {error}
            </p>
          )}

          <AuthButton kind="gold" type="submit" disabled={!canSubmit}>
            {submitting ? "Signing in…" : "Sign in"}
          </AuthButton>
          <AuthSeparator muted>Don&apos;t have an account?</AuthSeparator>
          <AuthButton kind="dark" onClick={createAccount}>
            Create an account
          </AuthButton>
        </div>
      </AuthShell>
    </div>
  );
}
