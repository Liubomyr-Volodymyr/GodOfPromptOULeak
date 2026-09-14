import type { Metadata } from "next";

import GeneratorFaq from "@/components/generator/GeneratorFaq";
import PromptGeneratorClient from "@/components/generator/PromptGeneratorClient";
import Testimonials from "@/components/home/Testimonials";

/**
 * /prompt-generator — Figma 2240:19808. The shared root layout supplies the
 * navbar, dotted background and footer; this route owns the generator,
 * verified customer stories and generator-specific FAQ.
 *
 * Title is BARE — the root layout template appends " — God of Prompt".
 */
export const metadata: Metadata = {
  title: "AI Prompt Generator",
  description:
    "Describe your goal and create a powerful AI prompt for ChatGPT, Claude, Gemini, and other leading AI models.",
  alternates: { canonical: "/prompt-generator" },
};

export default function PromptGeneratorPage() {
  return (
    <>
      <PromptGeneratorClient />
      <Testimonials />
      <GeneratorFaq />
    </>
  );
}
