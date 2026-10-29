# Public Krillion free-surface audit — 29 October 2026

## Verified original browser surface

Unauthenticated Chromium visited eight official routes: Daily, Unlimited Classic, Packs, Puffer Party, Archive, FAQ, Account and Friends. It recorded 73 distinct first-party resource paths, not an exhaustive inventory of private or account-dependent states. Public routes were inspected without fake credentials, payment bypass or unauthorized requests.

## Exact animation recovery

public/play/deep-dive/public-reference-motion.css includes 67 unique, byte-equivalent public CSS @keyframes definitions extracted from the original stylesheets:
- Main title/ocean: 1pp18n31ii136.css and 0b3q6y7r_vxf6.css
- Multiplayer: 1vi73c022xus9.css
- Themed worlds: 3j9no1a_hemcb.css and 240trhd7lpzk0.css

Original SHA-256 hashes appear in the generated CSS. Animations are mapped to Sidequest's reconstructed classes. Exact keyframe code does not by itself prove pixel- or frame-identical output; original DOM, trigger events and positioning are still distinct. Reduced-motion support is retained.

## Source-backed free starter games

The original public GET endpoints for Unlimited 1 and Movies/Sports/Geography/Words 1 each returned 7 real prompts. The official prompt endpoints did not expose full scoring datasets. Independently published scored answer lists were matched only on exact mode, prompt ID and question text; their page URLs and SHA-256 checksums are recorded in public/play/deep-dive/recovered/free-starters.json.

| Mode | Original prompts | Questions with indexed scores | Recorded answer rows |
| --- | ---: | ---: | ---: |
| Unlimited Classic starter | 7 | 7 | 318 |
| Movies starter | 7 | 6 | 199 |
| Sports starter | 7 | 5 | 149 |
| Geography starter | 7 | 7 | 279 |
| Words & Language starter | 7 | 0 | 0 |
| TOTAL | 35 | 25 | 945 |

The Sidequest source-backed starter interface plays only prompts with recorded scored answers. Missing pack answer banks are visibly marked incomplete, and Words & Language is disabled. These archived lists may not include every alias or accepted answer of the actual server and may have historical scoring differences. They cannot be called the complete original 30-chapter packs.

Independent Daily archive from earlier PR #29 is preserved: 105 dates, 735 prompts, 499,704 historical score rows. The official October 29 sheet adds 7 prompts and 16,727 recorded scores.

## Validation

Run node --check public/play/deep-dive/game.js, npm run typecheck, npm run lint and npm test. Headless Chrome testing at desktop 1440x900 and mobile 390x844 validates new free-mode buttons, questions, one indexed score each round, five recovered pack selectors, original motion names, and browser errors.

## Material gaps

The original server-side scoring and aliases, private source repository, paid data, free starter lists not yet published by independent archives, later chapter access, all live matchmaking/account/leaderboard/friend services, exact DOM hierarchy, and all event timings cannot be established from browser resources alone.

Do not claim whole-game or line-by-line parity. Future changes should compare exact first-party reference states and recover only data legitimately available through ordinary public gameplay or openly published archives.
