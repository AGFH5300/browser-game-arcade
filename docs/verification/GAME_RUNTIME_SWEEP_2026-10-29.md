# Sidequest live game runtime sweep, 29 Oct 2026

## Scope

- 118 local reference entries and 12 additional Papa Gameria entries checked in a short automated Chromium browser startup sweep, 130 unique games total.
- The prior static HTTP audit reported 158/158 entrypoints and 908/908 directly referenced resources. Dynamic runtime errors require a separate pass.
- The user provided earlier page-one console logs. This report excludes raw console content and account identifiers.
- These are preliminary smoke tests, NOT full gameplay passes. The 26 original puzzle games and external publisher frames were not separately retested here.

## Baseline statuses before current fixes

| Category | Games | Explanation |
|---|---:|---|
| startup_without_observed_error | 44 | No errors observed in the short sample; not full gameplay verification |
| runtime_warning | 19 | Warnings from scripts, external services, permissions or cache |
| runtime_missing_assets | 15 | Runtime requested at least one local asset that responded HTTP 404 |
| runtime_exception | 29 | An uncaught JS or engine exception was seen |
| inconclusive_environment_or_loading | 23 | Iframe unavailable within timeout; sometimes test GPU exhaustion, not necessarily broken game |

## Repaired code on the preview branch

- Restore valid pinned Construct 2 runtime source for Angry Heroes, Eggy Car, Pizza Tower and similar games.
- Validate JavaScript rewrites and only rewrite genuine static asset URL string literals, protecting jQuery and other libraries from silent semantic corruption.
- Remove obsolete document.domain assignment from the isolated Subway Surfers archive.

## Remaining game checks by baseline category

**runtime_exception (29):** rocket-league, subway-surfers, slope, basketball-stars, geometry-dash, fireboy-and-watergirl-1, fireboy-and-watergirl-2, angry-heroes, drift-boss, eggy-car, paper-io, tiny-fishing, crossy-road, slowroads-io, brawl-guys, ice-dodo, friday-night-funkin, papas-freezeria, shortcut-race, choppy-orc, pizza-tower, ragdoll-hit, bubble-shooter, super-mario-bros, wheelie-bike, clash-blade-io, master-chess, solitaire, word-wipe.

**runtime_missing_assets (15):** granny, level-devil, time-shooter-2, time-shooter-3, color-tunnel, icy-purple-head, cluster-rush, fall-boys, ricochet-arrow, big-shot-boxing, plant-vs-zombies, pac-man, idle-breakout, gladihoppers, sprinter.

**inconclusive_environment_or_loading (23):** traffic-jam-3d, highway-traffic, geometry-dash-subzero, geometry-dash-hyper-wave, among-us, drive-mad, moto-x3m, retro-bowl, snake-io, blockpost, house-of-hazards, hole-io, gunspin, madalin-stunt-cars-2, cut-the-rope, x-trench-run, lows-adventure-2, vex-4, tetris, car-rush, we-become-what-we-behold, papas-taco-mia, papas-donuteria.

**runtime_warning (19):** survival-race, granny-2, slope-2, slope-3, a-small-world-cup, ovo, polytrack, run-3, stickman-hook, bitlife-life-simulator, death-run-3d, burrito-bison-launcha-libre, helix-jump, vex-5, tomb-of-the-mask, 2048-cupcakes, block-blast, cat-ninja, cat-trap.

## Release and QA policy

Do not mark all games fully working based on HTTP 200, a loading bar, or a canvas. Confirm input, controls, restart, audio, mobile, data persistence and game completion per title when practical. Recheck inconclusive games in a fresh browser. Recover missing upstream files only if their authentic source and SHA-256 can be verified. Do not weaken browser SRI or CSP merely to suppress errors.

Machine-readable per-game results: GAME_RUNTIME_SWEEP_2026-10-29.json.
