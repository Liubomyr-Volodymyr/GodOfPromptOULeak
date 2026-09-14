import Link from "@/components/ui/Link";

/**
 * BundleFeature — "One Bundle. Infinite Superpowers." (Figma 2033:17896).
 * A 3×2 bento of feature cards; each illustration is exported straight from
 * Figma as webp under /images/home/bundle (they're gradient/3D art with
 * filters — SVG export renders them broken in-browser, webp is pixel-exact).
 * Card 1 (the bundle) is the dark card; the rest are light. Text is 1:1.
 *
 * FILENAMES ARE VERSIONED (-v2) on purpose. These two images had their
 * CONTENT replaced while keeping the same path, so browsers and the CDN kept
 * serving the old bytes from cache and the cards still looked wrong. When an
 * image's content changes, change its filename — never overwrite in place.
 */
type Card = {
  img: string;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
  dark?: boolean;
};

const CARDS: Card[] = [
  {
    img: "/images/home/bundle/complete-bundle-v2.webp",
    title: "Complete AI Bundle",
    desc: "Everything in one bundle. All of my prompts, resources and guides with lifetime updates in one click.",
    href: "/complete-ai-bundle",
    dark: true,
  },
  {
    // 06-gpt-instructions art — this card was mislabelled "Prompt Library"
    // while rendering the GPTs illustration, which is why the grid showed
    // "Prompt Library" twice. The file is now named for what it depicts.
    img: "/images/home/bundle/gpts.webp",
    title: "Custom GPTs",
    desc: "Ready-to-deploy custom GPTs with full system-prompt blueprints.",
    href: "/products",
  },
  {
    img: "/images/home/bundle/prompt-copilot.webp",
    title: "Prompt copilot",
    desc: "Never re-explain your business. Your context loads automatically into every prompt.",
    href: "/prompt-generator",
  },
  {
    // The real 02-prompt-library art (was misfiled as prompt-library-2).
    img: "/images/home/bundle/prompt-library-v2.webp",
    title: "Prompt Library",
    desc: "Access the biggest collection of prompts for top AI models.",
    href: "/prompt-library",
  },
  {
    img: "/images/home/bundle/ai-guides.webp",
    title: "One-Click AI Guides",
    desc: "Access the biggest collection of prompts for top AI models.",
    href: "/guides",
  },
  {
    img: "/images/home/bundle/custom-generator.webp",
    title: "Custom Prompt Generator",
    desc: "Create unlimited custom prompts in seconds.",
    href: "/prompt-generator",
  },
];

export default function BundleFeature() {
  const cards = CARDS;
  return (
    <section id="bundle" className="mx-auto w-full max-w-[1280px] px-6 py-20 max-[640px]:px-4 max-[640px]:py-12">
      <div className="text-center">
        <h2 className="m-0 text-[clamp(28px,3.4vw,40px)] font-semibold tracking-[-0.02em] text-gop-ink">
          One Bundle. Infinite Superpowers.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[17px] leading-6 text-gop-ink-muted">
          Everything you need to supercharge your workflow with AI-powered automation and intelligent prompts.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-[640px]:mt-8">
        {cards.map((c, i) => (
          <BentoCard key={i} card={c} />
        ))}
      </div>
    </section>
  );
}

function BentoCard({ card }: { card: Card }) {
  const inner = (
    <>
      {/* illustration (Figma-exported) */}
      <span className={`block ${card.dark ? "bg-gop-card" : "bg-gop-ink-wash"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.img} alt="" loading="lazy" className="block aspect-[427/223] w-full object-cover" />
      </span>
      <span className="block px-6 py-6 max-[640px]:px-5">
        <span className={`block text-[19px] font-semibold tracking-[-0.01em] ${card.dark ? "text-white" : "text-gop-ink"}`}>
          {card.title}
        </span>
        <span className={`mt-2 block text-[15px] leading-6 ${card.dark ? "text-white/60" : "text-gop-ink-muted"}`}>
          {card.desc}
        </span>
      </span>
    </>
  );

  const cls =
    "group flex flex-col overflow-hidden rounded-3xl ring-1 ring-inset no-underline transition-[transform,box-shadow] duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gop-accent-yellow motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
    (card.dark
      ? "ring-white/10 bg-gop-card hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)]"
      : "ring-gop-ink-hairline bg-white hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.28)]");

  return card.external ? (
    <a href={card.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={card.href} className={cls}>
      {inner}
    </Link>
  );
}
