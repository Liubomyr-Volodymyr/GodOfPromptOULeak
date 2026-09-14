import type { Metadata } from "next";

import UserCabinetPreview from "@/components/cabinet/UserCabinetPreview";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default function AccountPage() {
  return <UserCabinetPreview initialSection="settings" />;
}
