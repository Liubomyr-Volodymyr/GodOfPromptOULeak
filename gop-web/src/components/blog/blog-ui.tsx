import Link from "@/components/ui/Link";
import Image from "next/image";
import {
  Clock, Briefcase, Sparkles, Wrench, Palette, Megaphone,
  Newspaper, Workflow, Code2, PenLine, Tag, type LucideIcon,
} from "lucide-react";
import type { BlogPost, BlogCategory } from "@/lib/api";

/* Shared presentational atoms for the blog surfaces (index, article,
 * category). Server-rendered, GOP brand — Roboto, gold-as-fill, dark/ink
 * surfaces over the global dots background showing through. */

/** Lucide mark per real WordPress category slug (fallback: Tag). */
const CAT_ICON: Record<string, LucideIcon> = {
  "ai-at-work": Briefcase,
  "prompt-engineering": Sparkles,
  "ai-tools": Wrench,
  design: Palette,
  marketing: Megaphone,
  news: Newspaper,
  automation: Workflow,
  coding: Code2,
  writing: PenLine,
};

export function categoryIcon(slug?: string | null): LucideIcon {
  return (slug && CAT_ICON[slug]) || Tag;
}

/** Initials avatar (the CMS payload carries no author photos). */
export function Avatar({ name, dark = false, size = 32 }: { name: string; dark?: boolean; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        dark ? "bg-white/10 text-white" : "bg-gop-ink text-white",
      ].join(" ")}
    >
      {initials}
    </span>
  );
}

/** Author · date · read-time. */
export function Meta({ author, date, readMins, dark = false }: { author: string; date: string; readMins: number; dark?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col text-[12.5px] ${dark ? "text-white/55" : "text-gop-ink-soft"}`}>
      <span className={`truncate font-medium ${dark ? "text-white/85" : "text-gop-ink"}`}>{author}</span>
      <span className="inline-flex items-center gap-1.5">
        {date}
        {readMins > 0 && (
          <>
            <span aria-hidden>·</span>
            <Clock size={12} strokeWidth={2} aria-hidden />
            {readMins} min
          </>
        )}
      </span>
    </div>
  );
}

/** Featured image (next/image), or a dark gold-glow fallback with the mark. */
export function Cover({
  src, alt, Icon, large = false, priority = false,
}: { src: string | null; alt: string; Icon: LucideIcon; large?: boolean; priority?: boolean }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={large ? "(max-width: 760px) 100vw, 620px" : "(max-width: 900px) 100vw, 380px"}
        priority={priority}
        className="object-cover"
      />
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden bg-gop-dark">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-[70%] w-[70%]"
        style={{ background: "radial-gradient(circle at 70% 30%, rgba(253,195,2,0.22), transparent 70%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
      />
      <Icon aria-hidden size={large ? 132 : 64} strokeWidth={1} className="absolute bottom-4 right-5 text-white/[0.12]" />
    </div>
  );
}

/** Small category tag — links to the archive. Sits above card overlay links. */
export function CategoryTag({ category, onDark = false }: { category: BlogCategory | null; onDark?: boolean }) {
  if (!category) return null;
  const Icon = categoryIcon(category.slug);
  return (
    <Link
      href={`/blog/category/${category.slug}`}
      className={[
        // w-fit so the pill never stretches inside a flex-col (which defaults to align stretch)
        "relative z-[2] inline-flex w-fit items-center gap-1.5 rounded-gop-sm px-2.5 py-1 text-[12px] font-semibold no-underline transition-colors",
        onDark ? "bg-gop-gold text-gop-ink hover:brightness-105" : "bg-gop-ink/[0.06] text-gop-ink hover:bg-gop-ink/10",
      ].join(" ")}
    >
      <Icon size={13} strokeWidth={2.2} aria-hidden />
      {category.name}
    </Link>
  );
}

/** Filter pill for the index category rail. */
export function CategoryChip({ label, href, icon: Icon, active = false }: { label: string; href: string; icon?: LucideIcon; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium no-underline transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
        active
          ? "bg-gop-dark text-white"
          : "border border-gop-ink-hairline bg-gop-surface text-gop-ink-muted hover:border-gop-ink-faint hover:text-gop-ink",
      ].join(" ")}
    >
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden />}
      {label}
    </Link>
  );
}

/** Post card for the grid + related rows — image cover, category tag, meta. */
export function PostCard({ post }: { post: BlogPost }) {
  const Icon = categoryIcon(post.category?.slug);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[20px] ring-1 ring-inset ring-gop-ink-hairline bg-gop-surface transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-gop-ink-faint hover:shadow-[0_18px_38px_-16px_rgba(0,0,0,0.22)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gop-accent-yellow">
      <div className="relative h-44 overflow-hidden">
        <Cover src={post.heroImage} alt="" Icon={Icon} />
        <div className="absolute left-3 top-3">
          <CategoryTag category={post.category} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="m-0 font-sans text-[18px] font-bold leading-[1.25] tracking-[-0.01em] text-gop-ink line-clamp-2">
          {/* stretched link makes the whole card clickable; tag stays above */}
          <Link href={`/blog/${post.slug}`} className="text-gop-ink no-underline after:absolute after:inset-0 after:z-[1] after:content-['']">
            {post.title}
          </Link>
        </h3>
        <p className="m-0 text-[13.5px] leading-[1.55] text-gop-ink-muted line-clamp-2">{post.excerpt}</p>
        <div className="mt-auto flex items-center gap-2.5 pt-3">
          <Avatar name={post.author} />
          <Meta author={post.author} date={post.dateLabel} readMins={post.readMins} />
        </div>
      </div>
    </article>
  );
}
