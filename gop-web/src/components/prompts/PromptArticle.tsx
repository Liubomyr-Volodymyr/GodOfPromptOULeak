import type { ReactNode } from "react";
import Link from "@/components/ui/Link";
import { Eye, Heart, Bookmark } from "lucide-react";
import ToolChip from "./ToolChip";
import SharePromptMenu from "./SharePromptMenu";
import DonateButton from "./DonateButton";
import PromptTerminal from "./PromptTerminal";
import PromptGuide from "./PromptGuide";
import CustomPromptCTA from "./CustomPromptCTA";
import PromptSummary from "./PromptSummary";
import { formatCount } from "@/lib/utils";
import type { Prompt } from "@/lib/api";

/**
 * PromptArticle — the full prompt page (Figma 1266:4588). Shared by the
 * detail route and the intercepting modal so the popup is the same page.
 *
 * Rhythm (Figma): header block → 24px → terminal card (the dark panel with
 * the white taxonomy strip attached below, one silhouette) → 80px → Prompt
 * Guide → 80px → related → 80px → generate-CTA → long-form summary.
 *
 * `relatedSlot` streams the related row inside <Suspense> on the page.
 */
export default function PromptArticle({
  prompt,
  relatedSlot,
}: {
  prompt: Prompt;
  relatedSlot?: ReactNode;
}) {
  const hasMeta =
    !!prompt.category || !!prompt.subcategory || !!prompt.role || prompt.tools.length > 0;
  return (
    <div className="flex flex-col gap-20 max-[760px]:gap-12">
      <div className="flex flex-col gap-6">
        {/* ── Header (Figma 1557:6163 "Info Box") ──────────────────── */}
        <header className="flex flex-col gap-4">
          {/* title (left) + stat pills / share / donate (right) */}
          <div className="flex items-start justify-between gap-x-6 gap-y-4 max-[760px]:flex-col max-[760px]:items-stretch">
            <h1 className="m-0 min-w-0 font-sans text-gop-subtitle-lg text-[#3f3000]">
              {prompt.title}
            </h1>

            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 max-[760px]:pt-1">
              {prompt.likes > 0 && <StatPill icon={<Heart size={16} strokeWidth={1.6} />} value={formatCount(prompt.likes)} label="likes" />}
              {prompt.bookmarks > 0 && <StatPill icon={<Bookmark size={16} strokeWidth={1.6} />} value={formatCount(prompt.bookmarks)} label="saves" />}
              <StatPill icon={<Eye size={16} strokeWidth={1.7} />} value={formatCount(prompt.views)} label="views" />
              <SharePromptMenu title={prompt.promptName || prompt.title} variant="header" />
              <DonateButton />
            </div>
          </div>

          {/* gold accent bar + updated-on (Figma 1557:6164 "Date Section") */}
          {prompt.publishedAt && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-[15px] w-[2px] rounded-full bg-gop-accent-yellow" />
              <span className="font-sans text-[13px] leading-4 text-gop-mute">
                Updated on: {formatFullDate(prompt.publishedAt)}
              </span>
            </span>
          )}

          {prompt.description && (
            <p className="m-0 max-w-[560px] font-sans text-[13px] leading-4 text-gop-ink-muted">
              {prompt.description}
            </p>
          )}
        </header>

        {/* ── Terminal card — dark panel + attached white meta strip ── */}
        <div>
          <PromptTerminal
            body={prompt.body}
            heroImage={prompt.heroImage}
            title={prompt.promptName || prompt.title}
            tools={prompt.tools}
            attached={hasMeta}
          />

          {/* Taxonomy strip — square top, 16px bottom radius: one card with
              the terminal. Same glass as the terminal's header pill (white/8
              over the block's #1B1A1A + inset highlights) instead of solid
              white, per Robert's call. */}
          {hasMeta && (
            <div
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-b-2xl px-4 py-6 shadow-[inset_0_0.6px_2px_rgba(255,255,255,0.16),inset_0_27px_76px_rgba(255,255,255,0.06)] max-[640px]:px-3 max-[640px]:py-4"
              style={{ background: "linear-gradient(rgba(255,255,255,0.08),rgba(255,255,255,0.08)), #1B1A1A" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {prompt.category && (
                  <InfoPill label="Category" value={prompt.category.name} href={`/prompt-library/category/${prompt.category.slug}`} />
                )}
                {prompt.subcategory && (
                  <InfoPill
                    label="Subcategory"
                    value={prompt.subcategory.name}
                    href={prompt.subcategory.slug ? `/prompt-library/category/${prompt.subcategory.slug}` : undefined}
                  />
                )}
                {prompt.role && (
                  <InfoPill label="Perfect for" value={prompt.role} href={prompt.roleSlug ? `/prompt-library/for/${prompt.roleSlug}` : undefined} />
                )}
              </div>

              {prompt.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-gop-caption text-gop-menu-item-2">Recommended Tools</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {prompt.tools.map((t) => (
                      <ToolChip key={String(t.id)} webName={t.webName ?? t.name} slug={t.slug} size="sm" newTab />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Prompt Guide (Figma 1394:8394) ─────────────────────────── */}
      <PromptGuide prompt={prompt} />

      {/* ── Related prompts (streams on the page, awaited in the modal) ── */}
      {relatedSlot}

      {/* ── "Generate a Custom Prompt" CTA ─────────────────────────── */}
      <CustomPromptCTA />

      {/* ── Collapsible long-form summary (about + how-to) ─────────── */}
      <PromptSummary prompt={prompt} />
    </div>
  );
}

/* ── Taxonomy pill — muted label + value, optionally a crawlable link ──
 * (Figma "Prompt Card Models" 1578:7157: r8, #F7F7F7→#ECEAEA, #EAEAEA edge). */
function InfoPill({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="font-sans text-[11px] leading-4 tracking-[0.2px] text-white/50">{label}</span>
      <span className="font-sans text-[13px] leading-4 text-white/85">{value}</span>
    </>
  );
  // Quiet dark tag on the glass strip — flat white/5, r8, muted text.
  // Deliberately NOT the header actionPill language (solid #242223
  // rounded-full buttons): these are tags, not controls.
  const cls =
    "inline-flex h-8 items-center gap-2 rounded-gop-sm border border-white/[0.08] bg-white/[0.05] px-2 no-underline";
  // Taxonomy pills open their pSEO listing in a new tab — the reader keeps
  // the prompt open while exploring the filtered library.
  return href ? (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      className={`${cls} transition-[border-color,background-color] hover:border-white/[0.16] hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow`}
    >
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/** A display stat as a white pill (likes / saves / views) — Figma 1266:4588.
 *  Deliberately NOT a button: the public page has no like/save action, so it
 *  reads as a count plaque rather than a fake control. */
function StatPill({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <span
      title={`${value} ${label}`}
      className="inline-flex h-8 items-center gap-1 rounded-full border border-[rgba(175,175,175,0.24)] bg-white pl-2 pr-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <span className="inline-flex text-gop-dark" aria-hidden>{icon}</span>
      <span className="font-sans text-[14px] leading-5 text-gop-ink-muted tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** "August 14, 2024" — the long updated-on date shown in the header. */
function formatFullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
