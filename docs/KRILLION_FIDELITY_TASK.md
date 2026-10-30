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
- Checks: node syntax + focused pass5 tests passed (14). Typecheck/lint underway.
- Environment: sites-preview fails because it appends --host/--strictPort to Next.js. No application code changed to compensate. Verify through Vercel preview.
- Next: finish original seven-round Daily, capture entire results, compare current production, repair concrete discrepancies, verify feature preview, review, commit checkpoint.
- Checkpoint 1 is NOT complete. Checkpoints 2–5 pending; existing implementations preserved.
