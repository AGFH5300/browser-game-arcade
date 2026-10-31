# Krillion answer submission and spelling-check audit (31 October 2026)

Scope: question-bank validation, typo correction and feedback speed only. Visual parity and original private datasets are outside this workstream.

## Source-observed behavior

Inspected publicly delivered client scripts of https://krillion.io/ on 31 October 2026. The production Turbopack script 0xnn97mqphu2s.js reveals that the original client:

- Disables browser spellCheck and autoCorrect.
- POSTs to /api/submit with date, promptId, answer, previewCorrection and playerId; it uses a five-second fetch timeout.
- Treats a correction field as a proposed canonical spelling. It replaces the input and previews the correction; the user submits again to confirm.
- Accepts server responses with accepted, tier, and optional score, answer, and quip. On rejection, the timer continues and the player can guess again.

The server-side algorithm behind /api/submit is not present in public browser bundles. Tested JavaScript source-map requests returned HTTP 403. Neither RSC payloads nor Next.js manifests can reconstruct a private API-route implementation. Therefore exact source parity for the private validator is not established.

## Sidequest implementation

- Retains local, synchronous per-question scoring without a network request to the original game.
- Indexes canonical answers and aliases once per question on first fallback lookup. Exact matching uses cached maps; typo distance checks only candidates of relevant length, plus a bounded memo cache.
- Uses restricted Damerau-Levenshtein (including adjacent transposition); 5-9 chars allow one edit, 10-17 allow two, 18+ allow three.
- Refuses fuzzy correction for very short input or equally close distinct answers. A canonical entry outranks any competing alias.
- Preserves leading articles, e.g., Predator vs The Predator; retains accent- and punctuation-insensitive exact spelling.
- Preserves two-step confirmation and the correction preference. Editing the suggested correction invalidates that suggestion. Tier values come only from the matched answer.

## Test evidence and limitations

The 32,255-answer KR0545 pack is part of automated matching/performance tests. Same-machine baseline comparisons: old matcher roughly 72ms first typo and 60ms repeat; indexed matcher roughly 48-55ms cold and 6-10ms repeat before bounded memoization. Device-dependent figures, not universal latency guarantees.

Our local typo heuristic approximates the original server behavior rather than claiming its unavailable private code. Independent bank source reliability and empirical rarity calibration remain distinct unfinished audits. No original server code was copied or deployed.
