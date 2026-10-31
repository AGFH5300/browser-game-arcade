# Faster, conservative Krillion-style answer correction

Date: 31 Oct 2026. Changes in this PR affect only Sidequest's independently implemented answer matching; no part of the original publisher's private server source was recovered.

## Changes

1. Retain exact answer and alias matching, canonical-title priority, article-sensitive titles, normalized punctuation/accents, explicit two-step correction and stored, fixed answer scores.
2. For typos, keep the evidence-informed Levenshtein edit budgets and unique-best-answer requirement. A corrected spelling is never assigned a newly invented tier.
3. Replace full Levenshtein matrix scans with an **exact banded** dynamic program; a candidate within max edits cannot leave the diagonal band.
4. Precompute a small 37-character frequency vector for each candidate and reject impossible matches when the summed frequency difference exceeds twice the allowed edit distance. This is a provably necessary lower-bound filter, not approximate candidate selection. It therefore cannot discard a genuine within-budget match.
5. Precompute the question-scoped answer index during the three-second question preview on browser idle callbacks (with timer fallback), rather than on the first mistyped submission.
6. Keep the 96-entry bounded lookup memo and per-question WeakMap index cache to avoid per-guess repeated normalization.
7. Test exact banded distance and the character-profile safety invariant against a full unbanded reference implementation for **6,000 reproducible random string pairs**, at edit budgets 1, 2, 3. Test the official observations and alias ambiguity cases.

## Performance — measured, not guaranteed

On authorized test Mac with Node 22, local script compared current main and the changed matcher for the *same* 27 inputs against a real 32,255-answer pack (KR0545). Outputs were exactly the same for all 27 queries. Single-run timings:

| Metric | Before | After |
|---|---:|---:|
| All 27 submissions including cold index creation | 226.4 ms | 83.5 ms |
| Cold first fuzzy query | 69.7 ms | 73.1 ms |
| Second distinct typo | 5.77 ms | 0.73 ms |
| Another distinct misspelling | 9.02 ms | 0.58 ms |
| Long unrelated guess | 23.42 ms | 1.89 ms |

These figures vary with CPU, JIT, loaded answers and input. Prewarming in the preview reduces the chance the cold cost appears in the answering phase. No remote request is made when answering; scores still come only from the loaded question's data. No unverified original algorithm identity is implied.

## Limitations and next improvements

- Exact original alias databases, server matching code, cross-answer tie-breaks and 18+ character cutoff remain unverified.
- The publisher FAQ itself warns of surprising alias corrections; the local implementation deliberately rejects equal-distance ambiguity rather than guessing.
- 952 independent prompts' estimated tiers are not certified original rarity; bank-quality, 100-point coverage, and alias conflict audits remain separate work.
- Potential next step: opt-in user-friendly multiple-suggestion UI when two candidates tie, but do not credit either without explicit selection and category-validity review.
- Potential next step: maintain a small human-verified per-question alias ledger with canonical destination and source provenance; avoid unconstrained automatic synonym generation.
