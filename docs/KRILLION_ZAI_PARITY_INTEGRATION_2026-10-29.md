# Krillion parity pass 2 — validated Z.ai integration, 2026-10-29

## Provenance and scope

Integrated the three user-uploaded files from the GLM 5.3 / Z.ai parity pass on an independent branch based on main commit c2f1d87 (PR #31). Source patch: user-supplied `deep-dive-parity-2.patch`; source report: `KRILLION_PARITY_PASS2_2026-10-29.md`. No original application server/database or paid content used. Existing question data, archive, original asset manifest and independent Puffer Party backend were not altered.

### Contributions preserved

- Public-reference-tier blurbs and 21 ocean depth facts, viewport cues and enhanced HUD.
- Question-card frame, countdown fuse/dock, source-style wrong-answer feedback.
- Original-style answer chip, dashed tier milestone, animated rarity banner, depth ambience, mascot event poses.
- Home nav and Puffer Party beta tag with user-owned backend lobby count.
- Reduced motion and mobile summary overflow fixes.

### Additional repairs before merging

1. The HUD had an inherited horizontal translate while the new rule used left 0. Explicitly centered the desktop HUD at 50%, translated back by half width.
2. Countdown fuse was placed outside the answer row and stretched across the viewport. Moved it inside the relative answer row, keeping the 4px cyan timer underline under the input.
3. Accepted autocorrection was replaced immediately by the results view. It now displays a 650ms correction with timer paused and duplicate answers blocked before invoking result transition.
4. Original tier image manifest does not include `tiers/plankton.png` or `tiers/tooclever.png`. Added visible fallback icons for those two tiers, leaving the four existing image assets intact.
5. Removed reset of depth crank within HUD render; reset on next round/start instead, making the impact animation reachable.
6. Wired the recovered verdict strings into the end results screen.
7. Clarified multiplayer count to **IN OPEN LOBBIES** because the API only reports public waiting rooms, not all live players.
8. Bumped CSS/JS cache keys and repaired test assertions.

### Tests

- Node JavaScript syntax check, TypeScript check, lint, all existing tests and new regression tests.
- Headless Chromium desktop 1440x900 and mobile 390x844: 7-round original public daily, typo rejection, accepted correction visible before reveal, score crank, 100-point and 10-point tier sprites/fallback, progress completion, final verdict, and missing tier-image/network error checks.
- Verified HUD horizontal centering and fuse bar contained in answer row at both sizes.
- Desktop and mobile screenshot evidence in Mac temporary files; all permanent test assertions committed in the repository.

### Remaining limitations

- This is **not** the original 14,800px scrolling world/camera model. Z.ai's fixed-viewport overlay is an approximation.
- Original boot, tour and preview phases, full 16,400px themed worlds/gates and exact `ds-done` endgame layout remain unimplemented.
- Sound/animation trigger equivalence and pixel-level parity remain incomplete.
- Neither new accepted-answer records nor original private server/auth were recovered in this pass.
- Z.ai's original report described some presentation details as high fidelity without systematic pixel-difference evidence. Treat results as tested functional progress, not proof of exact clone.

### Next research priority

Investigate the original free `ds-root/data-phase` transitions and continuous vertically scrolling canvas/world model from public browser-distributed JS/CSS (avoid protected endpoints); deliver a component/state mapping with screenshots, then implement incrementally with desktop/mobile multi-step regression tests. Also identify client-visible features missing from our existing clone that previous audits did not discover.
