# Krillion public-reference reconstruction — evidence-based parity audit and legacy removal
Updated: 29 October 2026. Baseline: main 7541b4f (PR #35).

## IMPORTANT: no complete 1:1 certification

The playable Sidequest Deep Dive is NOT a complete line-by-line recreation of krillion.io. Passing 109 tests and desktop/mobile gameplay does not verify every screen, browser state, animation, original game interaction, or responsive breakpoint. Past statements calling the clone finished or entirely copied were incorrect.

The owner excludes exact full question and answer coverage, authentication and Stripe payments from the requested fidelity target. The remaining categories below still have incomplete or unverified behavior.

| Feature / screen | Status | Evidence / remaining differences |
| --- | --- | --- |
| Home / start | Approximated, broadly recognizable | Source-like boat, clouds, title, buttons, art and sound; exact layout, motion/frame-timing, all menu states and breakpoints not certified by pixel-diff regression |
| How to play / onboarding / tour | Partly approximated | Code implements a hint/preview; complete source tour has not been verified |
| Daily answering | Broadly implemented | 7 prompts, sonar, text input, timer, correction confirmation, tier scoring, scrolling and HUD; full mobile/browser-state/keyboard animation matrix has not been reproduced |
| Rejection, typo confirmation, timeout, passing | Implemented in tested paths | Not every malformed input, round transition or timing branch was validated frame-by-frame against the source |
| Round feedback and descent | Strong approximation | 14,800px camera system, tier chips, effects, source art; some foreground effects and autonomous mascot motion remain absent or approximated |
| End screen | Rebuilt but not identical | Pass 4 restored near-top score, surfaced sky, 7-point local-score chart and catch/bearing/logbook; ORIGINAL crowd-distribution curve, percentiles and per-answer other-player counts are server-fed and not reproduced |
| Sharing / score cards | Partial / unverified | Copy Result exists. Native share sheet, original image export, full spoiler safeguards and share-link preference have not all been verified |
| Archive | Functional but different | Independent historical snapshots play; original browsing, review, recorded best/per-day semantics and all route/case animations not systematically compared |
| Unlimited | Different | Independent 50-question challenge, not fully reconstructed original free Unlimited loop / prompt selection / progression |
| Themed packs | Partial | 16,400px independent world columns and recovered artwork for Movies/Sports/Geography/Words; scene composition and world-coordinate locations are approximations; 30-chapter catalog exists but only recovered starter content playable |
| Puffer Party | Independent approximation | Own Neon backend; 2–16 capacity and core rooms, scoring, ready, chat; not source backend, original full lobby/game UX and multiplayer state transitions unverified |
| Friends | Not implemented | Outside requested authentication scope but original free comparison UI may differ |
| Settings and wardrobe | Partial | Low-power, colorblind, corrections, clear rejected, characters/streak gating; original share-link setting and complete settings/tour UI not reproduced |
| Statistics / logbook | Partial | Local streak/score/history; original account/server-linked features and any additional local reports not comprehensively compared |
| CSS / original animation library | Partly recovered | Original keyframe references used; 67 animations recovered in prior research, but timing, triggers, exact canvas effects and multi-view pixel parity are not all independently audited |
| Audio | Approximated | Synthesized sounds and many events; original original sound sample identity and per-phase timing not completely matched |
| Accessibility, keyboard, all viewport sizes | Incomplete coverage | Automated tests cover 1440x900 and 390x844; other viewports, touch, screen readers and reduced-motion transitions are not a complete source comparison |
| Account, purchases, private validator, unrecovered answer corpus | Excluded by request | No claim of equivalence |

## The old handmade prototype and current architecture

The old standalone game was formerly served by two HTML files:
- /play/deep-dive/index.html
- /play/deep-dive/index-arcade.html

Both old pages bypassed the reference interface/world/audio/CSS script stack and could show an obsolete or broken version. They have been **deleted**; Next.js permanent redirects both old URLs to /play/deep-dive/index-public-art.html. Only this last canonical page is embedded in Sidequest, and only it has the app's explicit same-origin allowlist permission.

Removed the original separately drawn puffer-pixel.svg asset. The shared pixel-ui stylesheet now uses the recovered public reference-art/puffer.png sprite. Kept the existing canonical scene, public artwork, recoveries and multiplayer backend intact.

**Shared dependency caveat:** The current canonical recreation still uses parts of the original Sidequest CSS style.css, pixel-ui.css, JS game.js, and the independent 90-prompt questions.json bank. They have evolved into shared scaffolding and are **not removable without rewriting current game modes and the independent Puffer Party API**. This change retires the separately playable outdated version; it does not dishonestly claim that all home-authored code is gone. The bank remains because the independent practice modes and multiplayer room server still require it.

The separate arcade game listing /games/krillion links to the original krillion.io and is not the obsolete Sidequest prototype; it is intentionally preserved.

## Regression gates

- Neither deleted legacy HTML entrypoint is present in public assets.
- Both old public paths return permanent 308 redirect to the single current experience.
- The only own-origin special iframe allowlist game path is the current canonical player.
- Existing source assets, saved state and question banks remain untouched.
- Desktop and mobile canonical home, 7-round gameplay, Party and result flow are tested.
- GitHub PR preview and final production deploy verified before final signoff.

## Definition of completed fidelity

Do not label the reproduction complete until a documented source-side inventory, screen-by-screen / state-by-state screenshot comparisons at multiple viewports, interaction scripts for all accessible screens, animation and sound parity, and original nonprotected server-informed UX replacements all have evidence or are explicitly marked intentional exclusions.
