import Link from "@/components/ui/Link";
import { X } from "lucide-react";
import { hrefWithout, type LibrarySelection, type FacetAxis } from "@/lib/library-selection";

/**
 * ActiveFilterChips — the removable chips for the current selection (Figma
 * 1205:2797). Each chip's ✕ is a real <Link> to the URL with that one facet
 * dropped, so removing a filter is plain navigation (SEO-safe).
 */
export default function ActiveFilterChips({ selection }: { selection: LibrarySelection }) {
  const chips: { axis: FacetAxis; label: string }[] = [];
  if (selection.category) chips.push({ axis: "category", label: selection.category.name });
  if (selection.subcategory) chips.push({ axis: "subcategory", label: selection.subcategory.name });
  if (selection.tool) chips.push({ axis: "tool", label: selection.tool.name });
  if (selection.role) chips.push({ axis: "role", label: selection.role.name });
  if (selection.format) chips.push({ axis: "format", label: selection.format.name });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ axis, label }) => (
        <span
          key={axis}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gop-ink-hairline bg-white pl-3 pr-1.5 text-[13px] font-medium text-gop-ink shadow-gop-xs"
        >
          {label}
          <Link
            href={hrefWithout(selection, axis)}
            aria-label={`Remove ${label} filter`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gop-ink-soft transition-colors hover:bg-gop-ink-hairline hover:text-gop-ink"
          >
            <X size={13} strokeWidth={2.2} />
          </Link>
        </span>
      ))}
    </div>
  );
}
