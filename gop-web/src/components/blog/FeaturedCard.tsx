import Link from "@/components/ui/Link";
import { ArrowUpRight } from "lucide-react";
import { Avatar, Meta, Cover, categoryIcon } from "./blog-ui";
import type { BlogPost } from "@/lib/api";

/**
 * FeaturedCard — the blog index lead story. Dark, gold-accented, split
 * layout: copy on the left, the featured image (or a gold-glow fallback) on
 * the right. The whole card is one link.
 */
export default function FeaturedCard({ post }: { post: BlogPost }) {
  const Icon = categoryIcon(post.category?.slug);
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative grid grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-gop-xl bg-gop-dark text-white no-underline shadow-[0_0_0_1px_rgba(0,0,0,0.6)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow max-[760px]:grid-cols-1"
    >
      <div className="relative z-[1] flex flex-col gap-5 p-10 max-[640px]:p-6">
        <div className="flex items-center gap-2">
          {post.category && (
            <span className="inline-flex items-center gap-1.5 rounded-gop-sm bg-gop-gold px-2.5 py-1 text-[12px] font-semibold text-gop-ink">
              <Icon size={13} strokeWidth={2.2} aria-hidden />
              {post.category.name}
            </span>
          )}
          <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/40">Featured</span>
        </div>
        <h2 className="m-0 max-w-[20ch] font-sans text-[34px] font-bold leading-[1.12] tracking-[-0.01em] text-white max-[900px]:text-[28px] max-[640px]:text-[24px]">
          {post.title}
        </h2>
        <p className="m-0 max-w-[48ch] text-[15px] leading-[1.6] text-white/60 line-clamp-3">{post.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <Avatar name={post.author} dark />
          <Meta author={post.author} date={post.dateLabel} readMins={post.readMins} dark />
        </div>
        <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-gop-accent-yellow">
          Read article
          <ArrowUpRight size={17} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
      <div className="relative min-h-[280px] max-[760px]:min-h-[220px]">
        <Cover src={post.heroImage} alt="" Icon={Icon} large priority />
        {/* subtle left-edge fade so the split reads as one surface */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gop-dark to-transparent max-[760px]:hidden" />
      </div>
    </Link>
  );
}
