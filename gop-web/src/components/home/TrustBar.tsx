import { Sparkles, Package, LayoutGrid, BellRing, type LucideIcon } from "lucide-react";
import { STATS } from "@/lib/home";

/**
 * TrustBar — the stats row as DS icon-cards (Figma 1895:16378). Values stay
 * honest — no fabricated "30,000+"/"10K+". Server-rendered. (The "works with
 * every major model" chip row was removed — not in the current design.)
 */
// Icon per stat, in STATS order (prompts · products · categories · cadence).
const STAT_ICONS: LucideIcon[] = [Sparkles, Package, LayoutGrid, BellRing];

// "Trusted by" logo marquee — the SAME 13 logos that run on the published
// Webflow homepage (.trusted-holder/.logos-row, mirrored 1:1 by the old repo),
// in the same order, rendered flat light-grey. Auto-scrolls left (45s loop,
// pauses on hover, static under reduced-motion). TODO(links): Robert is
// providing destination URLs — wrap each in an <a> once they land.
const PARTNERS: { src: string; alt: string }[] = [
  { src: "/logos/partners/toolify-ai.svg", alt: "Toolify.ai" },
  { src: "/logos/partners/ai-for-that.avif", alt: "There's an AI for That" },
  { src: "/logos/partners/openai.svg", alt: "OpenAI" },
  { src: "/logos/partners/product-hunt.svg", alt: "Product Hunt" },
  { src: "/logos/partners/kimi.svg", alt: "Kimi" },
  { src: "/logos/partners/invideo.svg", alt: "invideo" },
  { src: "/logos/partners/veed.svg", alt: "VEED" },
  { src: "/logos/partners/rocket-beta.svg", alt: "Rocket Beta" },
  { src: "/logos/partners/copilot.svg", alt: "Copilot" },
  { src: "/logos/partners/higgsfield.svg", alt: "Higgsfield" },
  { src: "/logos/partners/lovable.svg", alt: "Lovable" },
  { src: "/logos/partners/claude.svg", alt: "Claude" },
  { src: "/logos/partners/emergent.svg", alt: "Emergent" },
];

const MARQUEE_CSS = `
.gop-logo-marquee{overflow:hidden;mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent);-webkit-mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent)}
.gop-logo-track{display:flex;align-items:center;gap:56px;width:max-content;padding-right:56px;animation:gop-logo-scroll 45s linear infinite;will-change:transform}
.gop-logo-marquee:hover .gop-logo-track{animation-play-state:paused}
@keyframes gop-logo-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.gop-logo-track{animation:none;flex-wrap:wrap;justify-content:center;width:auto;padding-right:0}.gop-logo-track>[data-dup]{display:none}.gop-logo-marquee{mask-image:none;-webkit-mask-image:none}}
`;

export default function TrustBar() {
  return (
    <section aria-label="Trust signals" className="mx-auto w-full max-w-[1180px] px-6 max-[640px]:px-4">
      <div className="border-t border-gop-ink-hairline pt-8">
        {/* Laurel trust badge (Figma 2033:17213) — the wreaths + text are one
            exported SVG; sr-only text carries it to crawlers/AT. */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home/laurel.svg"
            alt="Trusted by 20,000+ entrepreneurs & marketers"
            width={262}
            height={62}
            className="h-[62px] w-auto"
          />
        </div>

        {/* "Trusted by" logo marquee — the Webflow homepage's running logo
            row (13 logos, same order), 32px below the laurel. The set is
            rendered twice; the track slides -50% for a seamless loop. */}
        <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
        <div className="gop-logo-marquee mb-10 mt-8" role="img" aria-label="Featured by Toolify.ai, There's an AI for That, OpenAI, Product Hunt, Kimi, invideo, VEED, Rocket Beta, Copilot, Higgsfield, Lovable, Claude, and Emergent">
          <div className="gop-logo-track">
            {[false, true].map((dup) =>
              PARTNERS.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${p.src}${dup ? "-dup" : ""}`}
                  src={p.src}
                  alt=""
                  height={22}
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                  data-dup={dup ? "" : undefined}
                  className="h-[22px] w-auto shrink-0 opacity-45 [filter:grayscale(1)]"
                />
              )),
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s, i) => {
            const Icon = STAT_ICONS[i] ?? Sparkles;
            return (
              <div
                key={s.label}
                className="flex items-center gap-3.5 rounded-gop-lg border border-gop-ink-hairline bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-gop-md bg-gop-ink-wash text-gop-ink-muted">
                  <Icon size={20} strokeWidth={1.9} aria-hidden />
                </span>
                <div className="min-w-0">
                  <dd className="m-0 font-mono text-[20px] font-medium leading-none tracking-[-0.01em] text-gop-ink">
                    {s.value}
                  </dd>
                  <dt className="mt-1 text-[13px] leading-4 text-gop-ink-soft">{s.label}</dt>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
