# Deep Dive feature-parity matrix — Pass 3 (2026-10-30)

Status: ✅ implemented+verified · ☑ pre-existing (carried forward) · 🟡 approximated
(as labeled) · 🔵 publicly recoverable, not yet implemented · ⛔ not recoverable from
authorized public sources. Baseline 90d168c → pass-3 tree.

## Core architecture

| Feature | Original verified? | Sidequest | Status | Notes |
|---|---|---|---|---|
| 14,800px scroll-world column | ✅ live-measured | ✅ | ✅ | `reference-world.js`, exact height + 2px/m |
| Ambient facts at m×2−9 | ✅ all 21 verified | ✅ | ✅ | World-anchored, scroll past camera |
| Trench floor at 14,020px | ✅ | ✅ | ✅ | water-bg.webp + themed floors |
| Title inside world (top −336px) | ✅ | ✅ | ✅ | Scrolls away when diving |
| Round base = 2×prevDepth; tier lines = base+score/100×2000 | ✅ both tiers measured | ✅ | ✅ | Fractions are score/100 (corrects Pass-2 values) |
| Chip spawns base+180 → sinks to line | ✅ 20px & 1,820px sinks traced | ✅ | ✅ | CSS-var drop + 2.8s ease |
| Camera = anchor−2×depth + idle drift | ✅ anchors 207/340/261/459 traced | ✅ | ✅ | Fractions of stage height; drift ±1.5px |
| Descent easing (in-out, ~4.9–5.6s for 2,000px) | ✅ traced | ✅ | ✅ | krillion-tier settle reproduced to 0.02px |
| Background canvas (sea) + zone gradients | ✅ | ☑+✅ | ✅ | Existing scene canvas + data-zone gradients |
| Foreground canvas (ds-fore) | ✅ exists | — | 🟡 | Scene canvas already draws over-particles; separate fore canvas deferred |
| No fixed-position elements inside the world | ✅ | ✅ | ✅ | Regression-guarded by unit test |

## Phase machine

| Phase / behavior | Original verified? | Sidequest | Status |
|---|---|---|---|
| boot → intro | ✅ | ✅ | ✅ |
| preview phase (3s pill, card at .45s, camera ease, dock slides up only for answering) | ✅ | ✅ | ✅ |
| answering (25s, sonar, urgency var 0→1) | ✅ | ✅ | ✅ |
| feedback (flash, chip, tier-line stagger, landed, stage shake on miss) | ✅ | ✅ | ✅ |
| done (surfacing camera, gold flash, crank) | ✅ | ✅ | ✅ |
| tour (root disabled) | 🟡 signal only | 🟡 | Extended first-dive preview + hint (labeled approximation) |
| Mid-dive refresh resume incl. legacy 'question'/'reveal' saves | — | ✅ | ✅ |
| Expired timer on resume → timeout feedback (no frozen dives) | — | ✅ | ✅ |

## Answer flow

| Feature | Original verified? | Sidequest | Status |
|---|---|---|---|
| Sonar scope + rotating sweep (2.4s / 0.7s hot) + in-scope digits | ✅ CSS + live | ✅ | ✅ |
| Fuse scaleX(remaining/total) | ✅ | ✅ | ✅ |
| DIVE disabled until input; maxlength 256; enterkeyhint send | ✅ | ✅ | ✅ |
| Reject: root-level `"x": no echo. try again` + element shake | ✅ | ✅ | ✅ (exact copy) |
| Two-step corrections (preview → confirm) | ✅ live-tested | ✅ | ✅ |
| Corrections setting off → immediate accept | ✅ settings copy | ✅ | ✅ |
| Clear-rejected setting | ✅ | ☑ | ✅ |
| Live server alias pool | ⛔ | — | ⛔ (independent fuzzy matcher stands in) |
| HUD shows upcoming prompt during feedback | ✅ | ✅ | ✅ |

## End screen

| Feature | Original verified? | Sidequest | Status |
|---|---|---|---|
| DIVE #N COMPLETE + big score + −Xm | ✅ | ✅ | ✅ |
| THE BEARING bands 0–150/151–250/251–350/351–449/450+ (new strings) | ✅ | ✅ | ✅ |
| THE CATCH per-round list | ✅ | ✅ | ✅ (without server pick counts) |
| "N other players chose this" | ✅ server-fed | — | ⛔ not recoverable |
| Score-distribution curve + percentile | ✅ server-fed | — | ⛔ not recoverable |
| LOGBOOK (streak/played/avg/best) + NEXT DIVE countdown (ET midnight) | ✅ | ✅ | ✅ |
| 1–5 rating widget (1 = MEH · 5 = GREAT) | ✅ | ✅ | ✅ (local persistence) |
| COPY RESULT / KEEP DIVING ∞ / ARCHIVE ⟲ / THEMED PACKS | ✅ | ✅ | ✅ |
| Gold flash + gold mascot + depth crank on surfacing | ✅ | ✅ | ✅ |

## Modes, meta & multiplayer

| Feature | Original verified? | Sidequest | Status |
|---|---|---|---|
| Daily (7 prompts, recovered sheets, 16,727 answers) | ✅ | ☑ | ✅ |
| 105-date archive + endless challenge | — | ☑ | ✅ |
| Unlimited / themed starter packs (publicly recovered prompts) | ✅ | ☑ | ✅ |
| Themed world skins (data-world: hollywood/gauntlet/atlas/lexicon) | ✅ CSS/DOM | ✅ | ✅ (tints + themed floor + copy) |
| 16,400px themed world columns | ✅ CSS | 🔵 | Themed heights share the same engine; per-world column heights not yet differentiated |
| 30-chapter pack structure | ✅ /packs live | 🔵 | Our practice worlds remain 5-chapter Sidequest originals |
| Wardrobe: 5 characters, streak gates 0/5/14/30/45 | ✅ live | ✅ | ✅ |
| Settings: low-power, colorblind, corrections, clear-rejected, share link | ✅ live | ✅ | ✅ (share link toggle pending UI) |
| Puffer Party 2–16 players | ✅ live | ✅ | ✅ (cap + copy) |
| Original room backend | ⛔ | ☑ | ⛔ (independent backend stands in) |
| Sound engine (13 events) | ✅ | ☑ | ✅ |
| Mascot poses + blub + sad/gold moods | ✅ | ✅ | ✅ |
| Autonomous JS mascot wander | ✅ | 🟡 | Pose animations stand in (labeled) |
| Mobile 390×844 layout, no overflow | ✅ measured | ✅ | ✅ |

## Datasets (preserved, untouched)

105 archive dates (735 prompts / 499,704 answer rows), daily snapshot 2026-10-29
(7 prompts / 16,727 rows), 35 free-starter prompts (945 rows), 60 SHA-verified
assets, 67 recovered animation definitions — all carried forward unchanged.
