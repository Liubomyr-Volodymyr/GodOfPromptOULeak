"use client";

import { useMemo, useState } from "react";
import ToolDirectoryCard, { typeLabel } from "./ToolDirectoryCard";
import type { Tool } from "@/lib/api";

/**
 * ToolsDirectory — the AI Tools listing (Figma 1887:9687): a real type filter
 * (built from the tools' own `type` field — no fabricated Category/Roles
 * facets) + the card grid. All 50 tools from the backend; client-side filter
 * since the set is small.
 */
const TYPE_ORDER = [
  "llm",
  "image-ai",
  "video-ai",
  "audio-ai",
  "coding-ai",
  "research-ai",
  "3d-ai",
  "automation-saas",
  "productivity-saas",
];

export default function ToolsDirectory({ tools }: { tools: Tool[] }) {
  const [active, setActive] = useState<string>("all");

  // Types actually present, in canonical order, with counts.
  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tools) counts.set(t.type ?? "other", (counts.get(t.type ?? "other") ?? 0) + 1);
    const ordered = [...TYPE_ORDER.filter((k) => counts.has(k)), ...(counts.has("other") ? ["other"] : [])];
    return ordered.map((key) => ({ key, label: key === "other" ? "Other" : typeLabel(key), count: counts.get(key)! }));
  }, [tools]);

  const shown = active === "all" ? tools : tools.filter((t) => (t.type ?? "other") === active);

  return (
    <div className="flex flex-col gap-6">
      {/* Type filter — real, from the data */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter tools by type">
        <Chip active={active === "all"} onClick={() => setActive("all")} label="All" count={tools.length} />
        {types.map((t) => (
          <Chip key={t.key} active={active === t.key} onClick={() => setActive(t.key)} label={t.label} count={t.count} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <ToolDirectoryCard key={t.slug} tool={t} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors duration-150 motion-reduce:transition-none",
        active
          ? "bg-gop-ink text-white"
          : "border border-gop-ink-hairline bg-white text-gop-ink-muted hover:border-gop-ink-faint hover:text-gop-ink",
      ].join(" ")}
    >
      {label}
      <span className={active ? "text-white/60" : "text-gop-ink-faint"}>{count}</span>
    </button>
  );
}
