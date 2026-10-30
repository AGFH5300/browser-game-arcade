# Deep Dive / Krillion — full functional audit (30 October 2026)

**Scope:** Live production `https://browser-game-arcade.vercel.app/games/deep-dive`; independent Playwright Chromium desktop (1440×900), mobile (390×844), two simultaneous browser contexts, manual browser-agent sweeps, live multiplayer HTTP API probes, source inspection, and historical-asset validation.

**Production changes:** None. Audit code is isolated on `qa/deep-dive-full-flow-20261030`.

## Broad automated QA (final run)
- GitHub Actions: https://github.com/AGFH5300/browser-game-arcade/actions/runs/41073317089
- **25 PASS / 5 FAIL, 30 named checks.**
- Three failures definitively reproduced application issues:
  1. Low-power preference loses its state on reload (write key `lowPower`, read key `low-power`).
  2. Answer Corrections loses its state on reload (write `answerCorrections`, read `answer-corrections`).
  3. Clear Rejected Entries loses its state on reload (write `clearRejected`, read `clear-rejected`).
- Two failures mean **not verified by this particular suite**, not confirmed game failures:
  4. Automated seven-round Unlimited flow reached the end of its answer/next loop, but `.dd-done-inner` did not become visible within its final timeout. Previously a separate human-style browser agent successfully completed seven questions and viewed a results page: https://agent.tinyfish.ai/runs/4ad389c9-7d9a-4ecc-9ee3-fa75c159dbc1 . Needs diagnostic browser-state capture to distinguish missed transition, hidden results, and test timing.
  5. Results filter/rating/copy test did not start because the previous Unlimited test did not reach the summary screen. Separate prior browser run did click rating and copy-result.

### Broadly verified working
- Loading overlay clears, home appears; animated title and sky keyframes are present; sound mute/unmute persists; full navigation modal, FAQ, Escape and close work.
- Daily Dive launches, prompt/HUD and countdown appear; active Daily game survives reload.
- Character selection exposes the expected four locked choices.
- Four themed-pack lists and 120 chapter buttons; Movies, Sports, Geography starter prompt/worlds load; Lexicon is intentionally disabled because it has no verified scored responses; independent practice first chapter opens while second is locked.
- All **105 historical Archive snapshot JSON files** fetch successfully and have seven prompts with nonempty answer lists (**735 prompts**). Archive month/date UI loads; first historical date begins; Return to Daily works in an isolated browser.
- Mobile viewport 390px: no horizontal page overflow on home or Party; home, menu, Party, Archive, Packs and settings render.
- Two independent browser sessions **both interacted through the Party UI**: create, join, ready, host-start, synchronized prompt, valid answer, duplicate rejection, alternative answer, chat, pass/leave. Source was untouched.
- Live HTTP API: private room create/join/ready/start, public listing, ready gating, answer acceptance, duplicate rejection, chat and leave worked; room sizes 2, 3, 6 (minimum 4), and 8 were also exercised and cleaned up.

## Additional CONFIRMED issues from separate targeted tests
1. **Party Public · Listed checkbox resets on room-capacity changes.** Browser reproduced: checked → 1V1 → unchecked. Render rebuilds checkbox from stale `publicFlag`. https://agent.tinyfish.ai/runs/427d1c69-a590-41e8-ba1f-216a91522c85
2. **Main navigation Settings is broken from Archive and Party pages.** Opens on Daily home, but on Archive/Party merely closes the menu because `.dd-reference-preferences>summary` does not exist in those screens. https://agent.tinyfish.ai/runs/2e2bdfea-f56f-4b79-8959-3597a7f2b57c
3. **Duplicate Party nickname yields misleading HTTP 503 instead of a validation failure.** Server correctly blocks duplicate names, but route error mapper treats `That nickname is already in this room.` as service error.
4. **Room API does not enforce streak-gated avatars.** An unauthenticated room creation submitted `avatar: 'evil'` and returned avatar `evil`; browser UI alone enforces streak locks.
5. **Unlimited accepted-answer coverage incomplete.** Public starter questions frequently have only 50 independently indexed answers; common responses `coffee`, `merlot`, `oops`, and `Japan` are absent, causing false-looking rejections. This is a data-coverage limitation, not proof that the match algorithm is broken.
6. **Full original 1:1 parity not established.** Animations are present and function; no frame-by-frame original/source comparison or exhaustive original private content validation was possible.

## Important qualifications
- The final Playwright run has 5 FAIL in its machine result, but it does **not** establish five independent game defects. Three are confirmed settings failures. Two arise from one Unlimited/results sequence whose end state was not conclusively observed.
- Earlier Playwright runs had **false positives** because tests clicked hidden nav controls or awaited a closed menu to become visible. Those issues were corrected before the final 25/30 run.
- The Puffer Party HTTP backend and two-browser UI **do work**; do not describe hosting as down based on the first failed browser-agent session.
- User-visible settings behavior, public/private room choice, and server error classification deserve fixes before calling this production-ready.
- No production fixes were deployed as part of this audit.
