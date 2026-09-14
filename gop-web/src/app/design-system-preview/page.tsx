import type { Metadata } from "next";

import AuthenticationDialog, {
  type AuthenticationDialogVariant,
} from "@/components/auth/AuthenticationDialog";
import RegistrationForm from "@/components/auth/RegistrationForm";
import TopNavigation from "@/components/layout/TopNavigation";

export const metadata: Metadata = {
  title: "Design system component preview",
  robots: { index: false, follow: false },
};

const DESIGNS: Array<{
  nodeId: string;
  title: string;
  group: string;
  variant: AuthenticationDialogVariant;
}> = [
  {
    nodeId: "2092:28005",
    title: "Registration — empty",
    group: "Registration form",
    variant: "registration-empty",
  },
  {
    nodeId: "2092:28225",
    title: "Registration — completed",
    group: "Registration form",
    variant: "registration-complete",
  },
  {
    nodeId: "2093:29402",
    title: "Registration — validation",
    group: "Registration form",
    variant: "registration-validation",
  },
  {
    nodeId: "2092:28801",
    title: "Sign in",
    group: "Sign-in form",
    variant: "login",
  },
  {
    nodeId: "2092:28829",
    title: "Reset password",
    group: "Password recovery",
    variant: "reset-password",
  },
  {
    nodeId: "2093:29006",
    title: "Verify identity heading",
    group: "Reusable heading",
    variant: "identity-heading",
  },
  {
    nodeId: "2096:29770",
    title: "Verify identity — wrong OTP",
    group: "Verification form",
    variant: "verify-wrong-otp",
  },
  {
    nodeId: "2093:29258",
    title: "Set new password — empty",
    group: "New-password form",
    variant: "set-password-empty",
  },
  {
    nodeId: "2093:29579",
    title: "Set new password — validation",
    group: "New-password form",
    variant: "set-password-validation",
  },
  {
    nodeId: "2093:29355",
    title: "Success heading",
    group: "Reusable heading",
    variant: "success-heading",
  },
];

const ELEMENT_GROUPS = [
  "Popup shell and branded heading",
  "Fields, password visibility, OTP cells and validation states",
  "Google, accent, disabled and dark action buttons",
  "Separators, preference checks and password rules",
  "Registration, sign-in, recovery and verification compositions",
];

const NAVIGATION_VARIANTS = [
  {
    key: "signed-out",
    title: "Signed out",
    description: "Sign In action and the complete public navigation.",
    variant: "signed-out" as const,
    showNotifications: false,
  },
  {
    key: "signed-in",
    title: "Signed in",
    description: "Account control for an authenticated user.",
    variant: "signed-in" as const,
    showNotifications: false,
  },
  {
    key: "signed-in-notifications",
    title: "Signed in with notifications",
    description: "Authenticated variation with the notification action.",
    variant: "signed-in" as const,
    showNotifications: true,
  },
] as const;

export default function DesignSystemPreviewPage() {
  return (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f7f7] text-[#242223]">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-12 sm:px-8">
        <header className="mb-14">
          <p className="m-0 text-[13px] font-medium uppercase tracking-[0.12em] text-[#a8a7a8]">
            Isolated design-system handoff
          </p>
          <h1 className="mt-2 text-[40px] font-bold leading-12 tracking-[-0.5px]">
            Navigation and authentication
          </h1>
          <p className="mt-4 max-w-[720px] text-[16px] leading-6 text-[#777677]">
            Reusable components rebuilt from the supplied Figma nodes. This route is isolated
            from product flows so the main implementation can adopt each element deliberately.
          </p>
        </header>

        <section aria-labelledby="navigation-heading" className="mb-24">
          <div className="mb-8">
            <p className="m-0 text-[13px] font-medium uppercase tracking-[0.12em] text-[#777677]">
              Top navigation
            </p>
            <h2
              id="navigation-heading"
              className="mt-2 text-[28px] font-semibold tracking-[-0.5px]"
            >
              All account variations
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-[#777677]">
              Hover or keyboard-focus Prompt Copilot to expand it from its icon to the
              full label. Hover or focus Tools to inspect AI Tools, MCPs and Skills.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {NAVIGATION_VARIANTS.map((item) => (
              <article key={item.key}>
                <div className="mb-3">
                  <h3 className="m-0 text-[16px] font-medium">{item.title}</h3>
                  <p className="mt-1 text-[14px] text-[#777677]">{item.description}</p>
                </div>
                <TopNavigation
                  variant={item.variant}
                  accountInitials="RY"
                  showNotifications={item.showNotifications}
                />
              </article>
            ))}
          </div>
        </section>
      </div>

      <section
        aria-labelledby="authentication-heading"
        className="bg-[#242223] px-5 py-16 text-[#f7f7f7] sm:px-8"
      >
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-14">
            <p className="m-0 text-[13px] font-medium uppercase tracking-[0.12em] text-[#a8a7a8]">
              Authentication
            </p>
            <h2
              id="authentication-heading"
              className="mt-2 text-[28px] font-semibold tracking-[-0.5px]"
            >
              Ten supplied states
            </h2>
            <ol className="mt-6 grid max-w-[900px] gap-x-10 gap-y-2 pl-5 text-[14px] leading-5 text-[#ffffffbf] sm:grid-cols-2">
              {ELEMENT_GROUPS.map((group) => (
                <li key={group}>{group}</li>
              ))}
            </ol>
          </div>

          <section aria-labelledby="live-registration" className="mb-20 rounded-[24px] border border-white/10 bg-white/[0.02] p-6 sm:p-10">
            <div className="mb-6">
              <p className="m-0 text-[12px] font-medium uppercase tracking-[0.1em] text-[#5cd6a0]">
                Functional · wired to gop-back
              </p>
              <h3 id="live-registration" className="mt-1 text-[20px] font-semibold leading-7 text-[#f7f7f7]">
                Live registration
              </h3>
              <p className="mt-2 max-w-[560px] text-[14px] leading-5 text-[#ffffffbf]">
                The real sign-up flow (also at <code className="text-[#a8a7a8]">/signup</code>). The consent ticks are
                genuine checkboxes: &ldquo;marketing communications&rdquo; → <code className="text-[#a8a7a8]">marketing_emails</code>,
                &ldquo;product updates&rdquo; → <code className="text-[#a8a7a8]">product_updates</code>, both sent in the
                POST&nbsp;/api/auth/register payload. Terms is a required gate. Submitting emails a 6-digit code and
                advances to verification.
              </p>
            </div>
            <RegistrationForm className="justify-start" />
          </section>

          <div className="grid items-start gap-x-10 gap-y-16 min-[1120px]:grid-cols-2">
            {DESIGNS.map((item, index) => (
              <section key={item.nodeId} aria-labelledby={`auth-design-${index}`}>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="m-0 text-[12px] font-medium uppercase tracking-[0.1em] text-[#a8a7a8]">
                      {item.group}
                    </p>
                    <h3
                      id={`auth-design-${index}`}
                      className="mt-1 text-[18px] font-medium leading-6 text-[#f7f7f7]"
                    >
                      {item.title}
                    </h3>
                  </div>
                  <code className="shrink-0 text-[12px] text-[#a8a7a8]">
                    {item.nodeId}
                  </code>
                </div>
                <AuthenticationDialog variant={item.variant} className="justify-start" />
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
