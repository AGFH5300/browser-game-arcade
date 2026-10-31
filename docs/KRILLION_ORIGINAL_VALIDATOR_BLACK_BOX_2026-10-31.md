# Krillion original correction validator: what is and is not recoverable

Date: 31 October 2026. Scope strictly answer-bank correction, accepted-answer scoring and submit latency, not visual parity or other game screens.

## Source inspection and recoverability

The public official page at https://krillion.io/ served Next.js/Turbopack browser chunks. Its directly served chunk `0xnn97mqphu2s.js` contains the `POST /api/submit` request and response handling:

- Request JSON: `date`, `promptId`, `answer`, `previewCorrection`, `playerId`.
- Responses: `accepted`, optionally `answer`, `tier`, `score`, `quip`; or `correction` for a two-step spelling confirmation; or `accepted:false` for rejection.
- The client explicitly sets `autoCorrect:off` and `spellCheck:false` on the input.
- The client sets a 5,000ms request abort timeout; its longer fallback handles stalled requests.

The distance metric, alias table, tie-breaks, and correction thresholds live behind the **publisher's own server endpoint**. They were not present in the served browser JavaScript or HTML. Tested source-map URLs returned HTTP 403. This is **not original server source-code recovery**. Private code cannot be reconstructed merely from the RSC payload, build manifest, or public page.

## Public FAQ corroboration

The publisher's official FAQ (https://krillion.io/faq) states that autocorrect checks aliases too, and cites a "sea monkey" versus "sea donkey" alias collision. This means alias matching, including surprising suggestions, belongs to the correction behavior; it does not uniquely identify the scoring algorithm.

## Bounded live-validator observations

All tests below were run against the public 31 October 2026 Daily Dive via the documented browser-used `/api/submit` protocol, with controlled spelling examples, a temporary nonpersonal player ID, and no account privileges. Their returned JSON is summarized below:

| Prompt / input | Official outcome |
|---|---|
| Orange fruit or vegetable: carrot | accepted Carrot / plankton / 10 |
| Orange fruit or vegetable: carot | correction Carrot |
| Orange fruit or vegetable: Carrots | correction Carrot |
| Orange fruit or vegetable: carrt | correction Carrot |
| Orange fruit or vegetable: carorrt | rejected with no correction |
| Orange fruit or vegetable: carrote | correction Carrot |
| Country with black or orange flag: Germany | accepted Germany / plankton / 10 |
| Country with black or orange flag: Germny | correction Germany |
| Country with black or orange flag: Germnay | rejected with no correction |
| Country with black or orange flag: Gremany | rejected with no correction |
| Country with black or orange flag: GERMANY | accepted Germany / plankton / 10 |
| Animal feeding on blood: Mosquito | accepted Mosquito / plankton / 10 |
| Animal feeding on blood: Mosqiuto | correction Mosquito |
| Animal feeding on blood: Mosqito | correction Mosquito |
| Orange fruit or vegetable: Mandarin | accepted Mandarin / schooler / 30 |
| Orange fruit or vegetable: Mandrain | correction Mandarin |
| Orange fruit or vegetable: Persimmon | accepted Persimmon / rare / 60 |
| Orange fruit or vegetable: Persimomn | correction Persimmon |
| Masked fictional character: Spidre-Man | correction Spider-Man |
| Masked fictional character: Spdier-Man | correction Spider-Man |
| Masked fictional character: Spedr-Man | correction Spider-Man |
| Masked fictional character: Spidre-Man with previewCorrection false | immediately accepted Spider-Man / plankton / 10 |
| Orange fruit or vegetable: carot with previewCorrection false | immediately accepted Carrot / plankton / 10 |

## Supported behavioral inference

All the above can be explained by standard Levenshtein (where an adjacent transposition has edit cost two), using a maximum of one edit for 7-or-fewer letters and at least two for eight-or-more letters. For example, "Germnay" is two standard edits away from "Germany" (7 letters) while "Mosqiuto" is two from "Mosquito" (8 letters). This pattern is consistent, not proof of the private implementation or its exact thresholds.

Sidequest's previously installed **restricted Damerau-Levenshtein** gave a 1-edit cost to the 7-character Germany swap and therefore was demonstrably more permissive than the source. The revised implementation uses standard Levenshtein; it raises the two-edit cutoff at length eight, preserves canonical priority and declines ambiguous suggestions. The existing 18+-character three-edit allowance remains provisional and unverified. Exact input and fixed scoring are still local, with no original API dependencies.

## Why exact implementation cannot be certified

Finite requests cannot prove two validators equivalent across arbitrary spellings, alias collisions and all answer lists. Exact code identity would require the publisher to provide the private implementation or release the corresponding server code. This artifact does not claim that happened.
