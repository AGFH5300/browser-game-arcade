# Deep Dive historical question coverage and fidelity — 29 October 2026

## Public answer collection

The October 29 official published reveal remains unchanged in `public/play/deep-dive/recovered/2026-10-29.json` and contains 7 questions and 16,727 recorded answers.

The independent public archive at `krilliongame.com/krillion-answers/YYYY-MM-DD/` makes older daily results available as public page-embedded JSON (`krilling-practice-data`). The source is an independent reference, not the publisher's official historical API. With 2 concurrent workers and retries, `scripts/collect-public-krillion-archive.py` collected 105 daily snapshots from 2026-07-16 through 2026-10-28 inclusive:

- 105 dated sheets, exactly 7 prompts each: **735 historical prompts**.
- **499,704 answer rows** with the published six-tier points (10, 15, 30, 60, 85, 100).
- All 105 snapshots contain the correct source date, nonempty question text, expected answer score values, and unique prompt IDs; no errors in the collection manifest.
- The published companion archive's recorded scores are historical snapshots and not guaranteed identical to Krillion's latest scoring service or aliases.
- Each snapshot embeds source URL and SHA-256 checksum of the corresponding publicly served web page, enabling provenance audit.
- Data are stored in local game files, so no third-party API calls or account credentials are needed at runtime.

The official older reveal endpoint previously returned HTTP 403, and later paid Unlimited modes returned HTTP 402; **these boundaries have not been bypassed**. This release does not contain every private, paid, or undocumented question or every accepted alias.

## UI and gameplay

The archive now lists and plays each of the 105 original dated sets, loading the selected answer sheet on demand. The source is identified accurately in results and play mode. Extended practice draws 50 questions from 9 historical dates, with 3 zero-point misses ending the run, 25-second timers, and condensed 14-dot HUD on long runs. It restores in-progress dated rounds from local storage.

`fidelity.css` improves the retro screen appearance and motion: ocean-scene transitions, floating fish, question entrances, timed low-clock alert, tier/result animation, responsive pixel-styled date cards, themed-mode cover backgrounds from the already-recovered public asset batch, and reduced-motion support. `index-public-art.html` includes a versioned CSS link and cache-busted script. Existing real-time Puffer Party backend is not replaced.

The visuals use the same publicly delivered images already recovered with SHA-256 manifests, but this code is **not** a line-by-line duplicate of Krillion's original private client/server source or animations. Fidelity remains approximate where original transitions and logic are not observed.

## Verification

Run `node --check public/play/deep-dive/game.js && npm run typecheck && npm run lint && npm test`. New tests validate every published archive sheet, score, and frontend wiring. Run browser checks at desktop 1440×900 and mobile 390×844 to verify archive selection, 100-point scored answer, and three-miss extended-mode completion. No paid/private game data was fetched.
