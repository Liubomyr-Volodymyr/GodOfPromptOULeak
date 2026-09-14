import type { Metadata } from "next";

import UserCabinetPreview from "@/components/cabinet/UserCabinetPreview";

export const metadata: Metadata = {
  title: "Support",
};

export default function SupportPage() {
  return <UserCabinetPreview initialSection="support" />;
}
