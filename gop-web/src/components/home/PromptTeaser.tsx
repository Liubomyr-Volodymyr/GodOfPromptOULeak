"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CtaButton from "@/components/ui/CtaButton";
import CheckoutButton from "@/components/products/CheckoutButton";

/**
 * PromptTeaser — the "Stop [typewriter] Guessing. / Start [card carousel]
 * Prompts." dark panel, ported 1:1 from gop-web-temp (typewriter + magnify-
 * blur CardCarousel + twinkling starfield). The starfield twinkle is CSS
 * (gop-web has no GSAP); everything else matches the original timings.
 */

const PHRASES = ["i want to…", "create a…", "can you please..", "stop it…", "this is wrong…", "oh, forget it."];
const CARDS = ["📄 Copying", "✏️ Creating", "📘 Learning", "📂 Managing", "⚙️ Customizing", "🤖 Automating", "💰 Reselling"];

/* ── Typewriter — type, hold, delete, advance (Webflow timings) ── */
function Typewriter() {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(PHRASES.reduce((a, b) => (a.length >= b.length ? a : b), ""));
      return;
    }
    const phrase = PHRASES[idx];
    let t: ReturnType<typeof setTimeout>;
    if (typing) {
      if (display.length < phrase.length) t = setTimeout(() => setDisplay(phrase.slice(0, display.length + 1)), 50);
      else t = setTimeout(() => setTyping(false), 1200);
    } else {
      if (display.length > 0) t = setTimeout(() => setDisplay(display.slice(0, -1)), 25);
      else t = setTimeout(() => { setIdx((idx + 1) % PHRASES.length); setTyping(true); }, 300);
    }
    return () => clearTimeout(t);
  }, [display, typing, idx]);

  return (
    <span className="inline-flex items-center">
      {display}
      <i className="gop-tw-caret" aria-hidden />
    </span>
  );
}

/* ── CardCarousel — magnify-out → magnify-in, IntersectionObserver start ── */
function CardCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [started, setStarted] = useState(false);
  const DISPLAY = 2000, FLIP = 500;

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el || started) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { setTimeout(() => setStarted(true), 1000); obs.disconnect(); break; }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let alive = true;
    const cycle = () => {
      if (!alive) return;
      setPhase("out");
      setTimeout(() => {
        if (!alive) return;
        setActive((i) => (i + 1) % CARDS.length);
        setPhase("in");
        setTimeout(() => { if (!alive) return; setPhase("idle"); setTimeout(cycle, DISPLAY); }, FLIP / 2);
      }, FLIP / 2);
    };
    const t = setTimeout(cycle, DISPLAY);
    return () => { alive = false; clearTimeout(t); };
  }, [started]);

  return (
    <div ref={ref} className="gop-cc" style={{ ["--cc-half" as string]: `${FLIP / 2}ms` }}>
      {CARDS.map((label, i) => {
        const isA = i === active;
        const state = isA && phase === "out" ? "gop-cc-out" : isA && phase === "in" ? "gop-cc-in" : isA ? "gop-cc-active" : "gop-cc-hidden";
        return (
          <div key={label} className={`gop-cc-card ${state}`} aria-hidden={!isA}>
            <span className="gop-cc-title">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Starfield — deterministic positions, CSS twinkle ── */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const STAR_COLORS: Array<[number, string]> = [[80, "#ffffff"], [10, "#fde68a"], [6, "#fda4af"], [4, "#bae6fd"]];
function Starfield({ count = 200, seed = 7 }) {
  const stars = useMemo(() => {
    const rand = mulberry32(seed);
    const pick = () => { const r = rand() * 100; let acc = 0; for (const [w, c] of STAR_COLORS) { acc += w; if (r <= acc) return c; } return "#ffffff"; };
    return Array.from({ length: count }, () => {
      const roll = rand();
      const size = roll < 0.5 ? 1 : roll < 0.8 ? 2 : roll < 0.94 ? 3 : 4;
      return { top: rand() * 100, left: rand() * 100, size, color: pick(), o: 0.55 + rand() * 0.45, dur: 1.6 + rand() * 2.6, delay: rand() * 3 };
    });
  }, [count, seed]);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="gop-star"
          style={{
            top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, background: s.color,
            ["--o" as string]: s.o, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const TEASER_CSS = `
.gop-teaser-panel{opacity:0;transform:translateY(28px) scale(.985);transition:opacity .7s cubic-bezier(.23,1,.32,1),transform .7s cubic-bezier(.23,1,.32,1)}
.gop-teaser-panel.is-in{opacity:1;transform:none}
.gop-star{position:absolute;border-radius:50%;will-change:transform,opacity;animation-name:gop-twinkle;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes gop-twinkle{0%,100%{opacity:var(--o,1);transform:scale(1)}50%{opacity:.06;transform:scale(.55)}}
/* Glass bar — gold-tinted glass pill, top highlight + inner gold glow */
/* Silver / chrome glass pill */
.gop-cc{position:relative;width:100%;max-width:465px;height:clamp(64px,6.7vw,86px);margin:0 auto;border-radius:999px;overflow:hidden;
  background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.08) 45%,rgba(255,255,255,.04) 100%);
  backdrop-filter:blur(12px) saturate(1.05);-webkit-backdrop-filter:blur(12px) saturate(1.05);
  border:1px solid rgba(255,255,255,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -10px 18px rgba(0,0,0,.22),0 14px 36px -16px rgba(0,0,0,.6)}
.gop-cc::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;background:radial-gradient(130% 90% at 50% -12%,rgba(255,255,255,.20),transparent 60%)}
/* glass reflection — bright sheen across the top third */
.gop-cc::before{content:'';position:absolute;left:5%;right:5%;top:3px;height:46%;border-radius:999px;pointer-events:none;z-index:3;background:linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,.06) 70%,transparent)}
.gop-cc-card{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 24px;will-change:transform,opacity,filter}
.gop-cc-title{font-family:var(--font-roboto-mono),ui-monospace,monospace;font-size:clamp(20px,3.4vw,40px);font-weight:500;line-height:1;letter-spacing:-.2px;color:#fff;white-space:nowrap;text-shadow:0 1px 10px rgba(0,0,0,.4)}
.gop-tw-caret{display:inline-block;width:2px;height:1.2em;margin-left:.3em;background:#fde68a;box-shadow:0 0 8px rgba(253,195,2,.7);vertical-align:middle;animation:gop-tw-blink 1s ease-in-out infinite}
@keyframes gop-tw-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.gop-cc-active{z-index:1;opacity:1;transform:translateY(0)}
.gop-cc-hidden{z-index:0;opacity:0;visibility:hidden;transform:translateY(85%)}
.gop-cc-out{z-index:2;animation:gop-cc-out var(--cc-half,250ms) cubic-bezier(.55,0,1,.45) forwards}
.gop-cc-in{z-index:2;animation:gop-cc-in var(--cc-half,250ms) cubic-bezier(.23,1,.32,1) forwards}
@keyframes gop-cc-out{0%{transform:translateY(0);opacity:1;filter:blur(0)}100%{transform:translateY(-85%);opacity:0;filter:blur(6px)}}
@keyframes gop-cc-in{0%{transform:translateY(85%);opacity:0;filter:blur(6px)}100%{transform:translateY(0);opacity:1;filter:blur(0)}}
@media(prefers-reduced-motion:reduce){.gop-star{animation:none}.gop-cc-out,.gop-cc-in{animation:none}.gop-tw-caret{animation:none;opacity:1}.gop-teaser-panel{opacity:1;transform:none;transition:none}}
`;

export default function PromptTeaser({ bundleProductId }: { bundleProductId: string | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) { setShown(true); obs.disconnect(); break; } },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section aria-label="Stop guessing, start prompting" className="mx-auto w-full max-w-[1180px] px-6 py-10 max-[640px]:px-4">
      <style dangerouslySetInnerHTML={{ __html: TEASER_CSS }} />
      <div
        ref={panelRef}
        data-dots-frame
        className={`gop-teaser-panel ${shown ? "is-in" : ""} relative overflow-hidden rounded-[32px] border border-white/[0.1] bg-gop-dark px-[clamp(32px,6vw,88px)] py-[clamp(40px,4.5vw,72px)] text-white shadow-[0_40px_80px_-44px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]`}
      >
        <Starfield />
        {/* soft gold glow from the top */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: "radial-gradient(60% 50% at 50% -8%, rgba(253,195,2,0.09), transparent 70%)" }} />

        <div className="relative z-10">
          <h2 className="sr-only">Stop guessing. Start prompting.</h2>

          {/* compare grid: heading · animation · heading (two rows) */}
          <div className="mb-10 grid grid-cols-[1fr_clamp(220px,30vw,360px)_1fr] items-center gap-x-5 gap-y-4 max-[560px]:grid-cols-1 max-[560px]:gap-y-1.5">
            <span className="justify-self-end font-sans text-[clamp(30px,4.2vw,50px)] font-bold italic leading-none tracking-[-0.04em] text-white/90 max-[560px]:justify-self-center">Stop</span>
            <span className="flex min-h-[52px] w-full items-center justify-center border-b border-white/50 px-2 font-mono text-[clamp(16px,2.4vw,26px)] leading-tight tracking-[-0.6px] text-[#8c8b8c] [white-space:nowrap]">
              <Typewriter />
            </span>
            <span className="justify-self-start font-sans text-[clamp(30px,4.2vw,50px)] font-bold italic leading-none tracking-[-0.04em] text-white/90 max-[560px]:justify-self-center">Guessing.</span>

            <span className="justify-self-end font-sans text-[clamp(30px,4.2vw,50px)] font-bold leading-none tracking-[-0.04em] max-[560px]:justify-self-center">Start</span>
            <CardCarousel />
            <span className="justify-self-start font-sans text-[clamp(30px,4.2vw,50px)] font-bold leading-none tracking-[-0.04em] max-[560px]:justify-self-center">Prompts.</span>
          </div>

          <p className="m-0 mx-auto max-w-[640px] text-center text-[16px] leading-relaxed text-white/65">
            Because why should tech bros be the only ones with unfair advantages?
          </p>

          <div className="mt-7 flex justify-center">
            <CheckoutButton variant="gold" size="lg" productId={bundleProductId}>
              Unlock Premium Bundle
            </CheckoutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
