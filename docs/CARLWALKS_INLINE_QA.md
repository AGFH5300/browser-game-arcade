# CarlWalks game-player verification — 2026-10-27

Goal: Play all nine CarlWalks titles **inside Sidequest** instead of sending visitors to another site.

## Player sources

| Title | Player | Evidence |
|---|---|---|
| Moto X3M | `/build_engine/root/moto-x3m/index.html` at carlwalks.com | Browser preview: iframe loads, canvas 720×480, no redirect, no page errors on standalone |
| Moto X3M 2 | `/build_engine/root/moto-x3m-2/index.html` | Browser preview: iframe loads, canvas 720×480, no redirect |
| Moto X3M 3 | `/build_engine/root/moto-x3m-3/index.html` | Standalone HTML responds 200, graphics-intensive runtime not certified in available browser |
| Slope | `/build_engine/root/slope/index.html` | Standalone HTML responds 200, available cloud browser lacks WebGL |
| PolyTrack | `/build_engine/root/polytrack-0.3.1/index.html` | Standalone HTML responds 200, requires WebGL in a GPU-capable browser |
| Crossy Road | `/build_engine/root/crossy-road/index.html` | Standalone HTML responds 200, requires WebGL |
| FNAF (gustacraft123 version) | `/build_engine/root/fnaf/index.html` | Standalone HTML responds 200; ~60MB embedded package, needs WebGL |
| Hextris | locally hosted `/play/hextris/index.html` | Existing hosted player verified |
| Stack | locally hosted `/play/stack/index.html` | Existing hosted player verified |

All seven remote standalone index pages returned HTTP 200 and did not send `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` restrictions during the inspection. Browser-policy restrictions can change; don't treat the absence of restrictions today as a permanent guarantee.

Only the exact seven named archive URLs have privileged third-party frame settings. No wildcard CarlWalks URLs are allowlisted.

## Important limitations

- This fixes **in-page launching**, not universal sound control. Cross-origin JavaScript cannot adjust arbitrary game audio. Full portal mute without restarting requires an authorized self-hosted game build, or the game's own audio API.
- External CarlWalks assets remain dependent on that origin and may be blocked by a managed network. Self-hosting under an authorized distribution is preferable for reliability and independent sound controls.
- Cloud browser has no WebGL. Five titles require testing on a GPU/WebGL-enabled personal browser before calling their gameplay fully verified.
- Do not replace the game with an unrelated remake or silently redirect visitors to Famobi/Y8.
- User states they have permission for these versions, and developer credits/source links are preserved.

## Next QA

On an ordinary Chrome/Edge with WebGL:
1. Open each Sidequest game page, click Play now, wait for the game menu.
2. Confirm frames load without blank screen/console errors.
3. Start gameplay and confirm keyboard/mouse/touch input as applicable.
4. Restart and fullscreen. Check if game sound can be controlled from its own menu.
5. Record per-game success; explicitly label missing/blocked functionality.
