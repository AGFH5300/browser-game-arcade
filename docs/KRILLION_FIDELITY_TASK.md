# Krillion fidelity task — 30 October 2026

Goal: source-backed visual and behavioral parity in the existing reconstruction.
Context: latest main verified at 471ab72 (#37); branch fix/krillion-results-fidelity.
Constraints: preserve recovered assets/data/progress; no invented peer statistics; auth/payments excluded.
Done when: five requested checkpoints have browser evidence, focused checks, review, and verified deployment.

## Current checkpoint: 1 — results (in progress)
- Read public fidelity audit and Pass 5 notes. Original Daily #106 expired during scoring; reloaded #107 and resumed actual gameplay.
- First concrete correction: removed fabricated distribution for fewer than five comparable local runs. Retained score axis/marker and honest unavailable message. Actual local-score curve remains clearly labelled after five saved comparable runs.
- Files: public/play/deep-dive/game.js; canonical HTML script version; components/player.tsx iframe version; relevant tests.
- Evidence: original https://krillion.io/ and production /games/deep-dive opened; production Play now exercised. Full result screenshot comparison still pending.
- Checks: initial patch passed syntax, typecheck, lint, all 128 tests and Next.js production compilation. Results refinements pass 61 focused tests; final checks underway.
- Environment: sites-preview fails because it appends --host/--strictPort to Next.js. No application code changed to compensate. Verify through Vercel preview.
- Original Daily #107 completed (70); baseline Daily #107 completed (60, one timeout). Captured top and lower original results and baseline top at 1363×936 in docs/evidence/krillion-results-20261030/. Numeric score and one-round marker differ and must be masked for image metrics.
- Added recovered plankton asset, tier artwork in trail/bearing/catch, measured 448px result layout, stacked actions before catch, lazy expandable answers with search/tier filters, honest recovered counts, actual per-answer points/quips, source-style copy confirmation and improved surfaced artwork composition.
- GitHub draft PR #38; first published commit 40fdb7f28473e025b88ba5cb76a89d6e5e66182a; first preview browser-game-arcade-ntga8o7d0-dxbavg-7923s-projects.vercel.app ready. Original patch independently reviewed without actionable findings.
- Next: verify second feature preview with actual gameplay, capture after screenshots/overlay/diff, review refinements and update PR. Do not merge until browser checks pass.
- Exact 1440×900/1920×1080/mobile screenshots remain unverified: cloud browser is 1363×936, and managed local preview rejects Next.js flags. Requested local Playwright browser installation failed (invalid downloaded ZIP). Do not resize screenshots and call them viewport captures.
- Checkpoint 1 is NOT complete. Checkpoints 2–5 pending; existing implementations preserved.
