import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ArrowUpRight, Sparkles, WandSparkles } from "lucide-react";
import ToolsDirectory from "@/components/tools/ToolsDirectory";
import { getTools } from "@/lib/api";
import { SITE_ORIGIN } from "@/lib/seo/site";

/**
 * /tools — the AI Tools directory (Figma 1887:9687). All tools sourced from
 * the backend `tools` collection. This is the first of the planned directory
 * surfaces (tools / MCPs / skills / loops) that share this chrome.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  // Bare — the root layout appends the brand.
  title: "AI Tools",
  description: "Every AI tool worth using, curated by God of Prompt — LLMs, image, video, audio, coding, research and more.",
  alternates: { canonical: `${SITE_ORIGIN}/tools` },
};

const GENERATOR_URL = "/prompt-generator";

export default async function ToolsDirectoryPage() {
  const tools = await getTools();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "AI Tools", item: `${SITE_ORIGIN}/tools` }],
  };

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6 pb-20 pt-14 max-[640px]:px-4 max-[640px]:pb-12 max-[640px]:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Hero */}
      <header className="text-center">
        <h1 className="m-0 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-gop-ink max-[640px]:text-[30px]">
          AI Tools by <span className="italic">God of Prompt</span>
        </h1>
        <p className="mx-auto mt-4 mb-0 max-w-xl text-[16px] leading-6 text-gop-ink-muted">
          Explore easy-to-follow guides for the top AI models, updated monthly.
        </p>

        {/* Header CTAs */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <CtaPill
            href="/prompt-generator"
            dark
            Icon={Sparkles}
            title="Prompt Copilot"
            sub="Customise prompts for max result"
          />
          <CtaPill href={GENERATOR_URL} Icon={WandSparkles} title="Custom Prompts" sub="Create your own prompt" />
        </div>
      </header>

      {/* Directory */}
      <div className="mt-14 max-[640px]:mt-10">
        <ToolsDirectory tools={tools} />
      </div>
    </div>
  );
}

/* ── header CTA pill (two-line, arrow-out) ───────────────────────────── */

function CtaPill({
  href,
  external,
  dark,
  Icon,
  title,
  sub,
}: {
  href: string;
  external?: boolean;
  dark?: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  sub: string;
}) {
  const base =
    "group inline-flex items-center gap-3 rounded-full px-5 py-2.5 no-underline transition-transform duration-150 ease-out hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-accent-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none";
  const skin = dark
    ? "bg-gop-card text-white border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_12px_28px_-12px_rgba(0,0,0,0.6)]"
    : "bg-white text-gop-ink border border-gop-ink-hairline shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
  const inner = (
    <>
      <Icon size={22} className={dark ? "text-gop-accent-yellow" : "text-gop-accent-yellow"} aria-hidden />
      <span className="flex flex-col text-left leading-tight">
        <span className={`text-[15px] font-semibold ${dark ? "text-white" : "text-gop-ink"}`}>{title}</span>
        <span className={`text-[12.5px] ${dark ? "text-white/55" : "text-gop-ink-muted"}`}>{sub}</span>
      </span>
      <ArrowUpRight size={17} className={dark ? "text-white/45" : "text-gop-ink-faint"} aria-hidden />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${skin}`}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={`${base} ${skin}`}>
      {inner}
    </Link>
  );
}
