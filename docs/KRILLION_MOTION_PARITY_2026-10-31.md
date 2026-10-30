# Krillion micro-motion parity — source-inspected audit (31 October 2026)

**Status: PARTIAL / not pixel-perfect, not yet production.** Independent Sidequest backend and original publisher backend differ intentionally; purchase/paid Archive and question/scoring equivalence are out of scope. This document records actual animation measurements, not a completion certificate.

## Method
Used live `https://krillion.io/` and `/party` in Chromium at fixed **1440×900 and 390×844**, as well as publicly delivered JavaScript/CSS, source canvas data and local Sidequest. Collected computed `animation-name`, `animation-duration`, `animation-delay`, easing, button shadows, hover/press states, DOM bounding rectangles, and temporal screenshots. Same-viewport captures are necessary but not sufficient: animated ocean particles use different random seeds and canvas frame phases.

## Element-by-element matching achieved

| Element | Original observable behavior | Changes in this branch |
| --- | --- | --- |
| Home title container | 5.0s step-end flicker | Set `ds-title-flicker` to exactly 5s |
| Eight home title letters | 3.2s `ds-bob-l` wave, letters delayed 0,.18,.36,.54,.72,.9,1.08,1.26s | Replaced three incompatible 3.9/4.3/4.8s floats and enforced all eight 3.2s |
| Home Begin button | 1.9s ease `cubic-bezier(.65,0,.35,1)`, 5px vertical bob | Recreated animation and exact resting cyan / hovering pink shadows |
| Home Puffer Party callout | No standalone CSS bob | Removed previously added unsupported motion |
| Home fish/bubbles | Motion painted on a dedicated `ds-sea` canvas | Hid extra independently drifting DOM fish/bubbles, retained the canvas particles |
| Party eight heading letters | Same 3.2s/180ms independent wave | Changed title markup to eight separately animated characters; verified computed duration and per-letter delay |
| Party puffer mascot | 2.6s asymmetric 4-stage rotation, drift and horizontal-scale swim | Set exact source keyframe percentages and source easing |
| Party Rated + Quick Play | Identical 1.9s/5px bob; normal cyan and hover pink glow | Restored source timing, fill and shadow, source-sized buttons |
| Party avatar and room-size controls | Static until pointer state/selection | Kept animation off while maintaining selectable Sidequest states |
| Party navigation/modal | Source modal position is fixed, not an animated slide | Sidequest panel remains static on open; route panel works independently |
| World camera | 30fps, 15 low-power, 2 reduced-motion; 6/s exponential follow and sinusoidal underwater current | Updated `reference-world.js` and `reference-scene.js` to use source caps, damping and current |
| Answer tier descent | Tier-specific 3400,3000,3000,3400,4300,4600ms for Plankton through Krillion | Added tier scheduler; gated next action until landing and staged card exit/landing reveal |
| Controls: hover/press | Home and Party CTAs remain navy on hover; shadow changes cyan→pink; transform/box-shadow use 150ms/200ms custom easing | Replaced unsupported bright-blue hover fills and earlier short timings |

## Party positions measured
At **1440×900** the source Party title starts y=76, Who's Playing panel y=304, Play Now panel y=560, Rated button y≈689. The locally validated revision has those at **y=76,305,560,689** and reproduces the source Rated button's **155×55** dimensions.

At **390×844** the source title starts y=64, Who's Playing y=373 and Play Now y=629; the latest mobile margin/panel-width correction targets those positions, with a full browser recheck required after the final CSS commit.

## Coverage inventory of source animated nodes (visible first viewport)
- Home: 11 nodes — one title container, eight letters, one mascot, one primary CTA.
- Party: 11 nodes — eight letters, one swimming puffer image, two bobbing CTAs.
- Guest Friends: zero persistent UI animations after load.
- Guest Account: zero persistent UI animations after load.
- Menu opened from Home: static fixed dialog, no separate CSS entrance keyframes in sampled state.
- Archive guest preview: transitional loading mascot visible; paid backend intentionally excluded.
- Gameplay and results: dynamic canvases, CSS, JavaScript camera and audio events require time-aligned video captures and complete state transitions. Do not equate a static screenshot or the first answered round with complete parity.

## Still unresolved
1. Exact frame-by-frame footage comparison at 30fps for all seven rounds, for **every tier, timeout, rejection, score reveal, Descend, and final surfacing**.
2. Original random water-snow particle positions, fish spawning, sparkle impacts and all contextual creature animation states (even where draw formulas now match).
3. Sound events: verify actual assets, playback order, volume envelopes and frame-accurate sync.
4. Loading transition and all menu/settings/character/profile/avatar/Party room/match/friends results hover and focus states at desktop/mobile. Initial inventory and selected buttons captured, not exhaustive.
5. Ensure every responsive viewport (not only 1440×900 and 390×844) passes both visual and interaction checks.

## Release guard
Do **not** label the entire game pixel-perfect or merge on the strength of this audit alone. CI static tests validate source timing constants; browser replays validate selected behavior. Neither substitutes for a synchronized full-motion visual comparison.
