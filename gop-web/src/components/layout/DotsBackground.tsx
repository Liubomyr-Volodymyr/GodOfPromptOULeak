"use client";

import { useEffect, useRef } from "react";

/**
 * DotsBackground — the page's dot-grid texture with one adaptive
 * interaction: a soft gathering light that trails the cursor, and when
 * the cursor rests on something CLICKABLE the gather re-targets from a
 * point to the element's exact shape — dots attach themselves along the
 * control's true rounded outline (per-corner radii respected, % and
 * elliptical values resolved), like filings around a magnet.
 *
 *   • Clickables only: a, button, [role=button], summary, clickable
 *     inputs. The element's border box + corner radii define the
 *     attractor — chamfered pills, cards with a stretched link, all.
 *   • Locality: the attachment strength also falls off with distance
 *     from the cursor, so a large card lights the stretch of outline
 *     near the pointer (and flows along it), not its whole perimeter.
 *   • Everything is eased; two live slots crossfade when the cursor
 *     hops between controls. No snapping.
 *   • A low-rate watchdog re-validates while the loop is parked on a
 *     control, so an element that unmounts or moves under a stationary
 *     cursor releases cleanly instead of pinning a ghost outline.
 *   • The footer wordmark carve stays: [data-dots-mask="/path.svg"]
 *     rasterises the SVG and removes dots inside the letter contours.
 *
 * Rendering: the static field is drawn once per scroll/resize into an
 * offscreen layer; per frame we restore the previous dirty region from
 * it and redraw only the dots inside the current effect region. Pointer
 * hit testing is coalesced to the next painted frame and only reruns when
 * input changes. RAF runs only while something moves or fades.
 *
 * Mobile gets a proportionally scaled static grid; reduced-motion also
 * stays static. Idle costs nothing.
 * Mounted once at the root, position:fixed, z-index -1.
 */

const DESKTOP_SPACING = 16;
// Fine, crisp points in the brand dark grey — an Apple-sharp dotted field,
// not a soft haze. Thin radius + a deeper resting opacity reads as precise
// ink rather than a faint blur.
const DESKTOP_DOT_RADIUS = 0.6;
const DOT_COLOR = "45, 43, 44";  // gop-dark #2D2B2C, the brand dark grey (was 40,40,40)
const BASE_OPACITY = 0.3;
const MOBILE_BP = 768;
const MOBILE_SCALE_FLOOR = 360;
const MOBILE_DOT_SCALE = 0.8;

// Cursor pool (free space, no clickable under the pointer)
const LIGHT_RADIUS = 160;   // light reach, px
const LIGHT_MAX = 0.4;      // dot opacity at the light's centre
const PULL = 0.26;          // peak gather: brightness leads, displacement stays subtle
const GROW = 0.45;          // dot radius gain at the centre

// Shape attachment (hovering a clickable)
const SHAPE_RANGE = 64;     // influence band around the outline, px
const SHAPE_MAX = 0.55;     // dot opacity right on the outline
const SHAPE_GROW = 0.4;     // dot radius gain on the outline
const SHAPE_MAX_AREA = 0.4; // skip clickables larger than 40% of the viewport
const LOCAL_RADIUS = 260;   // attachment locality around the cursor, px

// Motion — frame-rate-INDEPENDENT exponential smoothing. Each frame the
// easing factor is 1 - exp(-dt/tau), so the cursor trail and the
// attach/release crossfade feel identical at 60Hz and 120Hz and never
// jitter at the settle boundary. Lower tau = snappier, higher = silkier.
const LIGHT_TAU = 110;      // cursor light + glow trail (ms)
const SHAPE_TAU = 150;      // shape attach/release crossfade (ms) — smooth, never snapped
const MAX_DT = 32;          // clamp dt after a stall so nothing teleports
const SETTLE = 0.3;         // px — motion is "settled" under this distance
const WATCHDOG_MS = 220;    // parked-on-a-control revalidation cadence

const MASK_MAX_W = 768;     // rasterised mask resolution (crisp contours)

const CLICKABLE =
  'a, button, [role="button"], summary, input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select';

type Mask = { w: number; h: number; fill: Uint8Array }; // 1 = inside a glyph

type DotProfile = {
  spacing: number;
  radius: number;
};

/** One attractor slot — geometry + eased presence. While engaged, the
 *  rect is re-read every frame so the outline stays glued through
 *  scroll and transform animations. */
type Shape = {
  el: HTMLElement | null;
  l: number; t: number; r: number; b: number;
  rad: [number, number, number, number]; // tl, tr, br, bl
  radW: number; radH: number;            // size the radii were parsed at
  presence: number;
  target: number;
};

function getDotProfile(viewportWidth: number): DotProfile {
  if (viewportWidth >= MOBILE_BP) {
    return { spacing: DESKTOP_SPACING, radius: DESKTOP_DOT_RADIUS };
  }

  const progress = Math.max(
    0,
    Math.min(1, (viewportWidth - MOBILE_SCALE_FLOOR) / (MOBILE_BP - MOBILE_SCALE_FLOOR)),
  );
  const scale = MOBILE_DOT_SCALE + (1 - MOBILE_DOT_SCALE) * progress;

  return {
    spacing: DESKTOP_SPACING * scale,
    radius: DESKTOP_DOT_RADIUS * scale,
  };
}

/** One corner of a computed border-radius → a circular px radius.
 *  Handles "12px", "50%", and elliptical "24px 12px" (averaged). The
 *  computed value keeps percentages, so they must be resolved against
 *  the live rect — parseFloat("50%") would silently mean 50px. */
function parseCorner(v: string, w: number, h: number): number {
  const parts = v.trim().split(/\s+/);
  const one = (tok: string, basis: number) =>
    tok.endsWith("%") ? ((parseFloat(tok) || 0) / 100) * basis : parseFloat(tok) || 0;
  const rx = one(parts[0] ?? "0", w);
  const ry = parts.length > 1 ? one(parts[1], h) : parts[0]?.endsWith("%") ? one(parts[0], h) : rx;
  return (rx + ry) / 2;
}

export default function DotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, height = 0;
    let isMobile = window.innerWidth <= MOBILE_BP;
    let dotProfile = getDotProfile(window.innerWidth);
    const interactive = () => !isMobile && !reducedMotion;

    // The free light: target = raw cursor, pos = eased trail.
    const target = { x: -9999, y: -9999 };
    const light = { x: -9999, y: -9999, glow: 0, glowTarget: 0 };
    let pointerActive = false;

    // Two shape slots: [0] = engaging/active, [1] = releasing.
    const newShape = (): Shape => ({
      el: null, l: 0, t: 0, r: 0, b: 0, rad: [0, 0, 0, 0], radW: 0, radH: 0, presence: 0, target: 0,
    });
    const shapes: [Shape, Shape] = [newShape(), newShape()];

    let rafId: number | null = null;
    let running = false;
    let watchdogId: ReturnType<typeof setTimeout> | null = null;
    let scrollRafId: number | null = null;
    let resizeRafId: number | null = null;
    let hitTestPending = false;
    let lastTime = 0; // ms of the previous frame; 0 = fresh (no dt yet)
    // Previous frame's effect region — restored from the base layer
    // before the new region is drawn (no full-screen blit per frame).
    let prevRegion: { x: number; y: number; w: number; h: number } | null = null;

    // ── Static field layer (offscreen) ─────────────────────────────
    const base = document.createElement("canvas");
    const bctx = base.getContext("2d", { alpha: true });

    // Rasterised SVG masks, keyed by URL.
    const masks = new Map<string, Mask | null>();
    type MaskObs = { l: number; t: number; r: number; b: number; mask: Mask };
    let maskObs: MaskObs[] = [];

    const rasterise = (src: string) => {
      if (masks.has(src)) return;
      masks.set(src, null); // pending
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ar = img.naturalHeight / (img.naturalWidth || 1);
        const w = Math.min(MASK_MAX_W, img.naturalWidth || MASK_MAX_W);
        const h = Math.max(1, Math.round(w * ar));
        const off = document.createElement("canvas");
        off.width = w; off.height = h;
        const octx = off.getContext("2d");
        if (!octx) return;
        octx.drawImage(img, 0, 0, w, h);
        try {
          const data = octx.getImageData(0, 0, w, h).data;
          const n = w * h;
          // The wordmark SVG uses FILLED glyph paths, so alpha alone is
          // the exact letter-body mask. Letter openings (the counters in
          // O, P, R…) are transparent in the SVG — they stay OUT of the
          // mask, so the dotted page shows through them.
          const fill = new Uint8Array(n);
          for (let i = 0; i < n; i++) fill[i] = data[i * 4 + 3] > 40 ? 1 : 0;
          masks.set(src, { w, h, fill });
          redrawBase();
          paintFull();
        } catch { masks.set(src, null); }
      };
      img.src = src;
    };

    const collectMasks = () => {
      maskObs = [];
      document.querySelectorAll<HTMLElement>("[data-dots-mask]").forEach((el) => {
        const src = el.getAttribute("data-dots-mask");
        if (!src) return;
        if (!masks.has(src)) rasterise(src);
        const m = masks.get(src);
        const r = el.getBoundingClientRect();
        if (m && r.width && r.height && r.bottom > 0 && r.top < height)
          maskObs.push({ l: r.left, t: r.top, r: r.right, b: r.bottom, mask: m });
      });
    };

    const onLetter = (sx: number, sy: number): boolean => {
      for (const o of maskObs) {
        if (sx < o.l || sx > o.r || sy < o.t || sy > o.b) continue;
        const u = (sx - o.l) / (o.r - o.l);
        const v = (sy - o.t) / (o.b - o.t);
        const mx = Math.min(o.mask.w - 1, Math.max(0, Math.round(u * (o.mask.w - 1))));
        const my = Math.min(o.mask.h - 1, Math.max(0, Math.round(v * (o.mask.h - 1))));
        if (o.mask.fill[my * o.mask.w + mx]) return true;
      }
      return false;
    };

    /** Walk every on-screen grid point (page-anchored). */
    const eachDot = (fn: (sx: number, sy: number) => void) => {
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;
      const { spacing } = dotProfile;
      const startX = Math.floor(scrollX / spacing) * spacing;
      const endX = Math.ceil((scrollX + width) / spacing) * spacing;
      const startY = Math.floor(scrollY / spacing) * spacing;
      const endY = Math.ceil((scrollY + height) / spacing) * spacing;
      for (let y = startY; y <= endY; y += spacing) {
        for (let x = startX; x <= endX; x += spacing) {
          fn(x - scrollX, y - scrollY);
        }
      }
    };

    const redrawBase = () => {
      if (!bctx) return;
      collectMasks();
      bctx.clearRect(0, 0, width, height);
      const { radius } = dotProfile;
      bctx.fillStyle = `rgba(${DOT_COLOR}, ${BASE_OPACITY})`;
      bctx.beginPath();
      eachDot((sx, sy) => {
        if (maskObs.length && onLetter(sx, sy)) return;
        bctx.moveTo(sx + radius, sy);
        bctx.arc(sx, sy, radius, 0, Math.PI * 2);
      });
      bctx.fill();
    };

    // ── Shape helpers ───────────────────────────────────────────────

    /** Refresh a slot's geometry. Radii re-parse only when the box size
     *  changes (getComputedStyle is not free at 120Hz). Returns true if
     *  the rect moved — the caller keeps animating until it stops. */
    const readShape = (s: Shape): boolean => {
      const el = s.el;
      if (!el || !el.isConnected) { s.target = 0; s.el = null; return false; }
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) { s.target = 0; s.el = null; return false; }
      const moved =
        Math.abs(r.left - s.l) > SETTLE || Math.abs(r.top - s.t) > SETTLE ||
        Math.abs(r.right - s.r) > SETTLE || Math.abs(r.bottom - s.b) > SETTLE;
      s.l = r.left; s.t = r.top; s.r = r.right; s.b = r.bottom;
      if (Math.abs(r.width - s.radW) > 1 || Math.abs(r.height - s.radH) > 1) {
        const cs = getComputedStyle(el);
        const cap = Math.min(r.width, r.height) / 2;
        s.rad = [
          Math.min(parseCorner(cs.borderTopLeftRadius, r.width, r.height), cap),
          Math.min(parseCorner(cs.borderTopRightRadius, r.width, r.height), cap),
          Math.min(parseCorner(cs.borderBottomRightRadius, r.width, r.height), cap),
          Math.min(parseCorner(cs.borderBottomLeftRadius, r.width, r.height), cap),
        ];
        s.radW = r.width; s.radH = r.height;
      }
      return moved;
    };

    /** Signed distance to the shape's rounded outline (negative inside),
     *  honouring each corner's own radius. */
    const sdfShape = (px: number, py: number, s: Shape): number => {
      const cx = (s.l + s.r) / 2, cy = (s.t + s.b) / 2;
      const hw = (s.r - s.l) / 2, hh = (s.b - s.t) / 2;
      const right = px >= cx, bottom = py >= cy;
      const rad = right ? (bottom ? s.rad[2] : s.rad[1]) : (bottom ? s.rad[3] : s.rad[0]);
      const qx = Math.abs(px - cx) - hw + rad;
      const qy = Math.abs(py - cy) - hh + rad;
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - rad;
    };

    /** The clickable for a point — either a real control in the ancestor
     *  chain, or a CONTAINER that a stretched link fills (whole-card
     *  <Link className="absolute inset-0"> pattern: the link is a SIBLING
     *  of the card content, so closest() alone never finds it; the card
     *  itself is the shape the user perceives as clickable). */
    const resolveClickable = (start: Element | null): HTMLElement | null => {
      let depth = 0;
      for (let n = start; n && n !== document.body && depth < 10; n = n.parentElement, depth++) {
        if ((n as HTMLElement).matches?.(CLICKABLE)) return n as HTMLElement;
        const link = n.querySelector<HTMLElement>(":scope > a[href], :scope > button");
        if (link) {
          const rl = link.getBoundingClientRect();
          const rn = n.getBoundingClientRect();
          const covers =
            rn.width > 0 && rn.height > 0 &&
            (rl.width * rl.height) / (rn.width * rn.height) > 0.85 &&
            Math.abs(rl.left - rn.left) < 4 && Math.abs(rl.top - rn.top) < 4;
          if (covers) return n as HTMLElement; // the container IS the shape
        }
      }
      return null;
    };

    /** Resolve the clickable under the pointer into slot 0, demoting the
     *  previous attractor into the releasing slot. Runs at most once per
     *  painted frame (called from tick, never from the event handler). */
    const retarget = () => {
      if (!pointerActive) return;
      const el = document.elementFromPoint(target.x, target.y);
      const hit = resolveClickable(el);
      const usable =
        hit &&
        (() => {
          const r = hit.getBoundingClientRect();
          return (
            r.width > 8 && r.height > 8 &&
            r.width * r.height < width * height * SHAPE_MAX_AREA
          );
        })();

      const active = shapes[0];
      if (usable && hit !== active.el) {
        // demote whatever is fading/active — geometry stays valid even if
        // its element is already gone (el may be null after removal)
        if (active.presence > 0.01) {
          shapes[1] = { ...active, el: null, target: 0 };
        }
        // carry a little of the outgoing intensity into the new outline so a
        // hop between controls eases across instead of dipping to base first
        shapes[0] = { ...newShape(), el: hit, target: 1, presence: active.presence * 0.3 };
        readShape(shapes[0]);
      } else if (!usable && active.el) {
        active.target = 0; // release; keeps el for geometry until faded
      } else if (usable && hit === active.el) {
        active.target = 1;
      }
    };

    /** Engaged = a clickable currently holds the dots. */
    const engaged = () => !!shapes[0].el && shapes[0].target === 1;

    /** Restore the previous frame's region from the base layer. */
    const restorePrev = () => {
      if (!prevRegion) return;
      const { x, y, w, h } = prevRegion;
      ctx.clearRect(x, y, w, h);
      // drawImage throws if the source sub-rect or the base canvas is
      // zero-sized (e.g. a 0px viewport during layout) — guard both.
      if (base.width > 0 && base.height > 0 && w > 0 && h > 0) {
        ctx.drawImage(base, x * pixelRatio, y * pixelRatio, w * pixelRatio, h * pixelRatio, x, y, w, h);
      }
      prevRegion = null;
    };

    /** Full composite — used on resize/scroll/visibility (base changed). */
    const paintFull = () => {
      ctx.clearRect(0, 0, width, height);
      if (base.width > 0 && base.height > 0) {
        ctx.drawImage(base, 0, 0, width, height);
      }
      prevRegion = null;
      paintEffects();
    };

    /** Incremental composite — restore last region, draw the new one. */
    const paint = () => {
      restorePrev();
      paintEffects();
    };

    const paintEffects = () => {
      if (!interactive()) return;

      const lightOn = light.glow > 0.01;
      const live = shapes.filter((s) => s.presence > 0.01);
      if (!lightOn && live.length === 0) return;

      // One bounding region around everything active.
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      if (lightOn) {
        bx0 = light.x - LIGHT_RADIUS; bx1 = light.x + LIGHT_RADIUS;
        by0 = light.y - LIGHT_RADIUS; by1 = light.y + LIGHT_RADIUS;
      }
      for (const s of live) {
        const m = SHAPE_RANGE + 8;
        bx0 = Math.min(bx0, s.l - m); bx1 = Math.max(bx1, s.r + m);
        by0 = Math.min(by0, s.t - m); by1 = Math.max(by1, s.b + m);
      }
      bx0 = Math.max(0, Math.floor(bx0)); by0 = Math.max(0, Math.floor(by0));
      bx1 = Math.min(width, Math.ceil(bx1)); by1 = Math.min(height, Math.ceil(by1));
      if (bx1 <= bx0 || by1 <= by0) return;

      // Clip so dots straddling the region edge compose correctly with
      // the untouched base outside (no double-drawn seam columns).
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx0, by0, bx1 - bx0, by1 - by0);
      ctx.clip();
      ctx.clearRect(bx0, by0, bx1 - bx0, by1 - by0);

      const scrollX = window.pageXOffset, scrollY = window.pageYOffset;
      const { spacing, radius } = dotProfile;
      const gx0 = Math.floor((scrollX + bx0) / spacing) * spacing;
      const gy0 = Math.floor((scrollY + by0) / spacing) * spacing;

      for (let y = gy0; y - scrollY <= by1 + spacing; y += spacing) {
        for (let x = gx0; x - scrollX <= bx1 + spacing; x += spacing) {
          const sx = x - scrollX, sy = y - scrollY;
          let dx = 0, dy = 0, k = 0;

          // free-cursor pool (fades while a shape holds the dots)
          if (lightOn) {
            const ddx = sx - light.x, ddy = sy - light.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < LIGHT_RADIUS) {
              const t = 1 - d / LIGHT_RADIUS;
              const sm = t * t * (3 - 2 * t);
              const kk = sm * light.glow;
              dx += (light.x - sx) * PULL * kk;
              dy += (light.y - sy) * PULL * kk;
              k = Math.max(k, kk);
            }
          }

          // shape attachment — strongest shape wins the displacement
          // (summing overshoots during crossfades); strength is also
          // local to the cursor so big cards light near the pointer.
          let bestF = 0, bestSd = 0, bestShape: Shape | null = null;
          for (const s of live) {
            const sd = sdfShape(sx, sy, s);
            const ad = Math.abs(sd);
            if (ad >= SHAPE_RANGE) continue;
            const t = 1 - ad / SHAPE_RANGE;
            let f = t * t * (3 - 2 * t) * s.presence;
            const cdx = sx - light.x, cdy = sy - light.y;
            const dCur = Math.sqrt(cdx * cdx + cdy * cdy);
            if (dCur < LOCAL_RADIUS) {
              const lt = 1 - dCur / LOCAL_RADIUS;
              f *= lt * lt * (3 - 2 * lt);
            } else {
              f = 0;
            }
            if (f > bestF) { bestF = f; bestSd = sd; bestShape = s; }
          }
          if (bestShape && bestF > 0.001) {
            const e = 1;
            const gx = sdfShape(sx + e, sy, bestShape) - sdfShape(sx - e, sy, bestShape);
            const gy2 = sdfShape(sx, sy + e, bestShape) - sdfShape(sx, sy - e, bestShape);
            const gl = Math.sqrt(gx * gx + gy2 * gy2);
            if (gl > 1e-3) {
              dx += (-gx / gl) * bestSd * bestF;
              dy += (-gy2 / gl) * bestSd * bestF;
              k = Math.max(k, bestF);
            }
            // degenerate gradient (shape centre): no displacement, no glow
          }

          const px = sx + dx, py = sy + dy;
          if (
            maskObs.length &&
            (onLetter(px, py) || onLetter(sx, sy) ||
              onLetter(px + 2, py) || onLetter(px - 2, py) ||
              onLetter(px, py + 2) || onLetter(px, py - 2))
          ) continue;

          const opacity = BASE_OPACITY + (Math.max(SHAPE_MAX, LIGHT_MAX) - BASE_OPACITY) * Math.min(1, k);
          const grow = 1 + Math.max(GROW, SHAPE_GROW) * Math.min(1, k);
          ctx.beginPath();
          ctx.arc(px, py, radius * grow, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${DOT_COLOR}, ${Math.min(1, opacity)})`;
          ctx.fill();
        }
      }

      ctx.restore();
      prevRegion = { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
    };

    /** Parked watchdog — while the loop sleeps on an engaged control,
     *  re-validate at low rate so an element that unmounts or moves
     *  under a stationary cursor releases cleanly. */
    const armWatchdog = () => {
      if (watchdogId) clearTimeout(watchdogId);
      watchdogId = setTimeout(() => {
        watchdogId = null;
        if (running || !engaged()) return;
        const before = shapes[0].el;
        retarget();
        const moved = shapes[0].el ? readShape(shapes[0]) : false;
        if (shapes[0].el !== before || shapes[0].target !== 1 || moved) {
          wake();
        } else {
          armWatchdog();
        }
      }, WATCHDOG_MS);
    };

    /** Animation loop — alive only while something moves or fades. */
    const tick = () => {
      // Time since the previous frame → frame-rate-independent easing.
      // First frame after a wake has no prior timestamp, so fall back to a
      // nominal 60Hz step; a long stall is clamped so nothing teleports.
      const now = performance.now();
      let dt = lastTime ? now - lastTime : 1000 / 60;
      lastTime = now;
      if (dt > MAX_DT) dt = MAX_DT;
      const aLight = 1 - Math.exp(-dt / LIGHT_TAU);
      const aShape = 1 - Math.exp(-dt / SHAPE_TAU);

      // Hit-test only when pointer input changed. The watchdog handles DOM
      // changes under a parked cursor without forcing layout every frame.
      if (hitTestPending) {
        hitTestPending = false;
        retarget();
      }
      light.glowTarget = pointerActive && !engaged() ? 1 : 0;

      light.x += (target.x - light.x) * aLight;
      light.y += (target.y - light.y) * aLight;
      light.glow += (light.glowTarget - light.glow) * aLight;

      let shapesSettled = true;
      for (const s of shapes) {
        if (s.el && s.target > 0) {
          if (readShape(s)) shapesSettled = false; // element still moving
        }
        s.presence += (s.target - s.presence) * aShape;
        if (Math.abs(s.target - s.presence) < 0.01) s.presence = s.target;
        else shapesSettled = false;
        if (s.presence === 0 && s.target === 0) s.el = null;
      }

      paint();

      const lightSettled =
        Math.hypot(target.x - light.x, target.y - light.y) < SETTLE &&
        Math.abs(light.glowTarget - light.glow) < 0.01;
      if (lightSettled && shapesSettled) {
        light.glow = light.glowTarget;
        running = false;
        rafId = null;
        lastTime = 0; // next wake starts fresh, no dt spike across the idle gap
        if (engaged()) armWatchdog();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (watchdogId) { clearTimeout(watchdogId); watchdogId = null; }
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    // ── Events ──────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      // gate per-event, not at mount — a window can start narrow and be
      // resized to desktop (or vice versa) without a remount
      if (!interactive()) return;
      if (light.glow === 0 && light.glowTarget === 0 && !pointerActive) {
        light.x = e.clientX; light.y = e.clientY;
      }
      target.x = e.clientX; target.y = e.clientY;
      pointerActive = true;
      hitTestPending = true;
      wake();
    };
    const onMouseLeave = () => {
      pointerActive = false;
      hitTestPending = false;
      for (const s of shapes) s.target = 0;
      wake();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width <= MOBILE_BP;
      dotProfile = getDotProfile(width);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      if (!interactive()) {
        pointerActive = false;
        hitTestPending = false;
        light.glow = 0;
        light.glowTarget = 0;
        for (const s of shapes) {
          s.el = null;
          s.presence = 0;
          s.target = 0;
        }
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTime = 0;
      }

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      base.width = width * pixelRatio;
      base.height = height * pixelRatio;
      bctx?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      redrawBase();
      paintFull();
    };

    const onResize = () => {
      if (resizeRafId) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        resize();
      });
    };

    // rAF-coalesced (NOT throttled): a time-window throttle drops the
    // trailing scroll event, leaving the carved letter zones misaligned.
    let scrollScheduled = false;
    const onScroll = () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      scrollRafId = requestAnimationFrame(() => {
        scrollScheduled = false;
        scrollRafId = null;
        for (const s of shapes) {
          if (s.el && s.target > 0) readShape(s);
          // releasing ghosts are viewport-frozen — they'd drift against
          // the page-anchored grid, so drop them on scroll
          else if (s.presence > 0) { s.presence = 0; s.target = 0; s.el = null; }
        }
        redrawBase();
        paintFull();
      });
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null; running = false;
        lastTime = 0; // resume fresh; no dt spike from the hidden interval
        if (watchdogId) { clearTimeout(watchdogId); watchdogId = null; }
      } else {
        paintFull();
        wake(); // resume any mid-ease state; tick self-terminates if settled
      }
    };

    resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    // attached unconditionally — gated per-event inside the handlers
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    // dev-only: drive the pointer via postMessage. Synthetic mouse events
    // from devtools/test harnesses run in an isolated world and never
    // reach main-world listeners; postMessage crosses that boundary.
    const onDebugMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data as { __gopDotsPointer?: boolean; x?: number; y?: number } | null;
      if (d?.__gopDotsPointer && typeof d.x === "number" && typeof d.y === "number") {
        onMouseMove({ clientX: d.x, clientY: d.y } as MouseEvent);
      }
    };
    if (process.env.NODE_ENV !== "production") {
      window.addEventListener("message", onDebugMessage);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("message", onDebugMessage);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      if (watchdogId) clearTimeout(watchdogId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed left-0 top-0 -z-10 h-screen w-screen pointer-events-none bg-gop-page"
    />
  );
}
