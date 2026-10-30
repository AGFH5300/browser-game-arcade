# Krillion visual and feature parity audit — 30 October 2026

**Status:** work in progress, not pixel-perfect, not deployed. Compared original https://krillion.io and Sidequest https://browser-game-arcade.vercel.app/games/deep-dive. The audited branch is `feature/krillion-visual-social-parity-20261030`.

## Method and evidence
- Captured original and existing Sidequest with independent headless Chromium, identical CSS viewports at **1440 × 900** and **390 × 844**, pixel ratio 1, and repeated navigation to home, original free Unlimited intro, guest Friends/Account gates, Archive, and Puffer Party.
- Additional read-only live browser inspection covered homepage, original menu, guest daily prompt/feedback transitions (six rounds were inspected), original Party room list, Friends and My Krillion guest gates. Captured screenshots and DOM/CSS geometry on the authorized testing computer; temporary files were not committed.
- Inspected original publicly delivered minified JavaScript `/_next/static/chunks/1klevf566y93_.js` and CSS `/_next/static/chunks/1pp18n31ii136.css`, as served on the audit date. These are reference observations, not a copy of private source.
- Ran the dedicated feature branch's GitHub Actions typecheck/lint/tests/client syntax and a locally hosted branch (unconnected to production database) with browser route mocks at both viewports.

## Findings by screen

| Screen / state | Original reference | Sidequest branch | Outcome |
| --- | --- | --- | --- |
| Boot / descending | Original CSS: dark gradient `#0b1526 → #050a14 → #03070f`, 45%-opacity 3px scanlines, centered **64 × 64** Krill, `descending…` 16px uppercase/0.3em tracking, bob 2.4s cubic-bezier(.65,0,.35,1), pulse 1.6s ease-in-out. No logo or progress bar. | Removed wrongly added logo and progress bar and reproduced public reference CSS timing, text, background, image size and animation. | **Source CSS parity implemented**, but a timed first-frame screenshot / perceptual check remains outstanding. |
| Desktop Daily landing | Original title container **[196,155,1048,112]**, centered within 1080px stage; menu at approx x188; boat and waterline at y≈497; primary button near x414/y680; original changing live Party player count. | Title glyphs and source background imagery present, main menu shifted to x≈188, Begin button nudged; title DOM box **[36,163,1368,114]** (not a like-for-like layout box). Count intentionally not fabricated. | **Not pixel-perfect**. Static positions improved; animations and the live-count treatment differ. |
| Mobile Daily landing | Original title **[16,147,358,60]** at 390×844. | Branch title **[9,133,372,53]**, before additional correction; other controls usable. | **Mismatch**: ≈14px vertical and width/height differences for title; mobile layout still needs calibration. |
| Hamburger / settings | Original overlay has Daily, Unlimited, Party, Archive, Themed, My Krillion, Friends, Settings, FAQ and promotional links. | Local menu routes restored for all navigation, with Friends and My Krillion now functional routes. | **Functional**, exact overlay geometry, typography and transition not proven. |
| Unlimited landing | Original shows THE ENDLESS DIVE and an expandable dive log with **0/76 charted** in guest state. | Added a compact, scrollable **76-dive selector**; `startPublicUnlimited` deterministically chooses seven available public/local prompts per selected slot and supports next dives. | **Mechanics approximated**, not original unrecovered paid challenge set, streak/history semantics or pixel-perfect intro. |
| Daily prompt preview | Original `descending · the clock starts in 3`, then 25-second answer timer; 7 prompts, camera descent, tier lines, chips and continue. | Preview, active input, timeout, feedback and transition are working in past full-flow tests. | **Functional comparison only**; animation keyframes/time alignment and pixel diff not verified. |
| Answer / rejection | Original has Web Audio submit/reject effects and corrections/validations. | Local source-like validator, user-visible rejection and optional correction; not the original private production validator. | **Not exact**, question bank/scoring intentionally out of scope. |
| Tier reveal / descend | Original six tier markers, scoring/depth, frame transitions. | Existing seven-round stage fixes and user-reviewed progression. | **Gameplay functional**, per-frame animation parity pending. |
| Results | Original completed-round results/summary require a full completed original guest run; the read-only browser audit stopped at round six. | Local summary, bearing, catch, clipboard, score chart, next dive. | **Unverified pixel parity**. Do not claim exact result screen. |
| Archive | Original guest `/archive` displays an Unlimited unlock gate; no payment undertaken. | Historical public snapshot archive. | **Intentionally out of scope**, expected difference. |
| Desktop Puffer Party | Original logo x≈194/y76, header, identity panel **x190/y300**, public rooms **x1062/y300**, central puffer; table sizes 1v1, 3s, 4–6, 8–10, separate Rated and Quick Play, public room list. | Branch identity panel **[190,286,368,279]**, public panel **[1062,286,368,300]**, so horizontal geometry now closely aligned but vertical offset ~14px. 8–10 choice corrected. | **Partial visual parity**, not frame-perfect. Our public-room list has real local rooms and does not fabricate original room traffic. |
| Mobile Puffer Party | Original Party header logo near y64 at 390px, fixed viewport with internal content navigation. | Mobile top padding corrected by 13px, fixed viewport with internally scrollable content; Host/Join remains accessible. | **Layout improved**; typography and below-fold layout not pixel-perfect. |
| Matchmaking | Original offers public, Quick Play and rated queues across selectable table sizes. | Own public rooms/Quick Play; **rated 1v1** queue with rating proximity and persistent Elo. | **Partial parity**. Rated 3+/multi-table matching, full cross-account real-world concurrency untested. |
| Friends guest screen | Original `/friends`, title `Friends` in VT323 **72px desktop / 48px mobile**, Google login required. | Separate Sidequest password-based account form and invitation UI, privacy-controlled daily scoreboard. | **Functionally independent**, visually different and does not reuse Krillion Google accounts. |
| My Krillion guest screen | Original `/account`, `My Krillion` and Google sign-in, account/history descriptions. | Separate Sidequest account with verified daily streak, ranked rating, character unlocks. | **Partial feature parity**, account sync and OAuth not identical. |
| Sounds | Original public browser bundles call Web Audio oscillator/noise synthesis, not packaged WAV/MP3. Original effect parameter sets (submit, reject, tierline, sink, land_small, land_big, spare, category, krillion, miss, tick, surface, blub, descend/begin) match existing Sidequest effect recipes. | Reuses these same procedural parameters rather than making up prerecorded audio files. | **Synth recipes verified**; master gain/context lifecycle and exact event time coupling need audio-output comparison. |
| Character unlocks | Original gated Krill/Schooler/Squid/Angler/Evil character lineup. | Account database verifies completed published daily records and streak; unlocks 0/5/14/30/45 days; anonymous Krill retained. | **Server enforcement implemented**, live account flow pending database migration. |

## Server and data changes staged
- Independent username/password sign-up and sign-in, scrypt salted hashes, hashed 30-day httpOnly session cookie, rate limiting, origin checks.
- Friends requests, acceptance, block/remove, invitation token rotation, private daily leaderboard with spoiler lock and answer privacy.
- Authenticated Puffer Party character unlocks, account rating, rated 1v1 matchmaking and exactly-once Elo settlement.
- SQL migration staged and checked on a **temporary Neon branch**, not applied to production. Live account/matchmaking routes are therefore not ready for public use. Explicit user approval is required to apply this schema.
- Public original question bank, original score table, original purchase gates, original Google account network, private matchmaker and Archive paywall are deliberately not replicated.

## Validation
- GitHub Actions branch run `41086730165`: **156/156** tests, typecheck, lint and JS syntax **PASS**.
- Local static branch at 1440×900 and 390×844: pages render without page errors.
- Additional mocked local browser interaction: **24/24 PASS**, testing register/login view, Friends↔Account tabs, username invitations, unlocked Squid at 14 days, 8–10 table selector, rated queue and cancel, navigation home, no JS errors.
- Vercel preview build/deployment is **blocked by free-plan deployment daily quota (HTTP 402)**; no production deployment claimed. API endpoints and database cannot be called live verified.

## Release blockers / next verification
1. Obtain actual Vercel preview deployment/build after quota resets; run full Vercel build and browser QA on hosted API.
2. Explicitly approve and apply the additive Neon migration; run tests with two genuine new accounts, send/accept/remove/block invitations and validate privacy.
3. Test concurrent paired rated sessions, host/guest timers, match ending, rating updates once, queue cancellation and stale queue expiry.
4. Take synchronous original/Sidequest screenshots and quantify pixel differences at 390×844 and 1440×900, including 3-frame animation sampling. Original results animation, full Party room flow, and original authenticated account pages remain unverified.
5. Calibrate mobile title, daily ocean motion, Party vertical offsets, modal and results; test audio event timing and contrast.
6. Decide whether the independent account must sync local practice run history between devices; this branch currently verifies and syncs daily score/streak only.

**Conclusion:** Significant progress, not an exact/pixel-perfect reproduction. A successful test suite validates the implemented local flows; it does not certify visual or backend parity.
