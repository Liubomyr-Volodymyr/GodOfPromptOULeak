import Icon from "@/components/icon/Icon";
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
  type ShellHeight,
} from "./auth-ui";

/**
 * Static Figma-handoff gallery of every auth screen (Figma 2092/2093 nodes).
 *
 * This is the visual spec — inputs are readOnly, buttons inert — used on
 * /design-system-preview to sign off each state. The WORKING registration
 * flow lives in `RegistrationForm`, which renders from the same primitives
 * in `auth-ui.tsx` so the two can never drift.
 */

export type AuthenticationDialogVariant =
  | "registration-empty"
  | "registration-complete"
  | "registration-validation"
  | "login"
  | "reset-password"
  | "identity-heading"
  | "verify-wrong-otp"
  | "set-password-empty"
  | "set-password-validation"
  | "success-heading";

type AuthenticationDialogProps = {
  variant: AuthenticationDialogVariant;
  className?: string;
};

type AuthFieldProps = {
  label: string;
  value?: string;
  password?: boolean;
  error?: string;
  focused?: boolean;
};

/** Static, readOnly field for the gallery snapshots (never interactive). */
function AuthField({ label, value, password = false, error, focused = false }: AuthFieldProps) {
  const filled = Boolean(value);

  return (
    <label className={cn("flex w-full flex-col", error && "gap-1")}>
      <span
        className={cn(
          "relative flex h-11 w-full items-center rounded-[12px] border bg-[#ffffff0a] px-4",
          error ? "border-[#ff4d5a]" : focused ? "border-[#fcd94a]" : "border-[#ffffff0a]",
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
            readOnly
            value={value ?? ""}
            placeholder={label}
            type="text"
            className={cn(
              "h-5 w-full border-0 bg-transparent p-0 text-[14px] font-normal leading-5 outline-none",
              "text-[#f7f7f7] placeholder:text-[#ffffffbf]",
              error && !filled && "placeholder:text-[#fb3748]",
            )}
          />
        </span>
        {focused && (
          <span
            aria-hidden
            className="absolute bottom-[8px] left-[14px] h-5 w-0.5 rounded-full bg-[#fcd94a]"
          />
        )}
        {password && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Show ${label.toLowerCase()}`}
            className="ml-1 inline-flex size-6 shrink-0 items-center justify-center text-[#8f8e8f]"
          >
            <Icon name="eye" size={24} />
          </button>
        )}
      </span>
      {error && (
        <span className="text-[11px] font-normal leading-4 tracking-[0.2px] text-[#fb3748]">
          {error}
        </span>
      )}
    </label>
  );
}

function RegistrationChecks() {
  return (
    <div className="flex h-24 w-full flex-col gap-2">
      <label className="flex min-h-5 items-center gap-2">
        <CheckboxMark checked={false} />
        <span className="text-[13px] font-normal leading-4 text-[#ffffffbf]">
          I&rsquo;d like to receive marketing communications.
        </span>
      </label>
      <label className="flex min-h-5 items-center gap-2">
        <CheckboxMark checked />
        <span className="text-[13px] font-normal leading-4 text-[#ffffffbf]">
          I&rsquo;d like to receive product updates.
        </span>
      </label>
      <label className="flex min-h-10 items-start gap-2">
        <CheckboxMark checked />
        <span className="text-[13px] font-normal leading-4 text-[#ffffffbf]">
          By continuing, you agree to our{" "}
          <span className="text-[14px] leading-5 underline">Terms of Use</span>
          {" and "}
          <span className="text-[14px] leading-5 underline">Privacy Policy.</span>
        </span>
      </label>
    </div>
  );
}

function RegistrationFields({ state }: { state: "empty" | "complete" | "validation" }) {
  if (state === "validation") {
    return (
      <div className="flex w-full flex-col gap-5">
        <div className="flex w-full gap-2">
          <AuthField label="First name" value="T" focused />
          <AuthField label="Last name" value="Text" />
        </div>
        <AuthField label="Email Address" error="This email address doesn't exist." />
        <AuthField label="Create your password" value="••••••••••••" password />
        <PasswordRules
          rules={[
            { label: "At least 8 characters", state: "success" },
            { label: "One uppercase letter", state: "success" },
            { label: "One number", state: "error" },
            { label: "One special character", state: "idle" },
          ]}
        />
      </div>
    );
  }

  const complete = state === "complete";
  return (
    <div className="flex h-[172px] w-full flex-col gap-5">
      <div className="flex w-full gap-2">
        <AuthField label="First name" value={complete ? "Text" : undefined} />
        <AuthField label="Last name" value={complete ? "Text" : undefined} />
      </div>
      <AuthField label="Email Address" value={complete ? "Text" : undefined} />
      <AuthField label="Create your password" value={complete ? "••••••••••••" : undefined} password />
    </div>
  );
}

function RegistrationPopup({ state }: { state: "empty" | "complete" | "validation" }) {
  const validation = state === "validation";
  const complete = state === "complete";
  const nodeId = validation ? "2093:29402" : complete ? "2092:28225" : "2092:28005";
  const height: ShellHeight = validation ? "848" : "728";

  return (
    <AuthShell
      nodeId={nodeId}
      height={height}
      heading={
        <AuthHeading title="Create an Account" subtitle="Join thousands of users getting AI superpowers" />
      }
    >
      <div className={FORM_GAP}>
        <AuthButton kind="google">Continue with Google</AuthButton>
        <AuthSeparator>Or sign up with</AuthSeparator>
        <RegistrationFields state={state} />
        {complete && <AuthButton kind="gold">Sign in</AuthButton>}
        <RegistrationChecks />
        {!complete && <AuthButton kind="gold" disabled>Sign in</AuthButton>}
        <AuthSeparator muted>Already have an account?</AuthSeparator>
        <AuthButton kind="dark">Sign in here</AuthButton>
      </div>
    </AuthShell>
  );
}

function LoginPopup() {
  return (
    <AuthShell
      nodeId="2092:28801"
      height="576"
      heading={<AuthHeading title="Create an Account" subtitle="Sign in with your password to continue" />}
    >
      <div className={FORM_GAP}>
        <AuthButton kind="google">Continue with Google</AuthButton>
        <AuthSeparator>Or login with</AuthSeparator>
        <div className="flex h-[136px] w-full flex-col gap-5">
          <AuthField label="Email Address" value="JohnDoe@gmail.com" />
          <div className="flex w-full flex-col gap-2">
            <AuthField label="Password" password />
            <p className="m-0 text-right text-[14px] font-normal leading-5 text-[#ffffffbf]">
              Forgot password?
            </p>
          </div>
        </div>
        <AuthButton kind="gold" disabled>Sign in</AuthButton>
        <AuthSeparator>Don&apos;t have an account?</AuthSeparator>
        <AuthButton kind="dark">Create an account</AuthButton>
      </div>
    </AuthShell>
  );
}

function ResetPasswordPopup() {
  return (
    <AuthShell
      nodeId="2092:28829"
      height="404"
      heading={
        <AuthHeading
          title="Reset your password"
          subtitle="Enter your email address and we'll send you a link to reset your password"
          height="132"
        />
      }
    >
      <div className={FORM_GAP}>
        <AuthField label="Email Address" value="JohnDoe@gmail.com" />
        <AuthButton kind="gold">Send reset link</AuthButton>
        <AuthSeparator>Remember your password?</AuthSeparator>
        <AuthButton kind="dark">Back to sign in</AuthButton>
      </div>
    </AuthShell>
  );
}

function IdentityHeading() {
  return (
    <div data-figma-node="2093:29006" className="h-[108px] w-[406px] max-w-full text-[#f7f7f7]">
      <AuthHeading
        title="Verify your identity"
        subtitle="Enter the 6-digit verification code sent to your email."
      />
    </div>
  );
}

function VerifyWrongOtpPopup() {
  return (
    <AuthShell
      nodeId="2096:29770"
      height="532"
      heading={
        <AuthHeading
          title="Verify your identity"
          subtitle="Enter the 6-digit verification code sent to your email."
        />
      }
    >
      <div className={FORM_GAP}>
        <div className="flex h-12 w-full flex-col items-center text-center">
          <p className="m-0 text-[16px] font-normal leading-6 tracking-[-0.5px] text-[#ffffffbf]">
            Code sent to:
          </p>
          <p className="m-0 text-[18px] font-normal leading-6 text-[#f7f7f7]">JohnDoe@gmail.com</p>
        </div>
        <div className="grid h-11 w-full grid-cols-6 gap-2.5">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              aria-label={`Verification digit ${index + 1}`}
              className="h-11 rounded-[12px] border border-[#ff4d5a] bg-[#ffffff0a]"
            />
          ))}
        </div>
        <p className="m-0 h-5 text-[14px] font-normal leading-5 text-[#fc4a4a]">Wrong OTP</p>
        <AuthButton kind="gold" disabled>Verify code</AuthButton>
        <p className="m-0 h-6 text-[16px] font-normal leading-6 text-[#ffffffbf]">
          Resend verification code
        </p>
        <AuthSeparator>Having trouble?</AuthSeparator>
        <AuthButton kind="dark">Back to sign in</AuthButton>
      </div>
    </AuthShell>
  );
}

const IDLE_PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", state: "idle" },
  { label: "One uppercase letter", state: "idle" },
  { label: "One number", state: "idle" },
  { label: "One special character", state: "idle" },
];

const VALIDATION_PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", state: "success" },
  { label: "One uppercase letter", state: "success" },
  { label: "One number", state: "idle" },
  { label: "One special character", state: "error" },
];

function SetPasswordPopup({ validation }: { validation: boolean }) {
  return (
    <AuthShell
      nodeId={validation ? "2093:29579" : "2093:29258"}
      height="568"
      heading={
        <AuthHeading
          title="Set new password"
          subtitle="Enter your email address and we'll send you a link to reset your password"
          height="132"
        />
      }
    >
      <div className={FORM_GAP}>
        <AuthField label="New Password" value={validation ? "••••••••••••" : undefined} password />
        <AuthField label="Confirm new password" password />
        <PasswordRules rules={validation ? VALIDATION_PASSWORD_RULES : IDLE_PASSWORD_RULES} />
        <AuthButton kind="gold" disabled>Update password</AuthButton>
        <AuthSeparator>Remember your password?</AuthSeparator>
        <AuthButton kind="dark">Back to sign in</AuthButton>
      </div>
    </AuthShell>
  );
}

function SuccessHeading() {
  return (
    <div data-figma-node="2093:29355" className="h-[108px] w-[406px] max-w-full text-[#f7f7f7]">
      <AuthHeading title="Success!" subtitle="Password has been updated" success />
    </div>
  );
}

export default function AuthenticationDialog({ variant, className }: AuthenticationDialogProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      {variant === "registration-empty" && <RegistrationPopup state="empty" />}
      {variant === "registration-complete" && <RegistrationPopup state="complete" />}
      {variant === "registration-validation" && <RegistrationPopup state="validation" />}
      {variant === "login" && <LoginPopup />}
      {variant === "reset-password" && <ResetPasswordPopup />}
      {variant === "identity-heading" && <IdentityHeading />}
      {variant === "verify-wrong-otp" && <VerifyWrongOtpPopup />}
      {variant === "set-password-empty" && <SetPasswordPopup validation={false} />}
      {variant === "set-password-validation" && <SetPasswordPopup validation />}
      {variant === "success-heading" && <SuccessHeading />}
    </div>
  );
}
