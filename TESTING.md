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

The browser login form is scheduled for final production inspection; the authenticated admin workflow was verified through the actual APIs. No user password was entered through browser automation. Password-change validation and session revocation were reviewed and unit tested for their underlying primitives; a real administrator password change was not performed.

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
