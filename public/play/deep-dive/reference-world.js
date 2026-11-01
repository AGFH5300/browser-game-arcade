/* Deep Dive scroll-world engine — parity pass 3.
 * Reconstructed from the original public client's publicly observable behavior
 * (krillion.io guest sessions 2026-10-29 at 1440x900 and 390x844):
 *   - one 14,800px world column per dive; trench floor image anchored at 14,020px
 *   - ambient depth facts sit at worldY = depthMeters * 2 - 9  (verified against
 *     all 21 live facts: 60m->111px, 332m->655px, 7000m->13,991px)
 *   - each round is a 2,000px segment (1,000m = 100 points) based at
 *     worldY = previousDepthMeters * 2; tier lines at base + (score/100)*2000
 *     (verified: 0m+plankton->200px, 100m+krillion->2,200px)
 *   - the answer chip spawns at base+180 and sinks to its tier line
 *   - a miss lands its banner at base+80
 *   - the camera is a translate3d(0, t, 0) on the world column with
 *     t = anchorPx - 2*depthMeters plus a small idle "current" drift;
 *     measured anchors: answering ~23% of stage height, reveal ~42.5%,
 *     miss reveal ~29%; big descents ease in-out over ~5-6s (observed
 *     2,000px descent trace), small ones settle in ~3s.
 * The coordinate helpers are pure and exported for unit tests.
 */
(() => {
 'use strict';
 const PX_PER_M = 2;
 const Y_OFFSET = -9;
 const WORLD_H = 14800;
 const FLOOR_TOP = 14020;
 const ROUND_PX = 2000;
 const CHIP_SPAWN_OFFSET = 180;
 const MISS_OFFSET = 80;

 const depthToY = (m) => Math.round((Number(m) || 0) * PX_PER_M + Y_OFFSET);
 const roundBase = (prevM) => (Number(prevM) || 0) * PX_PER_M;
 const tierLineY = (prevM, score) => roundBase(prevM) + (Number(score) || 0) / 100 * ROUND_PX;
 const chipSpawnY = (prevM) => roundBase(prevM) + CHIP_SPAWN_OFFSET;
 const missBannerY = (prevM) => roundBase(prevM) + MISS_OFFSET;
 const anchorsFor = (stageH) => ({
   // Mobile public canvas anchors the first surface wave near y=177/844 (21%),
   // while the desktop original anchors it near y=207/900 (23%).
   answering: stageH * (typeof innerWidth==='number'&&innerWidth<=650?0.21:0.23),
   feedback: stageH * 0.425,
   miss: stageH * 0.29,
   done: stageH * 0.51
 });
 const durationFor = (deltaPx) => {
   const d = Math.abs(Number(deltaPx) || 0);
   return Math.min(5600, Math.max(1200, 900 + d / 500 * 1000));
 };
 const easeInOutCubic = (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

 /* Single camera instance: one rAF loop eases the world transform toward its
  * target and layers a subtle idle drift so the column feels suspended in
  * water, matching the sub-pixel wobble observed while the original idles. */
 let node = null;
 let stageH = 900;
 let value = 0;
 let from = 0;
 let to = 0;
 let startedAt = 0;
 let duration = 0;
 let holdUntil = 0;
 let raf = 0;
 let reduced = false;

 const reducedMotion = () => {
   try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduced = false; }
   return reduced;
 };

 const apply = (v) => {
   if (!node) return;
   node.style.transform = 'translate3d(0,' + v.toFixed(3) + 'px,0)';
 };

 /* The publicly delivered createWorldRenderer and createDescentEngine use
  * max 30fps / 15fps low-power, 6s^-1 exponential camera tracking, and
  * 2.2m sinusoidal current (converted to -4.4px canvas translation).
  * Tier splashes animate the *camera target* over 3.0-4.6s; the camera
  * trails that target rather than easing the world transform independently.
  */
 const sourceEaseSine = p => -(Math.cos(Math.PI * p) - 1) / 2;
 let lastFrame = null;
 let ease = easeInOutCubic;
 let lastRenderedAt = -Infinity;
 const frame = (now) => {
   raf = 0;
   if (!node || !node.isConnected) { node = null; return; }
   const lowPower = document.documentElement.classList.contains('dd-low-power');
   const fps = reducedMotion() ? 2 : lowPower ? 15 : 30;
   if (now - lastRenderedAt < 1000 / fps - 0.5) { raf = requestAnimationFrame(frame); return; }
   lastRenderedAt = now;
   const deltaSeconds = lastFrame == null ? 0 : Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
   lastFrame = now;
   let target = to;
   if (now < holdUntil) target = from;
   else if (duration > 0) {
     const elapsed = now - holdUntil;
     const p = Math.max(0, Math.min(1, elapsed / duration));
     target = from + (to - from) * ease(p);
   }
   // Source client: em += (ep-em) * (1-exp(-6*dt)).
   const tracking = 1 - Math.exp(-6 * deltaSeconds);
   if (reducedMotion()) value = to;
   else value += (target - value) * tracking;
   const current = reducedMotion() ? 0 : -4.4 * Math.sin(0.45 * now / 1000);
   apply(value + current);
   raf = requestAnimationFrame(frame);
 };

 const ensureLoop = () => { if (!raf && node) raf = requestAnimationFrame(frame); };

 const camera = {
   attach(el, height) {
     node = el || null;
     stageH = Math.max(300, Number(height) || 900);
     /* Paint the carried-over camera position immediately so a re-rendered
        world node never flashes at transform 0 before the next frame. */
     apply(value);
     return camera;
   },
   stageHeight() { return stageH; },
   snapTo(y, opts) {
     const anchorless = Number(y) || 0;
     from = to = value = anchorless;
     duration = 0; holdUntil = 0; startedAt = 0;
     lastFrame = null; lastRenderedAt = -Infinity;
     apply(value);
     return camera;
   },
   goTo(y, opts) {
     const target = Number(y) || 0;
     const delta = target - to;
     const dur = opts && opts.dur !== undefined ? Number(opts.dur) : durationFor(delta);
     const hold = opts && opts.hold ? Number(opts.hold) : 0;
     from = value;
     to = target;
     duration = reducedMotion() ? 0 : Math.max(0, dur);
     holdUntil = performance.now() + hold;
     startedAt = performance.now();
     // Source uses sinusoidal ease for Plankton, cubic for other tiers.
     ease = opts?.ease === 'sine' ? sourceEaseSine : easeInOutCubic;
     lastFrame = null;
     lastRenderedAt = -Infinity;
     ensureLoop();
     return camera;
   },
   current() { return value; },
   target() { return to; },
   detach() { if (raf) cancelAnimationFrame(raf); raf = 0; node = null; return camera; }
 };

 window.DeepDiveWorld = {
   PX_PER_M, Y_OFFSET, WORLD_H, FLOOR_TOP, ROUND_PX,
   depthToY, roundBase, tierLineY, chipSpawnY, missBannerY,
   anchorsFor, durationFor, easeInOutCubic, camera
 };
})();
