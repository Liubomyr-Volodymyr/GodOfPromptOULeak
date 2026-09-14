import Image from "next/image";

/**
 * HeroIllustration — the "Chilling God" mascot with the six model-logo tiles
 * floating independently around it (mirrors the old Webflow hero). Every asset
 * is a real Figma export (node 10152:10275): the mascot alone (`mascot.webp`),
 * and each tile exported as a single complete card SVG via the Figma REST API
 * (`tile-*.svg` — the 3D isometric card, logo, and shadow baked together).
 *
 * Pure CSS — no JS island. Sized in `cqw` against the stage container so the
 * scene scales fluidly; each tile gets its own float keyframe (staggered
 * duration/delay) so the logos drift independently. Honors reduced-motion.
 */

type Tile = {
  key: string;
  /** complete tile SVG (Figma REST export) */
  file: string;
  left: string;
  top: string;
  /** tile width in cqw */
  w: number;
  dur: string;
  delay: string;
  /** float vertical travel in cqw */
  rise: number;
};

const TILES: Tile[] = [
  { key: "chatgpt", file: "tile-chatgpt.svg", left: "21%", top: "7%", w: 20, dur: "7.5s", delay: "-0.4s", rise: 3.4 },
  { key: "deepseek", file: "tile-deepseek.svg", left: "60%", top: "9%", w: 20, dur: "8.4s", delay: "-2.2s", rise: 3.0 },
  { key: "midjourney", file: "tile-midjourney.svg", left: "79%", top: "35%", w: 20, dur: "6.9s", delay: "-1.1s", rise: 3.8 },
  { key: "claude", file: "tile-claude.svg", left: "0%", top: "43%", w: 20, dur: "9.1s", delay: "-3.1s", rise: 3.2 },
  { key: "gemini", file: "tile-gemini.svg", left: "23%", top: "78%", w: 20, dur: "7.9s", delay: "-1.7s", rise: 4.0 },
  { key: "grok", file: "tile-grok.svg", left: "62%", top: "78%", w: 20, dur: "8.7s", delay: "-2.7s", rise: 3.5 },
];

const CSS = `
.gop-illu{position:relative;width:100%;max-width:480px;margin-inline:auto;aspect-ratio:531/340;container-type:inline-size}
.gop-illu-mascot{position:absolute;left:-1%;bottom:-1%;width:80%;height:auto;z-index:10;animation:gop-bob 6.5s ease-in-out infinite;will-change:transform}
@keyframes gop-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-1.6cqw) rotate(-.35deg)}}
.gop-tile{position:absolute;height:auto;z-index:20;animation:gop-tfloat var(--d) ease-in-out infinite;animation-delay:var(--dl);will-change:transform}
@keyframes gop-tfloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(calc(var(--r)*-1)) rotate(.6deg)}}
@media(prefers-reduced-motion:reduce){.gop-illu-mascot,.gop-tile{animation:none}}
`;

export default function HeroIllustration() {
  return (
    <div className="gop-illu" aria-hidden>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Image
        src="/home/hero/mascot.webp"
        alt=""
        width={1000}
        height={749}
        priority
        fetchPriority="high"
        className="gop-illu-mascot select-none"
      />
      {TILES.map((t) => (
        // Decorative floating logos — lazy + async-decoded so they yield
        // bandwidth/main-thread to the priority mascot (the LCP element).
        // SVG viewBox gives an intrinsic ratio, so cqw width + height:auto
        // reserves space → no CLS.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.key}
          src={`/home/hero/${t.file}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="gop-tile select-none"
          style={{
            left: t.left,
            top: t.top,
            width: `${t.w}cqw`,
            ["--d" as string]: t.dur,
            ["--dl" as string]: t.delay,
            ["--r" as string]: `${t.rise}cqw`,
          }}
        />
      ))}
    </div>
  );
}
