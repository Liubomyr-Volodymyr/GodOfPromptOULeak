import type { Metadata } from "next";

import UserCabinetPreview from "@/components/cabinet/UserCabinetPreview";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return <UserCabinetPreview initialSection="notifications" />;
}
