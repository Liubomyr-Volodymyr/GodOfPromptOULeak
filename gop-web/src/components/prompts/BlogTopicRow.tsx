import Link from "@/components/ui/Link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BlogPost } from "@/lib/api";

/**
 * BlogTopicRow — "Read more on the topic: {X}" + three article cards
 * (Figma 1675:6405). White cards, dark art panel on top (CSS-drawn — the
 * blog has no cover images yet), title, "Read Article" link. The whole
 * card is a link to the post.
 */
export default function BlogTopicRow({ topic, posts }: { topic: string; posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-label={`Articles about ${topic}`} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[clamp(22px,2.6vw,32px)] font-normal leading-tight tracking-[-0.01em] text-[#1B1A1A]">
          Read more on the topic: <strong className="font-bold">{topic}</strong>
        </h2>
        <Link
          href="/blog"
          className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[14px] leading-5 text-[#4F4E4F] no-underline shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:text-gop-ink"
        >
          All Articles
          <ChevronDown size={14} className="-rotate-90 text-gop-dark" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={[
              "group flex flex-col gap-3 overflow-hidden rounded-[16px] bg-white pb-4 no-underline",
              "shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-200",
              "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.18)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow",
            ].join(" ")}
          >
            <ArtPanel />
            <div className="flex flex-1 flex-col gap-3 px-4">
              <h3 className="m-0 text-[19px] font-medium leading-6 tracking-[-0.01em] text-gop-ink line-clamp-2">
                {post.title}
              </h3>
              <span className="mt-auto inline-flex items-center gap-1 text-[15px] text-gop-ink-muted transition-colors group-hover:text-gop-ink">
                Read Article
                <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Dark art panel — stands in for the post's cover image (CSS only:
 *  ink surface, soft streaks, gold prompt mark). */
function ArtPanel() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden bg-gop-ink" aria-hidden>
      <span
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 10%, #2d2b2c 0%, transparent 55%), radial-gradient(110% 80% at 85% 90%, #262425 0%, transparent 50%), repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 26px)",
        }}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[64px] font-bold leading-none tracking-tight text-gop-gold transition-transform duration-500 group-hover:scale-105">
          &gt;<span className="text-white/85">_</span>
        </span>
      </span>
    </div>
  );
}
