# Krillion verified-bank integration — 31 October 2026

This staging branch extends the independently developed Sidequest Deep Dive replica. It does **not** modify Krillion's private servers, clone private account data or deploy to production.

## Provenance and scope
- The local recovered master contains 952 questions and 556,845 scored entries including historical scores, free-mode samples and provisional additions.
- **Only** `status: "publisher"` records are eligible for this branch's game-facing import. There are 14 qualifying questions and 48,103 individually imported answers.
- Two one-character source entries were withheld. Distinct `Dume` (85) and `Dum-E` (60) entries are retained rather than conflated by over-aggressive punctuation normalization. The withheld records are listed in `source-score-conflicts.json`.
- The publisher import was generated from the 31 October local master using `scripts/krillion-import-publisher.mjs`. No provider API keys or private database connection strings are included.
- Source: original publicly revealed Krillion answer lists, observed and recovered under the user's authorized research; `https://krillion.io/`. Original publisher score tiers are preserved.
- The import does **not** claim the entire bank is fully source-verified. Historical/community records and all AI/manual/corpus/GBIF estimated scoring are excluded from game-facing question packs here.

## Runtime integration
- Existing Sidequest practice questions, Daily Dive and Unlimited #1–2 remain unchanged.
- Unlimited dives #3 and #4 lazily load seven publisher-revealed questions each, verify manifest provenance and exact tier schema, and use the original 10/15/30/60/85/100 point scale.
- Individual question JSON files are loaded only when needed; the 51 MB research master is never transmitted to a browser.
- If validation fails, the existing player-facing fallback handles the error; no untrusted answers are silently treated as publisher-scored.

## Reproducibility
From the checked-out branch:

```sh
node scripts/krillion-import-publisher.mjs /absolute/path/to/QUESTIONS_AND_ALL_ANSWERS.json
npm ci
npm run typecheck
npm run lint
npm test
node --check public/play/deep-dive/game.js
```

Never run the importer with AI-model output alone or commit local free-provider secrets. All question-source provenance is retained. To prepare later publisher-verified material, update the importer with explicit per-question evidence and tests, not a broad allowlist of estimated statuses.

## Remaining blockers
1. Validate the 96 questions currently lacking a 100-point answer without artificially inventing rarity in finite categories.
2. Resolve source conflicts and 84 normalized duplicate groups.
3. Independently substantiate thousands of provisional GBIF/model/manual suggestions against each prompt, including their scoring semantics. GBIF taxonomy supports biological classification, not published Krillion acceptance or measured player popularity.
4. Confirm branch deployment, seven-round gameplay, sound and pixel parity; no production release is implied by these tests.
