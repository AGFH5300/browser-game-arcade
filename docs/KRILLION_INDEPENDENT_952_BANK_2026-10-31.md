# Krillion recovered practice bank — 31 October 2026

Sidequest now has two separate data lanes in the Deep Dive replica.

## Publisher-revealed lane

Unlimited dives 3–4 contain 14 source-revealed Krillion questions, with 48,103 recovered publisher-scored answer entries (two malformed one-character entries withheld). The provider-derived scores are preserved.

## Independent practice lane

Unlimited dives 5 and higher load 7 of the 952 independently recovered questions per dive. A full cycle of 136 dives uses each question exactly once per cycle, in a deterministic randomized order. Each question and its answer list is loaded individually, not as the 51-MB master. The initial manifest is about 135 KB.

The exported source contains **560,469 scored answer entries** in 952 packs from the research master (560,473), with four genuinely identical or unresolved conflicting entries excluded. The untouched research master is saved separately under `KRILLION_COMPLETION_AUDIT_2026-10-31/`. Only publisher-verified answers enter the first lane. The other lane has individually visible source codes, and its results display **EST.** for scored answers, because original Krillion acceptance and live player guess frequencies have not been established for this entire recovered corpus.

Source/provenance codes are `historical`, `publisher`, `free`, `community`, `editorial`, `lexicon`, `reference`, `geo`, `ai`, and `gbif`.

## Important limitations

- A historical/archive record is not automatically a verified source score: an implausibly high percentage of answers are marked as Deep Cut (85). Source validity and scoring provenance are preserved, not silently altered.
- A valid GBIF species name does not prove the original game accepts the scientific name or that the player's guess deserves exactly 100 points.
- Lossy normalization can equate distinct names. Four unresolved conflicts or duplicates were excluded from the independent export to avoid wrong scores; they remain available for manual review in `EXCLUSIONS.csv`.
- Existing Daily, Unlimited 1–2, Puffer Party, Friends, Archive, visual animations and accounts are not changed by this import.
- No original live production database or purchases were accessed.
- A clean test suite and Next.js build do not prove original game frame-by-frame parity.

## Reproduce and validate

```sh
python3 /path/to/prepare_independent_bank.py
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

The practice loader checks the manifest's explicit non-publisher flags and verifies each lazy question file's length, identity and six score tiers before use. `tests/krillion-independent-bank.test.ts` verifies all 952 files and deterministic full-cycle coverage.

Source attribution: independently recovered public question texts, scoreboard archives and publisher-revealed answer records from https://krillion.io, GBIF accepted species taxonomy at https://www.gbif.org/, GeoNames and English word lists; see local source-provenance audit for per-entry evidence. These materials must not be described as official production source code or an exact copy of private scoring.

## Follow-up quality update (31 October)
The current practice bank removed 46 malformed duplicate scoreboard labels and added 26 manufacturer-documented, estimated pasta formats. New total: **560,449** entries. See docs/KRILLION_ANSWER_REVIEW_RELEASE_2026-10-31.md for the source audit, validation limits and review queue. The 560,469 figure above refers to the previous release snapshot.
