# Release verification — 27 October 2026

## Automated checks

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, zero warnings.
- `npm test`: 12/12 PASS. Partial/case-insensitive/category/tag search, empty/clear queries, draft exclusion, alphabetical/actual-metric ordering, composed filtering/pagination, NaN/Infinity URL handling, signed session tamper/expiry checks, scrypt verification, publishing license requirement, unsafe source/engine/thumbnail validation.
- `npm run build`: PASS, Next.js production compilation.
- Independent focused review completed; fixes included instant client filtering, malformed page numbers and production DB fail-closed behavior.

## Live admin API integration — 11 checks passed

Run `node scripts/live-smoke.mjs` with SMOKE_URL and provide the admin test password via stdin; credentials are never written into the report.

Verified unauthorized denial, cross-origin denial, actual login with HttpOnly cookie, PostgreSQL catalogue read, draft creation, draft hidden publicly, authorized preview, edit/publish, persistent PNG upload/retrieval, unpublish, removal of the temporary test game and logout. Report groups some related assertions into 11 checks. No test game remains. A tiny test thumbnail remains in storage as an upload fixture.

The production browser login form was inspected; the authenticated admin workflow was verified through the actual APIs. No user password was entered through browser automation. Password-change validation and session revocation were reviewed and unit tested for their underlying primitives; a real administrator password change was not performed.

## Live browser checks

- Desktop homepage/catalogue/player and original artwork visually inspected.
- Real 390px phone and 768px tablet viewport frames inspected (CSS responsive rendering, not a physical device). Two phone cards per row; functional menu/search/navigation; no parent horizontal overflow. Full 2048 board fits within the phone player.
- Dark/light/system switching and persistence after reload: PASS.
- Favourites persisted after navigation/reload: PASS.
- Recent play history appears for games opened on the same origin/device: PASS.
- Search, empty state, clear, URL category/sort parameters, native sort control and pagination (20 + 6 games): PASS.
- 2048 keyboard movement/merging and restart: PASS.
- Hextris launch, rotation keys and pause: PASS.
- Native fullscreen is blocked by this cloud browser; working expanded-player fallback tested. Native fullscreen on other browsers is implemented but not independently certified on physical devices.

## Game runtime sweep

26/26 deployed game frames rendered. Every Tatham puzzle generated a board; New game was exercised. 23 changed game ID as expected; Pegs uses a deterministic default board and keeps the same ID. Representative in-board click/key moves exposed Undo in Fifteen, Net, Black Box and Filling. These are smoke/input tests, not completion of all puzzles or exhaustive playthroughs. Raw results: `docs/verification/game-checks.json` and `move-checks.json`.

Asset verification: all 26 HTML entry pages and referenced local resources served successfully (198 asset checks); WASM signatures checked. Final integrated puzzles were retested after the auto-fit initialization timing fix. No unresolved blocking game runtime errors were seen. Upstream preference-storage warnings in opaque puzzle frames are nonblocking; embedded persistent progress is not guaranteed.

## Security and limitations

Games run in opaque-origin sandbox frames and cannot read the portal/admin DOM. External embed hosts require a configured HTTPS allowlist. Admin has scrypt password hashes, signed expiring HttpOnly strict cookies, same-origin write checks, persistent hashed-IP login throttling and session invalidation on password change. Wrong PostgreSQL password was rejected in a direct connection check. No credentials are in tracked code.

Launch catalogue focuses on puzzles and Hextris arcade. Proprietary requested candidates were omitted where redistribution permission was not confirmed. Flash/Ruffle is not integrated and Flash publishing is rejected. Likes have no visitor button and remain infrastructure-only; zero likes are not fabricated. Play totals are actual Play-button starts, include QA traffic, and are rate-limited rather than identity-verified.

No Lighthouse score is claimed. Browser CSS viewports were tested, not physical touch gestures, every browser or every orientation. No paid service/API plan was purchased.

## Repository protections
GitHub’s branch-protection setup page explicitly reports that rules will not be enforced for this private repository until it moves to a GitHub Team or Enterprise organization account. No paid upgrade was made and no misleading unenforced rule was created. The committed CI workflow runs on production pushes and pull requests.

## Production and CI handoff
Production release `c30e83ef9cd555464b438542295332e819426fcd` was deployed successfully and the homepage, contact submission and 2048 frame were checked at https://browser-game-arcade.vercel.app. The contact form stored a clearly labelled QA message and displayed its success state.

GitHub Actions run 40485505842 was blocked before any runner/test step started. Its annotation says recent account payments failed or the spending limit must be increased. No billing settings were changed. This is an infrastructure block, not a passing CI run or a code/test failure. To retain automatic checks without changing billing, the new Vercel project build command runs typecheck, lint, the test suite and the production build in sequence. Final deployment results are recorded in HANDOFF.md.

Final deployment a99c94f20ed7cf9507aa9d6bcaff0224623d4fda reached READY with all four automatic Vercel checks successful; build log is committed under docs/verification/vercel-build.log. A final production API run passed login with the supplied initial password, persistent 26-game catalogue, protected contact inbox containing the browser-submitted QA message, and logout. The homepage screenshot is committed as docs/verification/production.jpg. The prior public QA fixture was removed from deployed public paths.

## Classics update verification — 27 October 2026

22 automated tests pass, including collection/runtime independence, preservation of 26 local originals, unique Hextris dual membership, navigation, admin classification validation, publisher URL constraints and honest external Moto X3M launch. Typecheck, zero-warning lint and production build pass.

Nine deployed preview API checks pass: unauthorized access, authenticated persistent catalogue, single dual-collection Hextris, classified draft creation, draft privacy, persisted dual assignment, invalid collection rejection, cleanup of the self-created fixture, and preservation of every pre-existing ID. Evidence: docs/verification/collections-api.json. Test uses a short-lived signed fixture session from the existing deployment secret, not a changed password or relaxed auth.

Stack rendered using the MIT upstream Three.js canvas fallback and responded to Start and Space placement/game-over. Moto X3M ran at the official Famobi destination: level selection, level 1 and Up-key acceleration were observed. Its iframe wrapper requires Famobi activation, so Sidequest presents an explicit external link. Slope, Moto X3M 2/3 reach publisher engines, but this cloud browser reports no WebGL. Gameplay for those three is unverified, not passed. See docs/CARLWALKS_STATUS.md for individual capabilities and limits.

The preview-only /qa-classics route uses only bundled candidate metadata and preview-mode players. It exposes no admin catalogue, credentials or drafts from the database, and returns 404 outside VERCEL_ENV=preview.

Production release f0fdcf5dd9e946ea9e5265a71f4daa0ae225507d reached READY (dpl_YZwCwnEeC8AB6LfywB68ZAPyWqj8). Stable domain checked: /classics has six listings; search moto finds three; /html5 has 26 with working 20/6 pagination; global search stack finds the new original. Homepage hero is Slope and classics headings precede HTML5 & Puzzles. The production admin/API suite passed all nine checks.

A fresh browser sweep rendered all 24 puzzle canvases and exercised every New game button. 2048 keyboard input changed the score from 0 to 8; Hextris reached its active pause-button state after launch. All 201 original runtime files match their launch Git blob hashes. Evidence: docs/verification/classics-legacy-runtime-checks.json. Stack public game page renders the canvas fallback. Slope’s public player displays the explicit WebGL warning in this unsupported browser. Moto X3M public page clearly says Play at Famobi and Publisher link. No new title requiring WebGL is represented as gameplay-passed.

## V4 owner-directed testing boundary

The owner requested that manual browser/gameplay testing be left to them because the hosted browser lacks graphics support for many games. No V4 game is claimed to have passed manual gameplay, mobile controls, save persistence, multiplayer service connectivity or audible output testing. The public entries and `docs/V4_INTEGRATION_STATUS.json` mark this as pending user review.

Automated checks cover catalogue completeness, source hashes, safe exact entrypoint allowlists, preserved existing identities and local licenses, type checking, lint, compilation and static asset deployment availability. These checks do not establish that a game completes its loading sequence or that an external service will remain available.
