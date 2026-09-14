import type { Metadata } from "next";

import UserCabinetPreview from "@/components/cabinet/UserCabinetPreview";

export const metadata: Metadata = {
  title: "My Prompts",
};

export default function PromptsPage() {
  return <UserCabinetPreview initialSection="prompts" />;
}
