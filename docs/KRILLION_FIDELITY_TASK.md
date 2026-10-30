# Krillion fidelity task — 30 October 2026

Goal: source-backed visual and behavioral parity in the existing reconstruction.
Context: latest main verified at 471ab72 (#37); branch fix/krillion-results-fidelity.
Constraints: preserve recovered assets/data/progress; no invented peer statistics; auth/payments excluded.
Done when: five requested checkpoints have browser evidence, focused checks, review, and verified deployment.

## Current checkpoint: 2 — homepage, menu and How to Play (in progress)

Incremental results release: PR #38 merged as d73443eb577fb211fdfbeba0c7a2e844d026ba38; Vercel production READY and Play now verified release=20261030pass5results3. Saved production result60/600m survived; no fabricated curve. Full result parity remains open as documented in the evidence README.

### Results work and evidence
- Read public fidelity audit and Pass 5 notes. Original Daily #106 expired during scoring; reloaded #107 and resumed actual gameplay.
- First concrete correction: removed fabricated distribution for fewer than five comparable local runs. Retained score axis/marker and honest unavailable message. Actual local-score curve remains clearly labelled after five saved comparable runs.
- Files: public/play/deep-dive/game.js; canonical HTML script version; components/player.tsx iframe version; relevant tests.
- Evidence: original https://krillion.io/ and production /games/deep-dive opened; production Play now exercised. Full result screenshot comparison still pending.
- Checks: initial patch passed syntax, typecheck, lint, all 128 tests and Next.js production compilation. Final refinements pass 61 focused tests, all 134 tests, typecheck and lint. Vercel production compilation READY for 36f8866b.
- Environment: sites-preview fails because it appends --host/--strictPort to Next.js. No application code changed to compensate. Verify through Vercel preview.
- Original Daily #107 completed (70); baseline Daily #107 completed (60, one timeout). Captured top and lower original results and baseline top at 1363×936 in docs/evidence/krillion-results-20261030/. Numeric score and one-round marker differ and must be masked for image metrics.
- Added recovered plankton asset, tier artwork in trail/bearing/catch, measured 448px result layout, stacked actions before catch, lazy expandable answers with search/tier filters, honest recovered counts, actual per-answer points/quips, source-style copy confirmation and improved surfaced artwork composition.
- GitHub draft PR #38; first published commit 40fdb7f28473e025b88ba5cb76a89d6e5e66182a; first preview browser-game-arcade-ntga8o7d0-dxbavg-7923s-projects.vercel.app ready. Original patch independently reviewed without actionable findings.
- Verified final preview 36f8866b5b8b758a37aa71c06ad39f2e6583f5c3: same 70-point seven-round game as original, saved resume, lazy answers, full-set search/tier filter, copy feedback, completed reload, and Play now iframe version. Independent review of implementation and geometry found no actionable bugs.
- Evidence README lists before/after screenshots, overlays, regional metrics and explicit remaining differences. Core results correction ready for incremental release; full checkpoint 1 parity remains incomplete.
- Next: release the reviewed incremental results fix, verify production Play now, then continue source-backed homepage/menu/How-to comparisons. Remaining result promo/footer/animation work stays open.
- Exact 1440×900/1920×1080/mobile screenshots remain unverified: cloud browser is 1363×936, and managed local preview rejects Next.js flags. Requested local Playwright browser installation failed (invalid downloaded ZIP). Do not resize screenshots and call them viewport captures.
- Full checkpoint 1 parity is NOT certified; incremental verified correction released. Checkpoints 3–5 pending; existing implementations preserved.

### Homepage/menu checkpoint
Goal: match original home geometry and actual menu modal; preserve working routes, How-to and saved state.
Context: fresh branch fix/krillion-home-fidelity from main d73443e.
Evidence: saved original home1440×900 retrieved unchanged; current before-home1363×936; fresh original menu1363×936 and public SVG icons in docs/evidence/krillion-home-20261030/.
Fresh finding: original menu is a centered430px modal with a two-column tile grid, not the slide-out described in Pass5 notes. Follow the current screenshot/DOM evidence.
Done when: scoped home/menu corrections, targeted tests, independent review, preview interactions and clear viewport limitations are recorded.
Next: finish bounded implementation, capture after home/menu/How-to, compare, test and release independently.

## PR #39 continuation — 30 October 2026 (local verification)

- Scope: homepage/modal only. Latest PR branch initially cee4619; all 135 repository tests, typecheck and lint passed.
- Evidence: `docs/evidence/krillion-home-20261030/after-*.png`, `comparison-*.png`, `overlay-*.png`; original reference screenshots already saved in same folder.
- Verified Vercel preview browser interactions at 1440×900, 1363×936 and 390×844 including Escape, FAQ, Packs, Archive, return to Daily, Play now and no JS errors.
- Final local CSS adjustment matches saved original menu x463/y46/w438/h844 at 1363×936; first nav tile y181; merchandise y662.
- Source access currently HTTP 403 from the remote test browser; new comparisons use source snapshots. Global visual/animation parity is not certified.
- Next: verify new Vercel preview deployment for final CSS change, merge PR #39 if clean, verify production, then proceed to checkpoint 3 in a separate bounded task.
