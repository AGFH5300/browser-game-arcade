# Pass 3 integration and browser visual QA — 2026-10-29

## Provenance and scope

Supplied by GLM 5.3 as `deep-dive-parity-pass3.patch`, SHA-256 `1363768b9c42e2eefb1fb128f142b63698d95c2e1e3364eb78acbdd99e2b6b71`. The patch was imported with `git am` against exactly `90d168c6ea92e36961c7a345e3a5ce837fae886a`; the existing source-based Daily, 105-date historical archive, scored starter banks, publicly recovered art, sound and Puffer Party backend were retained.

The imported code adds a 14,800px world, depth camera, preview phase, two-submit autocorrection, sonar timer, result ratings, logbook and wardrobe gating. It retains the known limitations documented in `KRILLION_PARITY_MATRIX_PASS3.md`: server-supplied response counts/percentiles not available; original player accounts and full pack content not recovered; foreground canvas and full themed column sizes incomplete.

## Additional visual correction during integration

GLM's after-answer screenshot and the initial independent local screenshot visibly lost the bright first-round surface sky, boat and waterline; its title subtitle remained visible at the top, overlapping the live HUD. These were not caught by the original 103 source-level tests.

Added a sky asset layer **inside** `.dd-world` at `top:-23svh` to preserve the camera transform and make the sky scroll out when descending. Hid the `.dd-surface` title while actively diving but retained it for the done/surfacing screen. This restores the bright surface without reverting to the fixed-position, non-scrolling layout.

Updated CSS/JS cache version tags and added a regression assertion for the surface layer.

## Local verification

- `node --check` main gameplay and world module, `npm run typecheck`, `npm run lint` and complete `npm test`.
- Independent Chromium browser tests at **1440×900 and 390×844** using the patched game loaded from a clean static local server.
- Each screen: home, preview, answer dock, underwater world (computed height exactly 14,800px), score feedback and complete end-of-dive.
- Played all seven verified original Daily prompts to the end at both viewport sizes, using scored source answers; checked the bottom-docked sonar, no horizontal overflow and final THE BEARING, THE CATCH (seven rows), NEXT DIVE IN timer.
- No JavaScript page errors and no missing static assets. The static server does not expose Next.js app APIs, so an expected optional `/api/deep-dive/party?list=1` lookup returned 404 locally, excluded from asset failure counts; hosted environment should be tested separately.

**Honest parity limitation:** This checks our rendered behavior and usability, not every original 60fps animation frame. Measurements in GLM's original research report were not independently re-measured from the publisher during integration; treat exactness claims as GLM-supplied public-reference evidence.

## Production release

Merge only after GitHub PR preview is READY, and independently test the Vercel-hosted game via `/games/deep-dive` Play now and direct `/play/deep-dive/index-public-art.html`.
