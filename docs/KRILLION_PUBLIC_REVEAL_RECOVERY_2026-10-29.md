# Public Krillion answer-sheet recovery, 29 October 2026

The user reports that the original creator gave permission to reproduce public game data. This implementation uses publicly responding endpoints and normal gameplay, not private source, credentials or bypasses.

## Verified public evidence
- GET https://krillion.io/api/today: date, day number, reset time and seven prompts.
- GET https://krillion.io/api/reveal?date=2026-10-29: 16,727 exact accepted answer records across seven prompts, with answer, tier, score, and quip. Response is preserved in public/play/deep-dive/recovered/2026-10-29.json.
- GET https://krillion.io/api/answer-popularity?date=2026-10-29: 10,662 distinct visible answers with play counts. Popularity is not the original editorial tier assignment.
- Headless Chromium normal Unlimited Game 1 play: GET /api/unlimited/1 returned seven prompts; a submitted answer of Ramen to noodle dish triggered POST /api/unlimited/1/submit returning accepted true, plankton, score 10, and a signed receipt.
- Games 2 onward returned HTTP 402 Payment Required without an unlock. Collection stopped. No paid game data was bypassed.
- Client bundles exposed six tiers with exactly 10/15/30/60/85/100 points, and public Puffer Party exposed character progression, rated/unrated play and room sizes.

## Integrated into Deep Dive
- Publisher-sourced Daily #106 on 29 Oct, with 16,727 verified answer entries, score and original response text; six exact rarity tiers; normalization of visible accepted strings. The publisher's additional alias/autocorrect rules are not fully reproduced.
- Dated source snapshot ensures reliable play on Oct 29.
- For future dates, Sidequest GET /api/deep-dive/public-daily reads the publisher's current public today and reveal endpoints, schema-validates dates/prompts/tier-scores, checks response sizes, and caches for 15 minutes. Browser answers are validated locally; player answers are not sent upstream.
- Source-backed Daily completion has separate save key from older independently written Daily runs. Independent 90-question Endless and Worlds remain available. The independent Neon-backed Puffer Party remains available.
- Failure to load an official daily is labeled; scores for independent practice are not presented as original publisher scores.

## Validation
- Local Chromium desktop 1440x900 and mobile 390x844 completed all seven source-backed questions with the genuine 100-point entries and exact one-line result text: 700 points and 7000m depth. Zero browser page errors.
- Typecheck, lint and 77 tests passed prior to packaging.
- Must verify hosted Vercel preview, public daily proxy, two-browser Puffer Party and Sidequest player before shipping.

## Explicit limitations
- This is NOT a byte-identical full implementation of the publisher's server-side game. Private scoring services, paid game sets, fuzzy autocorrect aliases, account features and original Puffer Party backend are not recovered.
- Reuse is based on the permission reported by the user; additional publisher terms should be checked before commercial redistribution.
