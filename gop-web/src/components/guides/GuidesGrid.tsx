"use client";

import { useMemo, useState } from "react";
import { Boxes, ArrowUpDown, LayoutGrid, FileText, ImageIcon, Code2, Presentation, Video, AudioLines } from "lucide-react";
import { FilterDropdown, MenuOption, SegmentedToggle } from "@/components/blocks";
import GuideCard from "./GuideCard";
import type { Guide } from "@/lib/api";

type Sort = "newest" | "updated";

/** Icon per output format. The segment list itself comes from the data
 *  (guideFormats), so a format only appears when a guide actually has it. */
const FORMAT_ICONS: Record<string, React.ReactNode> = {
  Text: <FileText size={14} strokeWidth={2} aria-hidden />,
  Image: <ImageIcon size={14} strokeWidth={2} aria-hidden />,
  Code: <Code2 size={14} strokeWidth={2} aria-hidden />,
  Presentation: <Presentation size={14} strokeWidth={2} aria-hidden />,
  Video: <Video size={14} strokeWidth={2} aria-hidden />,
  Audio: <AudioLines size={14} strokeWidth={2} aria-hidden />,
};

/**
 * GuidesGrid — the filter row + card grid for /guides (Figma 1723:7171 +
 * 1689:9838).
 *
 * Every control here is backed by real data. The Category and Roles dropdowns
 * were removed, not disabled: `categories` is null on all 44 products and
 * there is no role data at all, so they were two permanently dead controls
 * advertising filters that don't exist.
 *
 * Models and the format toggle both read the guide's `llm` field — the backend
 * stores a model (Grok, Claude) or a format (Text, Image) in that one field,
 * so they share state by necessity, and the format segments are derived from
 * what's present rather than hardcoded. Server-rendered first paint → SEO-safe.
 */
export default function GuidesGrid({
  guides,
  models,
  formats,
}: {
  guides: Guide[];
  models: string[];
  /** Output formats actually present in the data (see guideFormats). */
  formats: string[];
}) {
  const segments = [
    { value: "All", label: "All", icon: <LayoutGrid size={14} strokeWidth={2} aria-hidden /> },
    ...formats.map((f) => ({ value: f, label: f, icon: FORMAT_ICONS[f] })),
  ];
  const [model, setModel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("newest");

  const shown = useMemo(() => {
    const list = model ? guides.filter((g) => g.model === model) : guides;
    // Date only — matching getGuides and the date-driven New/Updated badge.
    return [...list].sort((a, b) =>
      sort === "updated"
        ? (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
        : (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  }, [guides, model, sort]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Filter row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            icon={<Boxes size={16} strokeWidth={1.9} />}
            value={model ?? "Models"}
            active={!!model}
            ariaLabel="Filter by model"
          >
            <MenuOption active={!model} onSelect={() => setModel(null)}>All models</MenuOption>
            {models.map((m) => (
              <MenuOption key={m} active={model === m} onSelect={() => setModel(m)}>{m}</MenuOption>
            ))}
          </FilterDropdown>
        </div>

        <div className="flex items-center gap-2.5">
          <FilterDropdown
            icon={<ArrowUpDown size={14} strokeWidth={2} />}
            prefix="Sort by:"
            value={sort === "newest" ? "Newest" : "Recently updated"}
            size="sm"
            align="right"
            ariaLabel="Sort guides"
          >
            <MenuOption active={sort === "newest"} onSelect={() => setSort("newest")}>Newest</MenuOption>
            <MenuOption active={sort === "updated"} onSelect={() => setSort("updated")}>Recently updated</MenuOption>
          </FilterDropdown>

          {/* Text/Image quick-toggle (shared SegmentedToggle block) — drives
              the same model filter; "All" clears it. When a specific model is
              picked (e.g. Grok) no segment reads active. */}
          <SegmentedToggle
            ariaLabel="Filter by format"
            segments={segments}
            value={model === null ? "All" : formats.includes(model) ? model : ""}
            onChange={(v) => setModel(v === "All" ? null : v)}
          />
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      {shown.length === 0 ? (
        <p className="rounded-gop-xl border border-gop-ink-hairline bg-gop-surface px-6 py-16 text-center text-gop-ink-muted">
          No guides match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
          {shown.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </div>
      )}
    </div>
  );
}
