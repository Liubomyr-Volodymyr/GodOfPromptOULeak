import {
  Megaphone, PenLine, TrendingUp, Code2, Palette, Coins, GraduationCap,
  Folder, type LucideIcon,
} from "lucide-react";

/**
 * Category icon bar — the curated top-row of the library (Figma 1617:13029).
 * The Figma uses Hugeicons; we use the project's existing lucide set as
 * visual stand-ins (no new dependency / asset pipeline). Slugs are REAL
 * root categories from content/seo/categories.json, so each icon is a real
 * <Link> to /prompt-library/category/[slug].
 *
 * Order mirrors the hub design: Marketing, Design, Education, Finance,
 * Sales, Coding, Writing (+ "More" appended by CategoryIconBar itself).
 */

export type CategoryBarItem = { slug: string; label: string; Icon: LucideIcon };

export const CATEGORY_BAR: CategoryBarItem[] = [
  { slug: "marketing", label: "Marketing", Icon: Megaphone },
  { slug: "art-and-design", label: "Design", Icon: Palette },
  { slug: "education", label: "Education", Icon: GraduationCap },
  { slug: "finance", label: "Finance", Icon: Coins },
  { slug: "sales", label: "Sales", Icon: TrendingUp },
  { slug: "coding", label: "Coding", Icon: Code2 },
  { slug: "writing", label: "Writing", Icon: PenLine },
];

/** Per-slug icon lookup (bar items + a Folder fallback) for use elsewhere. */
const BY_SLUG = new Map(CATEGORY_BAR.map((c) => [c.slug, c.Icon]));
export function categoryIcon(slug: string | null | undefined): LucideIcon {
  return (slug && BY_SLUG.get(slug)) || Folder;
}
