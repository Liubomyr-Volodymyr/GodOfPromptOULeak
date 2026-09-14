import type { Metadata } from "next";
import { getPrompts } from "@/lib/api";
import { Heading, Text } from "@/components/typography";
import PromptCard from "@/components/prompts/PromptCard";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /prompt-library/all — server-rendered browse-everything grid. The
 * SEO hub lives at /prompt-library; this is the flat catalogue view it
 * links into ("Browse all prompts").
 *
 * Cache: 5-minute revalidation via Next.js `fetch()` (set in
 * src/lib/api/prompts.ts).
 */
export const metadata: Metadata = {
  title: "All Prompts — Browse the full library",
  description:
    "Browse every prompt in the God of Prompt library. Battle-tested prompts for ChatGPT, Claude, Gemini, Cursor and every other model.",
  alternates: { canonical: `${SITE_ORIGIN}/prompt-library/all` },
};

export default async function AllPromptsPage() {
  const prompts = await getPrompts({ limit: 36, offset: 0 });

  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 py-10 max-[640px]:px-4 max-[640px]:py-6">
      {/* Page header */}
      <header className="mb-8">
        <Text variant="caption" tone="soft" className="uppercase tracking-[0.1em] font-medium">
          Library
        </Text>
        <Heading level={3} as="h1" className="mt-1">
          All Prompts
        </Heading>
        <Text variant="body-lg" tone="muted" className="mt-3 max-w-[60ch]">
          Every prompt across every major AI tool — battle-tested,
          structured, and ready to paste.
        </Text>
      </header>

      {/* Grid */}
      {prompts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-gop-lg border border-dashed border-gop-ink-hairline bg-white p-12 text-center">
      <Text tone="muted">
        No prompts returned from the API. Check{" "}
        <code className="rounded bg-gop-ink-hairline px-1.5 py-0.5 text-gop-code font-mono">
          NEXT_PUBLIC_API_BASE_URL
        </code>{" "}
        is set.
      </Text>
    </div>
  );
}
