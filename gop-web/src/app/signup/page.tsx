import type { Metadata } from "next";

import RegistrationForm from "@/components/auth/RegistrationForm";
import { CABINET_DEFAULT_HREF } from "@/components/cabinet/navigation";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your God of Prompt account to unlock the prompt library, tools, and guides.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full min-h-[calc(100svh-96px)] max-w-[560px] flex-col items-center justify-center px-4 py-12 sm:py-16">
      <RegistrationForm redirectTo={CABINET_DEFAULT_HREF} />
    </main>
  );
}
