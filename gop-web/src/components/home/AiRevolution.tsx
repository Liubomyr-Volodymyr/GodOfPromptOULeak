import { Check, X } from "lucide-react";
import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "@/components/products/CheckoutButton";

/**
 * AiRevolution — "AI Revolution Accelerates" (Figma 2033:20012): the adoption
 * area-chart, then four "before → after" rows, then the bundle CTA.
 *
 * Chart data is REAL and cited (verified 2026-07-17): McKinsey's State of AI
 * surveys — % of organizations using AI in at least one business function.
 * 2017 20% · 2018 47% · 2019 58% · 2022 50% · 2023 55% · 2024 72% ·
 * 2025 88% (latest survey; "88 percent report regular AI use in at least one
 * business function, compared with 78 percent a year ago"). 2020–21 omitted
 * (not re-verified) — the line interpolates. Source link goes to McKinsey.
 */
const SOURCE_URL = "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai";

const SERIES: [year: number, pct: number][] = [
  [2017, 20],
  [2018, 47],
  [2019, 58],
  [2022, 50],
  [2023, 55],
  [2024, 72],
  [2025, 88],
];

const ROWS: { pain: string; gain: string }[] = [
  { pain: "Wasting hours writing a prompt that won't work?", gain: "Generating the perfect prompt in seconds" },
  { pain: "Content team burning $10K/month on freelancers?", gain: "Creating unlimited content with prompts" },
  { pain: "Design quotes at $5,000+?", gain: "Designing brand identities for $0" },
  { pain: "Hiring costly graphics for content?", gain: "Generating quality visuals in seconds" },
];

/* ── tiny chart geometry (server-side, no chart lib) ────────────────── */
const W = 1080;
const H = 300;
const PAD = { l: 16, r: 56, t: 34, b: 34 };

function xFor(year: number): number {
  const [min, max] = [SERIES[0][0], SERIES[SERIES.length - 1][0]];
  return PAD.l + ((year - min) / (max - min)) * (W - PAD.l - PAD.r);
}
function yFor(pct: number): number {
  return PAD.t + (1 - pct / 100) * (H - PAD.t - PAD.b);
}

/** Catmull-Rom → cubic bézier for the design's soft curve. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function AiRevolution({ bundleProductId }: { bundleProductId: string | null }) {
  const pts = SERIES.map(([yr, pct]) => ({ x: xFor(yr), y: yFor(pct) }));
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const area = `${line} L ${last.x} ${H - PAD.b} L ${pts[0].x} ${H - PAD.b} Z`;
  const years = Array.from({ length: 2025 - 2017 + 1 }, (_, i) => 2017 + i);

  return (
    <section aria-label="AI adoption is accelerating" className="mx-auto w-full max-w-[1180px] px-6 py-14 max-[640px]:px-4 max-[640px]:py-10">
      <div className="mb-8 text-center">
        <h2 className="m-0 text-[clamp(26px,3.2vw,38px)] font-semibold tracking-[-0.02em] text-gop-ink">
          AI Revolution Accelerates
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[16px] leading-6 text-gop-ink-muted">
          Companies using AI in at least one business function
        </p>
      </div>

      {/* Adoption area chart — real McKinsey series (see module doc) */}
      <figure className="m-0">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Share of companies using AI in at least one business function, 2017 to 2025, rising from 20% to 88%" className="h-auto w-full">
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDC302" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FDC302" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* gridlines */}
          {[25, 50, 75, 100].map((g) => (
            <line key={g} x1={PAD.l} x2={W - PAD.r} y1={yFor(g)} y2={yFor(g)} stroke="#161415" strokeOpacity="0.06" />
          ))}
          <path d={area} fill="url(#revFill)" />
          <path d={line} fill="none" stroke="#FDC302" strokeWidth="3.5" strokeLinecap="round" />
          {/* data dots */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FDC302" stroke="#fff" strokeWidth="2" />
          ))}
          {/* latest-value marker pill */}
          <g>
            <line x1={last.x} x2={last.x} y1={last.y} y2={PAD.t - 6} stroke="#161415" strokeOpacity="0.25" strokeDasharray="3 4" />
            <rect x={last.x - 30} y={PAD.t - 30} width="60" height="26" rx="13" fill="#fff" stroke="#16141514" />
            <text x={last.x} y={PAD.t - 12} textAnchor="middle" fontSize="14" fontWeight="600" fill="#161415">
              88%
            </text>
          </g>
          {/* x labels */}
          {years.map((yr) => (
            <text key={yr} x={xFor(yr)} y={H - 10} textAnchor="middle" fontSize="13" fill="#161415" fillOpacity="0.45">
              {yr}
            </text>
          ))}
        </svg>
        <figcaption className="mt-2 text-center text-[13px] text-gop-ink-soft">
          88% of companies now use AI in at least one business function.{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gop-ink">
            Source
          </a>
        </figcaption>
      </figure>

      <ul className="m-0 mt-9 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {ROWS.map((r) => (
          <li
            key={r.pain}
            className="flex flex-col gap-3 rounded-2xl border border-gop-ink-hairline bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <span className="flex items-start gap-2.5 text-[15px] leading-6 text-gop-ink-muted">
              <X size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
              {r.pain}
            </span>
            <span className="flex items-start gap-2.5 text-[15px] font-medium leading-6 text-gop-ink">
              <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
              {r.gain}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-9 flex justify-center">
        <CheckoutButton variant="gold" size="md" productId={bundleProductId}>
          Unlock Premium Bundle
        </CheckoutButton>
      </div>
    </section>
  );
}
