"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/icon/Icon";
import { registerUser, verifyEmailCode, resendCode, googleAuthUrl, AuthError } from "@/lib/api";
import { captureTracking, storeSession } from "@/lib/auth";
import {
  AuthButton,
  AuthHeading,
  AuthSeparator,
  AuthShell,
  CheckboxMark,
  cn,
  FORM_GAP,
  PasswordRules,
  type PasswordRule,
} from "./auth-ui";

/**
 * RegistrationForm — the WORKING sign-up flow (register → verify → session).
 *
 * Renders from the shared `auth-ui` primitives so it stays pixel-identical to
 * the approved gallery, but every field is a real controlled input. The two
 * consent ticks are genuine checkboxes wired straight into the gop-back
 * RegisterDto payload: "marketing communications" → `marketing_emails`,
 * "product updates" → `product_updates`. The Terms tick is a required gate
 * (must be checked to submit) and is intentionally NOT sent — the backend has
 * no field for it.
 *
 *   register  POST /api/auth/register    -> emails a 6-digit code
 *   verify    POST /api/auth/verify-code -> { access_token, refresh_token }
 */

type Step = "register" | "verify" | "done";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function passwordRuleStates(pw: string): { rules: PasswordRule[]; allPass: boolean } {
  const checks: Array<[string, boolean]> = [
    ["At least 8 characters", pw.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(pw)],
    ["One number", /[0-9]/.test(pw)],
    ["One special character", /[^A-Za-z0-9]/.test(pw)],
  ];
  const rules = checks.map<PasswordRule>(([label, ok]) => ({
    label,
    state: pw.length === 0 ? "idle" : ok ? "success" : "error",
  }));
  return { rules, allPass: checks.every(([, ok]) => ok) };
}

/** Controlled field matching the design's AuthField (focus ring, floating label). */
function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  error,
  reveal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  error?: string;
  /** true → render a show/hide eye toggle and treat as password. */
  reveal?: boolean;
}) {
  const [show, setShow] = useState(false);
  const filled = value.length > 0;
  const inputType = reveal ? (show ? "text" : "password") : type;

  return (
    <label className={cn("flex w-full flex-col", error && "gap-1")}>
      <span
        className={cn(
          "relative flex h-11 w-full items-center rounded-[12px] border bg-[#ffffff0a] px-4 transition-colors",
          error ? "border-[#ff4d5a]" : "border-[#ffffff0a] focus-within:border-[#fcd94a]",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          {filled && (
            <span
              className={cn(
                "text-[11px] font-normal leading-4 tracking-[0.2px]",
                error ? "text-[#fb3748]" : "text-[#ffffffbf]",
              )}
            >
              {label}
            </span>
          )}
          <input
            aria-invalid={error ? true : undefined}
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={label}
            type={inputType}
            autoComplete={autoComplete}
            className={cn(
              "h-5 w-full border-0 bg-transparent p-0 text-[14px] font-normal leading-5 outline-none",
              "text-[#f7f7f7] placeholder:text-[#ffffffbf]",
              error && !filled && "placeholder:text-[#fb3748]",
            )}
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
      {error && (
        <span className="text-[11px] font-normal leading-4 tracking-[0.2px] text-[#fb3748]">{error}</span>
      )}
    </label>
  );
}

/** A real consent checkbox — visually the design's CheckboxMark, but interactive. */
function ConsentCheckbox({
  checked,
  onChange,
  children,
  alignTop = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  alignTop?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none gap-2",
        alignTop ? "min-h-10 items-start" : "min-h-5 items-center",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#fcd94a] rounded-[6px]">
        <CheckboxMark checked={checked} />
      </span>
      <span className="text-[13px] font-normal leading-4 text-[#ffffffbf]">{children}</span>
    </label>
  );
}

export default function RegistrationForm({
  redirectTo = "/",
  onSuccess,
  className,
}: {
  /** Where to send the user after a verified sign-up. */
  redirectTo?: string;
  onSuccess?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [redirectTarget, setRedirectTarget] = useState(redirectTo);

  // register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Honor a same-origin `?redirect=` target and a stashed prefill email
  // (set when a gated action — e.g. the prompt generator — bounces an
  // anonymous user here). Read client-side to avoid a Suspense boundary.
  useEffect(() => {
    // Hydrate from URL/sessionStorage on mount (client-only, no SSR value).
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("redirect");
      if (r && r.startsWith("/") && !r.startsWith("//")) setRedirectTarget(r);
      const stashedEmail = sessionStorage.getItem("gop_prefill_email");
      if (stashedEmail) {
        setEmail(stashedEmail);
        sessionStorage.removeItem("gop_prefill_email");
      }
    } catch {
      // URL/sessionStorage unavailable — fall back to the redirectTo prop.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  const [password, setPassword] = useState("");
  const [marketingEmails, setMarketingEmails] = useState(false); // default OFF
  const [productUpdates, setProductUpdates] = useState(true); // default ON
  const [acceptTerms, setAcceptTerms] = useState(false); // required gate, NOT sent

  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const { rules, allPass: passwordOk } = useMemo(() => passwordRuleStates(password), [password]);

  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    EMAIL_RE.test(email.trim()) &&
    passwordOk &&
    acceptTerms &&
    !submitting;

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setEmailError(undefined);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        marketing_emails: marketingEmails,
        product_updates: productUpdates,
        tracking: captureTracking(),
      });
      setStep("verify");
    } catch (err) {
      if (err instanceof AuthError && err.code === "duplicate") {
        setEmailError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "verify") {
    return (
      <VerifyStep
        email={email.trim().toLowerCase()}
        className={className}
        onVerified={() => {
          setStep("done");
          onSuccess?.();
          router.push(redirectTarget);
        }}
      />
    );
  }

  if (step === "done") {
    return (
      <div className={cn("flex justify-center", className)}>
        <AuthShell
          height="auto"
          className="py-10"
          heading={<AuthHeading title="You're all set!" subtitle="Your account is ready." success height="auto" />}
        >
          <div className={FORM_GAP}>
            <AuthButton kind="gold" onClick={() => router.push(redirectTarget)}>
              Continue
            </AuthButton>
          </div>
        </AuthShell>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <AuthShell
        as="form"
        onSubmit={onRegister}
        height="auto"
        nodeId="2092:28005"
        className="py-6"
        heading={<AuthHeading title="Create an Account" subtitle="Join thousands of users getting AI superpowers" height="auto" />}
      >
        <div className={FORM_GAP}>
          <AuthButton kind="google" onClick={() => { window.location.href = googleAuthUrl(); }}>
            Continue with Google
          </AuthButton>
          <AuthSeparator>Or sign up with</AuthSeparator>

          <div className="flex w-full flex-col gap-5">
            <div className="flex w-full gap-2">
              <Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
            </div>
            <Field
              label="Email Address"
              value={email}
              onChange={(v) => { setEmail(v); if (emailError) setEmailError(undefined); }}
              type="email"
              autoComplete="email"
              error={emailError}
            />
            <Field
              label="Create your password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              reveal
            />
            <PasswordRules rules={rules} />
          </div>

          <div className="flex w-full flex-col gap-2">
            <ConsentCheckbox checked={marketingEmails} onChange={setMarketingEmails}>
              I&rsquo;d like to receive marketing communications.
            </ConsentCheckbox>
            <ConsentCheckbox checked={productUpdates} onChange={setProductUpdates}>
              I&rsquo;d like to receive product updates.
            </ConsentCheckbox>
            <ConsentCheckbox checked={acceptTerms} onChange={setAcceptTerms} alignTop>
              By continuing, you agree to our{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-5 underline">
                Terms of Use
              </a>
              {" and "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[14px] leading-5 underline">
                Privacy Policy.
              </a>
            </ConsentCheckbox>
          </div>

          {formError && (
            <p role="alert" className="m-0 w-full text-center text-[13px] leading-5 text-[#fc4a4a]">
              {formError}
            </p>
          )}

          <AuthButton kind="gold" type="submit" disabled={!canSubmit}>
            {submitting ? "Creating account…" : "Create account"}
          </AuthButton>
          <AuthSeparator muted>Already have an account?</AuthSeparator>
          <AuthButton kind="dark" onClick={() => router.push("/login")}>
            Sign in here
          </AuthButton>
        </div>
      </AuthShell>
    </div>
  );
}

function VerifyStep({
  email,
  onVerified,
  className,
}: {
  email: string;
  onVerified: () => void;
  className?: string;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const complete = code.length === 6;

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (error) setError(undefined);
    if (clean.length > 1) {
      // paste of the full code
      const next = clean.slice(0, 6).split("");
      const filled = Array(6).fill("").map((_, idx) => next[idx] ?? "");
      setDigits(filled);
      inputs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setDigits((prev) => {
      const copy = [...prev];
      copy[i] = clean;
      return copy;
    });
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const tokens = await verifyEmailCode(email, code);
      storeSession(tokens, email);
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code isn't right. Please try again.");
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(undefined);
    try {
      await resendCode(email);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code.");
    }
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <AuthShell
        as="form"
        onSubmit={submit}
        height="auto"
        nodeId="2096:29770"
        className="py-6"
        heading={
          <AuthHeading
            title="Verify your identity"
            subtitle="Enter the 6-digit verification code sent to your email."
            height="auto"
          />
        }
      >
        <div className={FORM_GAP}>
          <div className="flex w-full flex-col items-center text-center">
            <p className="m-0 text-[16px] font-normal leading-6 tracking-[-0.5px] text-[#ffffffbf]">Code sent to:</p>
            <p className="m-0 text-[18px] font-normal leading-6 text-[#f7f7f7]">{email}</p>
          </div>

          <div className="grid w-full grid-cols-6 gap-2.5">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Verification digit ${i + 1}`}
                maxLength={1}
                className={cn(
                  "h-11 rounded-[12px] border bg-[#ffffff0a] text-center text-[18px] font-medium text-[#f7f7f7] outline-none transition-colors",
                  error ? "border-[#ff4d5a]" : "border-[#ffffff14] focus:border-[#fcd94a]",
                )}
              />
            ))}
          </div>

          <p className="m-0 h-5 text-[14px] font-normal leading-5 text-[#fc4a4a]" role={error ? "alert" : undefined}>
            {error ?? ""}
          </p>

          <AuthButton kind="gold" type="submit" disabled={!complete || submitting}>
            {submitting ? "Verifying…" : "Verify code"}
          </AuthButton>

          <button
            type="button"
            onClick={resend}
            className="m-0 h-6 bg-transparent text-[16px] font-normal leading-6 text-[#ffffffbf] hover:text-[#f7f7f7]"
          >
            {resent ? "Verification code sent" : "Resend verification code"}
          </button>
        </div>
      </AuthShell>
    </div>
  );
}
