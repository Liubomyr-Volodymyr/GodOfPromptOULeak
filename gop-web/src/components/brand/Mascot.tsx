import Image from "next/image";

/**
 * Mascot — the God of Prompt mascot illustration library, exported 1:1 from
 * the design system's mascot frames (Figma "🟡 Components" → Gop_1…Gop_5 +
 * variants) as clean vector SVGs under /images/brand/mascot/. One typed
 * component so every use is a properly-named pose, never a raw file path:
 *
 *   <Mascot name="saluting" width={309} />
 *
 * Registry carries each SVG's intrinsic aspect (from its own viewBox — never
 * assume dimensions). `width` scales the pose; height follows the aspect.
 *
 *   reclining   Gop_1   lounging on a cloud, laptop open
 *   announcing  Gop_2   leaning out of a cloud with a megaphone
 *   thumbsUp    Gop_3   thumbs up beside a gold lightning bolt
 *   unlocking   Gop_4   cross-legged, locked laptop + gold key
 *   saluting    Gop_5   scanning the horizon (the 404 pose)
 *   library     Gop_1.1 buried between stacks of books
 *   reading     Gop_1.2 reading with a coffee on a cloud
 *   face        head-only mark (footer / small placements)
 */
const MASCOTS = {
  reclining: { src: "/images/brand/mascot/reclining.svg", w: 4399, h: 3108 },
  announcing: { src: "/images/brand/mascot/announcing.svg", w: 4221, h: 3439 },
  thumbsUp: { src: "/images/brand/mascot/thumbs-up.svg", w: 3547, h: 3324 },
  unlocking: { src: "/images/brand/mascot/unlocking.svg", w: 3749, h: 3154 },
  saluting: { src: "/images/brand/mascot/saluting.svg", w: 3437, h: 3332 },
  library: { src: "/images/brand/mascot/library.svg", w: 2884, h: 2785 },
  reading: { src: "/images/brand/mascot/reading.svg", w: 3472, h: 2490 },
  face: { src: "/images/brand/face.svg", w: 58, h: 82 },
} as const;

export type MascotName = keyof typeof MASCOTS;

export default function Mascot({
  name,
  width = 320,
  className = "",
  priority = false,
  alt = "",
}: {
  name: MascotName;
  /** Rendered width in px; height follows the pose's intrinsic aspect. */
  width?: number;
  className?: string;
  priority?: boolean;
  /** Decorative by default (empty alt). */
  alt?: string;
}) {
  const m = MASCOTS[name];
  const height = Math.round((width * m.h) / m.w);
  return (
    <Image
      src={m.src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
    />
  );
}
