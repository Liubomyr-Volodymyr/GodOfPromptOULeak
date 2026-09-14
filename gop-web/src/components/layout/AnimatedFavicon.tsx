"use client";

import { useEffect } from "react";

/**
 * AnimatedFavicon — the ">_" mark winking in the browser tab.
 *
 * WHY CANVAS + PNG, NOT AN SVG DATA URI
 * Browsers do not animate SVG favicons (no CSS animation, no SMIL), so the
 * keyframes in app/icon.svg never run in a tab — that file is the static
 * fallback. Animation means swapping the icon frame by frame, and the frame
 * format matters: Safari is unreliable at re-rasterising an SVG data URI on
 * href change, while a PNG data URI repaints in Chrome, Safari, Firefox and
 * Edge alike. Each frame is drawn to a canvas and exported as PNG.
 *
 * WHY IT WASN'T ANIMATING AT ALL
 * Next emits icon links from app/favicon.ico and app/icon.svg, and those come
 * AFTER any link appended at runtime. Browsers resolve to the last (most
 * specific) icon link, so the .ico won and the animated link was never
 * consulted. This component detaches every other icon link, owns exactly one,
 * and restores them on unmount. They're React-rendered, so a MutationObserver
 * re-detaches whatever a re-render puts back.
 *
 * The link NODE is replaced (not re-pointed) each frame: Chrome and Safari both
 * skip repaints on a same-node href change often enough to read as broken.
 *
 * TWO CADENCES, BECAUSE BACKGROUND TABS ARE THROTTLED
 * A foreground tab gets the full eased wink at FRAME_MS. Background tabs clamp
 * timers to ~1s, which is why a single fast loop looked like it only ran on the
 * selected tab: the sub-second frames queued up and fired as one indivisible
 * burst, so the eye appeared never to move. Hidden tabs therefore get ONE frame
 * per second — the whole budget — spent on a legible four-step blink rather
 * than a single hard snap. It cannot be made fluid there: sub-second frames do
 * not survive the clamp in any browser, and Chrome's "intensive throttling"
 * drops silent background pages to ~1/min after five minutes, which no page can
 * opt out of. Smooth is a foreground-only promise.
 *
 * Frames are PRE-RENDERED once at mount — LEVELS PNGs — so animating is an
 * array lookup, not a canvas export per frame.
 */

const CHEVRON =
  "M20.6085 22L10.5892 28L9 25.4079L14.6908 21.9999L9 18.592L10.5892 16L20.6085 22Z";
const CURSOR = "M35 20.0701V23.1009H24.5131V20.0701H35Z";
/**
 * The chevron's shut state: a dash matching the cursor's weight, sitting in the
 * chevron's own slot. The eye doesn't squash to a sliver and vanish — it closes
 * INTO a second dash, so the shut frame reads ">_" -> "-_" -> two dashes.
 * Geometry is taken from CURSOR: same 3.03 height, same ~10.5 length, centred on
 * the chevron's vertical midpoint (y=22) and starting at its left edge (x=9).
 */
const CHEVRON_DASH = "M19.49 20.485V23.515H9V20.485H19.49Z";

const SIZE = 64;
/** Eyelid positions pre-rendered between fully open and nearly shut. More
 *  levels = a finer ramp; 28 at 35ms reads as travel rather than steps. */
const LEVELS = 28;
const SHUT = 0.06;
/** Foreground frame interval. */
const FRAME_MS = 35;
/** Gap between winks. A tab icon that moves often is noise in the periphery —
 *  this should register only if you happen to be looking at it. */
const CYCLE_MS = 11000;
/** Hidden tabs: 1s is the fastest tick that survives the background clamp, so
 *  the blink is spelled out one frame per second — half, shut, half, open —
 *  instead of a single hard snap. Four seconds of motion, then rest. */
const HIDDEN_TICK_MS = 1000;
const HIDDEN_REST_TICKS = 6;

/** roundRect is missing in older Safari — fall back to arcTo. */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One frame. `open` is the chevron's vertical scale: 1 open, SHUT closed. */
function drawFrame(ctx: CanvasRenderingContext2D, open: number): void {
  ctx.clearRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = "#2D2B2C";
  roundRect(ctx, 0, 0, SIZE, SIZE, 14);
  ctx.fill();

  // Ring brightens as the eye shuts (icon.svg's outline-pulse). A 3.5 stroke
  // straddles the path, so the rect is inset by half of it and the radius drops
  // to match — otherwise the ring clips flat against the canvas edge.
  ctx.save();
  ctx.globalAlpha = 0.72 + (1 - open) * 0.28;
  ctx.strokeStyle = "#DEDDDE";
  ctx.lineWidth = 3.5;
  roundRect(ctx, 1.75, 1.75, SIZE - 3.5, SIZE - 3.5, 12.25);
  ctx.stroke();
  ctx.restore();

  // Glyph — same transform as the SVG (translate 2, scale 1.36).
  ctx.save();
  ctx.translate(2, 2);
  ctx.scale(1.36, 1.36);
  const gold = ctx.createLinearGradient(22, 28, 22, 16);
  gold.addColorStop(0.5, "#FDC302");
  gold.addColorStop(1, "#ECDF5F");
  ctx.fillStyle = gold;

  // Chevron closing into a dash. `lid` is 1 with the eye open and 0 shut, so
  // the chevron fades out completely as it squashes while the dash fades in —
  // at the shut frame the ">" is GONE and only the two dashes remain.
  const lid = Math.max(0, (open - SHUT) / (1 - SHUT));
  const chevronAlpha = Math.pow(lid, 0.55);

  if (chevronAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = chevronAlpha;
    ctx.translate(14.8, 22);
    ctx.scale(1, open);
    ctx.translate(-14.8, -22);
    ctx.fill(new Path2D(CHEVRON));
    ctx.restore();
  }

  if (chevronAlpha < 0.99) {
    ctx.save();
    ctx.globalAlpha = 1 - chevronAlpha;
    ctx.fill(new Path2D(CHEVRON_DASH));
    ctx.restore();
  }

  ctx.fill(new Path2D(CURSOR));
  ctx.restore();
}

/** easeInOutSine — no hard start or stop, which is what made it feel abrupt. */
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/**
 * Eyelid position over ONE wink, as indices into the pre-rendered frames.
 * Down and up are eased and NOT symmetric: a lid closes faster than it opens,
 * and the brief hold shut is what reads as a blink rather than a glitch.
 *
 * Deliberately a single wink. The double wink that was here read as a twitch:
 * two movements inside a second, repeating, is the thing the eye keeps
 * catching in the corner of the screen.
 */
function buildTimeline(): number[] {
  const seq: number[] = [];
  const ramp = (steps: number, from: number, to: number) => {
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      seq.push(Math.round(from + (to - from) * t));
    }
  };
  const last = LEVELS - 1; // fully shut
  ramp(8, 0, last); // close (280ms)
  seq.push(last, last, last); // hold shut (105ms)
  ramp(14, last, 0); // open, slower (490ms)
  return seq;
}

export default function AnimatedFavicon() {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof Path2D === "undefined") return; // no canvas → keep the static icon

    // Pre-render every eyelid position once (open → shut).
    const frames: string[] = [];
    for (let i = 0; i < LEVELS; i++) {
      drawFrame(ctx, 1 - (1 - SHUT) * ease(i / (LEVELS - 1)));
      frames.push(canvas.toDataURL("image/png"));
    }
    const OPEN = 0;
    const CLOSED = LEVELS - 1;

    /* ── own the one icon link ───────────────────────────────────────── */
    const isOurs = (el: Element) => (el as HTMLLinkElement).dataset?.gopAnimatedFavicon === "true";
    const ICON_SEL = 'link[rel="icon"], link[rel="shortcut icon"], link[rel~="icon"]';
    const parked: { el: HTMLLinkElement; next: ChildNode | null; parent: ParentNode | null }[] = [];
    const detach = (el: HTMLLinkElement) => {
      if (isOurs(el)) return;
      parked.push({ el, next: el.nextSibling, parent: el.parentNode });
      el.remove();
    };
    document.head.querySelectorAll<HTMLLinkElement>(ICON_SEL).forEach(detach);
    const observer = new MutationObserver((records) => {
      for (const rec of records) {
        rec.addedNodes.forEach((n) => {
          if (n instanceof HTMLLinkElement && n.matches(ICON_SEL)) detach(n);
        });
      }
    });
    observer.observe(document.head, { childList: true });

    let current: HTMLLinkElement | null = null;
    let shown = -1;
    const show = (index: number) => {
      if (index === shown) return; // same frame → no repaint
      shown = index;
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.setAttribute("sizes", `${SIZE}x${SIZE}`);
      link.dataset.gopAnimatedFavicon = "true";
      link.href = frames[index];
      current?.remove();
      document.head.appendChild(link);
      current = link;
    };

    show(OPEN);

    const restore = () => {
      observer.disconnect();
      current?.remove();
      parked.forEach(({ el, next, parent }) => parent?.insertBefore(el, next));
    };

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return restore;

    /* ── two cadences ────────────────────────────────────────────────── */
    const timeline = buildTimeline();
    let timer = 0;
    let step = 0;

    const tickForeground = () => {
      if (step < timeline.length) {
        show(timeline[step++]);
        timer = window.setTimeout(tickForeground, FRAME_MS);
        return;
      }
      step = 0;
      show(OPEN);
      timer = window.setTimeout(tickForeground, CYCLE_MS);
    };

    // Hidden: one frame per second is the whole budget, so spend it on a
    // legible blink — half-shut, shut, half-open, open — then rest. A single
    // shut frame was easy to miss entirely; blinking every tick was a strobe.
    const HALF = Math.round((LEVELS - 1) / 2);
    const hiddenSeq = [HALF, CLOSED, HALF, OPEN];
    let hiddenTick = 0;
    const tickHidden = () => {
      const phase = hiddenTick % (hiddenSeq.length + HIDDEN_REST_TICKS);
      show(phase < hiddenSeq.length ? hiddenSeq[phase] : OPEN);
      hiddenTick++;
      timer = window.setTimeout(tickHidden, HIDDEN_TICK_MS);
    };

    const start = () => {
      window.clearTimeout(timer);
      step = 0;
      if (document.hidden) {
        timer = window.setTimeout(tickHidden, HIDDEN_TICK_MS);
      } else {
        show(OPEN);
        timer = window.setTimeout(tickForeground, 1200);
      }
    };

    document.addEventListener("visibilitychange", start);
    start();

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", start);
      restore();
    };
  }, []);

  return null;
}
