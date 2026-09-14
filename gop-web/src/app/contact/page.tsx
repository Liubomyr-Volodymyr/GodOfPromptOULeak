import type { Metadata } from "next";

import ContactTabs from "@/components/contact/ContactTabs";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact God of Prompt support or the partnerships team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactTabs />;
}
