import Image from "next/image";
import type { ReactNode } from "react";

import Icon from "@/components/icon/Icon";

/**
 * Shared visual primitives for the auth surface (Figma 2092/2093 nodes).
 *
 * Both the static handoff gallery (`AuthenticationDialog`) and the functional
 * flow (`RegistrationForm`) render from these exact primitives so the working
 * form can never drift from the approved design. Anything stateful lives in
 * the consumer; everything here is presentation only.
 */

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const AUTH_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.07),0_4px_8px_rgba(0,0,0,0.07),0_8px_16px_rgba(0,0,0,0.07),0_16px_32px_rgba(0,0,0,0.07),0_32px_64px_rgba(0,0,0,0.07)]";

export const FORM_GAP = "flex w-full flex-col items-center gap-5";

export type ShellHeight = "404" | "532" | "568" | "576" | "728" | "848" | "auto";

const SHELL_HEIGHT: Record<ShellHeight, string> = {
  "404": "h-[404px]",
  "532": "h-[532px]",
  "568": "h-[568px]",
  "576": "h-[576px]",
  "728": "h-[728px]",
  "848": "h-[848px]",
  auto: "",
};

export type PasswordRule = {
  label: string;
  state: "idle" | "success" | "error";
};

export function AuthLogo() {
  return (
    <Image src="/images/brand/logo-mark.svg" alt="" width={36} height={36} className="size-9" />
  );
}

export function AuthHeading({
  title,
  subtitle,
  success = false,
  height = "108",
}: {
  title: string;
  subtitle: string;
  success?: boolean;
  height?: "108" | "132" | "auto";
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-3",
        height === "132" ? "h-[132px]" : height === "108" ? "h-[108px]" : "",
      )}
    >
      <AuthLogo />
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <p className="m-0 text-[24px] font-medium leading-7 tracking-[-0.5px] text-[#f7f7f7]">
          {title}
        </p>
        {success ? (
          <div className="flex items-center gap-1">
            <Icon name="check" size={16} className="text-[#2bdd7b]" />
            <p className="m-0 text-[16px] font-normal leading-6 tracking-[-0.5px] text-[#ffffffbf]">
              {subtitle}
            </p>
          </div>
        ) : (
          <p className="m-0 max-w-full text-[16px] font-normal leading-6 tracking-[-0.5px] text-[#ffffffbf]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function AuthShell({
  nodeId,
  height,
  heading,
  children,
  className,
  as = "section",
  onSubmit,
}: {
  nodeId?: string;
  height: ShellHeight;
  heading: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "section" | "form";
  onSubmit?: (e: React.FormEvent) => void;
}) {
  const shared = cn(
    "relative flex w-[502px] max-w-full flex-col items-center gap-6 overflow-hidden rounded-[24px]",
    "bg-gradient-to-b from-[#343333] to-[#242223] px-12 py-6 text-[#f7f7f7] max-[520px]:px-6",
    AUTH_SHADOW,
    SHELL_HEIGHT[height],
    className,
  );

  const inner = (
    <>
      {heading}
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_4px_32px_rgba(222,222,222,0.12)]"
      />
    </>
  );

  if (as === "form") {
    return (
      <form data-figma-node={nodeId} className={shared} onSubmit={onSubmit} noValidate>
        {inner}
      </form>
    );
  }
  return (
    <section data-figma-node={nodeId} className={shared}>
      {inner}
    </section>
  );
}

function ButtonGlow() {
  return (
    <Image
      src="/images/icons/auth-button-glow.svg"
      alt=""
      width={463}
      height={79}
      className="pointer-events-none absolute left-[-7%] top-[-46px] h-[79px] w-[114%] max-w-none"
    />
  );
}

export function AuthButton({
  kind,
  children,
  type = "button",
  onClick,
  disabled = false,
}: {
  kind: "google" | "gold" | "dark";
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  /** Applies the muted, non-interactive visual + blocks the click. */
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-full font-normal",
        "transition-[filter,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcd94a]",
        kind === "dark"
          ? "h-11 border border-white/24 bg-[#242223] px-4 text-[16px] leading-6 text-[#f7f7f7] shadow-[0_0_0_1px_#000]"
          : "h-11 px-4 text-[18px] leading-6",
        !disabled && kind === "google" &&
          "gap-1 border border-[rgba(175,175,175,0.24)] bg-white text-[#4f4e4f] shadow-[0_0_0_1px_#fff] hover:brightness-[0.98] active:translate-y-px",
        !disabled && kind === "gold" &&
          "border border-white/40 text-[#3f3000] shadow-[0_0_0_1px_#fdc302] hover:brightness-[1.03] active:translate-y-px",
        !disabled && kind === "dark" && "hover:bg-white/[0.04] active:translate-y-px",
        disabled && "cursor-not-allowed border border-white/12 bg-white/15 text-white/25 shadow-none",
      )}
      style={!disabled && kind === "gold" ? { background: "var(--gop-gradient-gold)" } : undefined}
    >
      <ButtonGlow />
      {kind === "google" && !disabled && (
        <Image
          src="/images/icons/auth-google.svg"
          alt=""
          width={19}
          height={20}
          className="relative h-5 w-[19px]"
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

export function AuthSeparator({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div className="flex h-5 w-full items-center gap-3">
      <span className="h-px min-w-0 flex-1 bg-white/12" />
      <span
        className={cn(
          "shrink-0 text-center text-[14px] font-normal leading-5",
          muted ? "text-[#ffffffbf]" : "text-[#a8a7a8]",
        )}
      >
        {children}
      </span>
      <span className="h-px min-w-0 flex-1 bg-white/12" />
    </div>
  );
}

export function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] transition-colors",
        checked ? "bg-[#6f6e6f]" : "border border-[#6f6e6f]",
      )}
    >
      {checked && <Icon name="check" size={10} className="text-[#f7f7f7]" />}
    </span>
  );
}

export function PasswordRules({ rules }: { rules: PasswordRule[] }) {
  return (
    <div className="flex w-full flex-col items-start">
      {rules.map((rule) => (
        <div key={rule.label} className="flex h-5 items-center gap-2 text-[14px] font-normal leading-5">
          {rule.state === "idle" ? (
            <span className="flex size-4 items-center justify-center text-[#f7f7f7]">•</span>
          ) : (
            <Icon
              name={rule.state === "success" ? "check" : "close"}
              size={16}
              className={rule.state === "success" ? "text-[#2bdd7b]" : "text-[#fc4a4a]"}
            />
          )}
          <span
            className={cn(
              rule.state === "idle" && "text-[#f7f7f7]",
              rule.state === "success" && "text-[#2bdd7b]",
              rule.state === "error" && "text-[#fc4a4a]",
            )}
          >
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  );
}
