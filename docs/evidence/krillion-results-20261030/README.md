# Results fidelity evidence — 30 October 2026

Original: https://krillion.io/ Daily #107, actual seven-round game, 70 points.
Before: production main 471ab72, actual seven-round #107 game, 60 points (round 5 timeout).
Captured in the same cloud browser at its actual 1363×936 viewport. Images have not been resized to represent other viewport sizes.

- `original-top-1363x936.jpg`: result header, global distribution, dive log and bearing.
- `original-bottom-1363x936.jpg`: lower catch/logbook/reset/rating region (scroll capture).
- `before-top-1363x936.jpg`: production results before changes.

Original results include promotional cards, advertisements, account/purchase features and live player statistics. These are not reproduced by this patch. Local results identify recovered answers and local-only history.

After: reviewed feature commit 36f8866b5b8b758a37aa71c06ad39f2e6583f5c3, actual seven-round #107 game, 70 points. Game resumed across an asset-version reload after round 4; completed results also survived reload. The embedded Play now flow loaded release=20261030pass5results3 and displayed the saved score.

- `after-top-1363x936.jpg`: final result header, graph and bearing.
- `after-catch-filter-1363x936.jpg`: expanded answer list filtered to Gymnastics/Plankton, returning actual +10.
- `before-side-by-side.jpg`, `after-side-by-side.jpg`: original on left, corresponding Sidequest state on right.
- `before-overlay-50.jpg`, `after-overlay-50.jpg`: 50% reference/current overlays.
- `masked-difference-report.json`: reproducible regional metrics; run `python scripts/krillion-results-image-diff.py` (Pillow/NumPy).

Mean RGB error before → after: header 24.819 → 16.564; dive log 12.893 → 8.028; bearing 20.973 → 12.037; sky 16.560 → 10.367. This indicates improvement within these masks, not completion.

Observed behavioral checks: seven accepted answers; 70 points / 700m; seven tier images; no fabricated curve for sparse local history; catch list lazy-loads 100 of 204 recovered answers; search across the full set; tier filter returns Gymnastics/+10; clipboard content and COPIED confirmation; completed-score resume; correct embedded iframe version. Console messages inspected were browser-extension metadata errors, not application errors.

## Remaining results differences

- Source global player distribution and live per-answer player counts are not reproduced; local history and recovered-answer counts are labelled as such.
- Original ads, promotional/social/shop cards, question suggestion form, and publisher contact footer are absent. These remain discrepancies, not verified equivalents.
- Native details/select controls differ from source accordion/filter buttons; ratings remain local buttons rather than publisher radios.
- Original canvas fish/particle choreography, sky/title opacity, exact menu dimensions and position, and per-frame surfacing/audio timing remain different or unverified.
- Source reserves an ad/footer gutter; Sidequest fills its iframe. Lower content and responsive behavior therefore differ.
- Exact 1440×900, 1920×1080 and mobile browser captures remain unverified because the available cloud browser is fixed at 1363×936 and local browser installation/preview failed. No screenshot was resized to pretend otherwise.

 Scores, the round-5 outcome, live distribution, countdowns and animated scenery differ and cannot be treated as directly comparable pixels. A global similarity percentage is not a completion criterion.
