# Deep Dive / Krillion reference reconstruction — 29 October 2026

The Sidequest owner reports the original creator authorized use of publicly delivered files and game mechanics. This release avoids relying on unverified access to private source repositories or bypassing paid features. It is **not a complete duplicate** of the publisher's private platform.

## Public game asset inventory

`public/play/deep-dive/reference-assets/manifest.json` records **59 publicly served files**, **11,245,012 source bytes**, complete source paths, local paths, and SHA-256 hashes. The asset batch downloaded successfully, including desktop/mobile original reef art, sleeping/active puffer frames, rank sprite art, ocean/pack covers, and scenic backgrounds. The assets were recovered from paths referenced by publicly delivered JavaScript/CSS and normal `/party` browser requests; no restricted endpoints or account credentials were used.

The existing title-screen original sky, ocean, puffer, font are retained under `reference-art/`. The newly recovered images live under `reference-assets/` and are served from Sidequest, not hotlinked from the publisher.

## UI/feature changes

- Reconstructed the Puffer Party title/lobby scene around publicly served pixel-reef desktop/mobile scenes, puffer artwork, a title header, character selection, room sizes, quick play, public rooms, private codes and a rule explainer.
- Character choices are **Krill, Schooler, Squid, Angler and Evil**; client-side daily streak thresholds of **0/5/14/30/45 days** govern availability in the interface. All five sprites are local. Character choice is recorded with server member state and displayed to other players; anonymous clients do not have centrally authenticated daily streaks, so this is **not server-verified rank progression**.
- Party room capacity choices are 2, 3, 6 or 8, with real backend admission limits. Three-player rooms require three players; 4–6 requires four; eight-capacity rooms can start at two to avoid an unfillable room. Existing 2–8 rooms still work.
- Public-room Quick Play joins an available room of the chosen capacity or creates a public host room; host still starts the game after the players are ready. Rated matchmaking, ELO, remote account progression and publisher chat content are not implemented or misrepresented.
- Original Sidequest multiplayer remains server-authoritative, with turn deadlines, anti-duplicate checking, live chat, heart penalties and a winner screen.
- Dynamic script versioning prevents cached UI; menu automatically closes when selecting the game mode.

## Public-source limitations verified

- Publisher's public daily reveal on **2026-10-29** returned seven prompts and 16,727 exactly scored answer records; those were integrated in PR #24 and retained through the parity integration PR #25.
- Normal `GET /api/reveal?date=...` requests for **2026-10-28, 2026-10-20, 2026-10-01, 2026-09-01 and 2026-07-16** returned HTTP 403, explicitly denying historical answer-sheet access.
- Unlimited Game 1 was observed through the published UI and API. The original server reported HTTP 402 for later games; no paywall circumvention or nonpublic answer corpus recovery was attempted.
- The complete original server code, arbitrary historical quiz answers, unknown aliases, paid content, rated matchmaking, and original service infrastructure **have not been recovered**. Public frontend bundles alone cannot supply these.

## Verification

Run `npm run typecheck && npm run lint && npm test`. Visual checks: 1440×900 and 390×844, both using local recovered artwork; browser test both manual public rooms and Puffer Party live match through a Vercel preview before merging.
