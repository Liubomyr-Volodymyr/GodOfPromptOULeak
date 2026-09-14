import PromptLibraryDock from "@/components/prompts/PromptLibraryDock";

/**
 * Prompt-library layout — wraps every /prompt-library route (hub, the pSEO
 * combos, and the prompt detail page) with the sticky left action dock
 * (Search + Custom Prompt generator). The dock is fixed to the viewport, so
 * it stays put across client navigations within the library.
 */
export default function PromptLibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PromptLibraryDock />
    </>
  );
}
