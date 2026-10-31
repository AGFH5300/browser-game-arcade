# Krillion visual and animation parity audit — 31 October 2026

**Outcome:** More closely source-measured, but NOT full one-to-one or pixel-perfect. Independent Sidequest accounts, multiplayer and scoring remain independently implemented, as requested.

## Method

Compared public live Krillion, publicly delivered CSS/JavaScript and Sidequest Chromium output at 1440×900 desktop and 390×844 mobile. Collected measured bounding rectangles, computed CSS, animated element counts and delays, screenshot samples, and button/selection interactions across Daily, Unlimited, Settings, Wardrobe, navigation, guest Account and Friends, Puffer Party, question, answer, and results states.

## Latest concrete source comparisons

| Element | Source original | Latest local recreation |
| --- | --- | --- |
| Desktop Settings | x505 y90 430×720 | x505 y90 430×720, five functional switches |
| Mobile Settings | x18 y62 354×720 | x18 y62 354×720 |
| Mobile Wardrobe | x18 y158 354×529 | x18 y158 354×529; five character slots |
| Toolbar desktop | x1216, y84/116/148 | Matches source positions, original public SVG icons |
| Toolbar mobile | x346, y70/102/134 | Matches source positions |
| Navigation mobile | x16 y16 358×812 | Same panel bounds and adjusted item heights |
| Unlimited Begin desktop | x420 y687 600×66 | Same |
| Unlimited Begin mobile | x16 y677 358×59 | Same |
| Unlimited chooser | 76-entry independent Sidequest selection | 76 entries, #60 selected in browser QA |
| Friends guest desktop | x364 y271 712×288 card | x364 y271 712×288 |
| Account guest desktop | x364 y310 712×288 card | x364 y307 712×288 |
| Menu cropped RGB error, desktop | Original live screenshot | Improved 9.52 to 6.49 /255 |
| Menu cropped RGB error, mobile | Original live screenshot | Improved 11.29 to 8.54 /255 |

Home/Party 11 CSS animations, question dismissal 450ms delay plus 600ms ease-in, original tier-specific mascot reactions, fish and title animation timing were covered in the previous motion audit. Source music/SFX and canvas effects are not all fully verified.

## Verification

167/167 automated tests pass. TypeScript, lint and Next.js production build pass. Desktop/mobile browser smoke testing found zero JS errors in source-like overlay, Account/Friends guest and 76-dive selection flows.

## Unresolved — cannot claim full exactness

- Deterministic 30fps comparison of every bubble, fish, particle, cloud, light effect and frame for each gameplay tier or animation/transition.
- The original completed results screen was subsequently captured successfully after seven real rounds; source /api/today/complete and /api/reveal returned HTTP 200 on 31 Oct. The original 70-point final-results screen and a Sidequest independent 70-point result were compared at 1440×900. Their charts, card positions and score bearing are not pixel-identical; source publisher audience statistics cannot be claimed from Sidequest's independent backend.
- Original Party live rooms, matchmaking and backend data are intentionally not copied. Friends/account Google sign-in is also deliberately independent.
- Paid Archive/purchases and full source questions/scoring remain excluded by scope.
- Sound event scheduling, reduced-motion modes and more viewports require further verification.
- Screenshot error values are from non-time-synchronized animated frames and do not certify pixel-perfect parity.

This branch is an incremental visual-parity improvement, not a certificate of exact replication. Do not merge or deploy without final QA and appropriate release capacity.


## Original browser runtime tier effects: new parity implementation (31 Oct, later pass)

Verified original publicly loaded client code and screenshots for Plankton (10),
Schooler (30), Rare (60), Deep Cut (85), and One in a Krillion (100).
The original 15-point Too Clever source effect was inspected and reconstructed;
the tested Halloween-tradition prompt lacked 15-point answers.

- Reconstructed tier-specific chip sway, rotation, original tier durations,
  90ms-staggered line reveal and score impacts. Source sink audio begins at
  submission; grade impact audio and score interpolation happen after landing.
- Added animated swimming Schooler followers and 8-mobile/11-desktop Too Clever
  schooler swarm, deep cut radial spotlight, rare dark-ink bursts, and 14-mobile/
  20-desktop seasonal Krill orbiting sprites for a 100-point landing.
- Separated source sea snow (~70 particles) from foreground snow (~26 particles),
  using original parallax, drift, reduced-motion and low-power controls. Replaced
  the initial arbitrary 19 fixed fish distribution with original 85m schools and
  four slower world-depth silhouettes.
- Source-like sunlit-to-dark water-zone fade and a corrected mascot position
  during descent. Non-deterministic particles/lighting and simultaneous
  source-vs-recreation screenshots remain visibly different.

The original full seven-round run returned score 70, distribution sample
535,808 and a visible finished result with bearing tiers, question catch and
post-dive actions. It is possible to verify original final-results layout now,
but Sidequest's independent distribution necessarily differs.

Browser evidence: /tmp/kr-original-detailed-results.log,
 /tmp/kr-source-result-detailed-1440.png, /tmp/kr-results-fixture.log,
 /tmp/kr-source-tier-{10,30,60,85,100}-{1200,4400}.png,
 /tmp/kr-real-tier-gameplay.log, /tmp/kr-tier-effects-check4.log.
Smoke-test source clips are unsynchronized and do not establish pixel-perfect
or animation-frame-perfect parity.
