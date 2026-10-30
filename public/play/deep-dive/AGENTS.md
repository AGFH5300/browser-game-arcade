# Deep Dive invariants

- Canonical entry: index-public-art.html. Keep old HTML paths redirected; do not restore the retired prototype.
- CSS load order in that HTML is significant. Edit existing scoped rules; do not add another override stylesheet.
- Reuse recovered assets and update their manifest when adding source files. Do not invent accepted answers, rarity tiers, player counts or percentiles.
- Keep v1 storage keys and saved progress compatible. A typo correction must not score before explicit confirmation.
- Focused checks: node --check public/play/deep-dive/game.js; node --import tsx --test tests/deep-dive-*.test.ts (from repo root).
- Current work/evidence: docs/KRILLION_FIDELITY_TASK.md. Compare actual equal-sized viewport captures; never resize an image and call it a viewport test.
