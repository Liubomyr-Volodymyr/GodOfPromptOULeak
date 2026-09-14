"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import CabinetAccountSettings from "./CabinetAccountSettings";
import CabinetEmptyTab from "./CabinetEmptyTab";
import CabinetNotifications from "./CabinetNotifications";
import CabinetPrompts from "./CabinetPrompts";
import CabinetShell from "./CabinetShell";
import { useUserStore } from "@/lib/store/user-store";
import type { CurrentUser } from "@/lib/api";
import type { CabinetSection, CabinetUser } from "./types";

function toCabinetUser(user: CurrentUser): CabinetUser {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

export default function UserCabinetPreview({
  initialSection = "prompts",
}: {
  initialSection?: CabinetSection;
}) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const status = useUserStore((s) => s.status);
  const refresh = useUserStore((s) => s.refresh);
  const clear = useUserStore((s) => s.clear);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // No token, an expired session, or a fetch failure all land the store on
  // "signed-out" — for a cabinet page that means "you shouldn't be here," so
  // bounce home rather than render a blank shell around no data.
  useEffect(() => {
    if (status === "signed-out") router.replace("/");
  }, [status, router]);

  const logout = () => {
    clear();
    router.replace("/");
  };

  if (!user) {
    return (
      <section className="fixed inset-0 z-40 grid place-items-center bg-gop-card text-gop-menu-item-2">
        Loading your account…
      </section>
    );
  }

  const cabinetUser = toCabinetUser(user);

  return (
    <CabinetShell activeSection={initialSection} user={cabinetUser} onLogout={logout}>
      {initialSection === "prompts" ? <CabinetPrompts /> : null}
      {initialSection === "products" ? <CabinetEmptyTab title="Products" /> : null}
      {initialSection === "settings" ? <CabinetAccountSettings user={cabinetUser} /> : null}
      {initialSection === "notifications" ? <CabinetNotifications /> : null}
      {initialSection === "support" ? <CabinetEmptyTab title="Support" /> : null}
    </CabinetShell>
  );
}
