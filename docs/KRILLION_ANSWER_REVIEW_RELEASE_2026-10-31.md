# Deep Dive question-bank review, alias safety and player reporting

Date: 31 October 2026. Scope: answer bank, review evidence, scoring protection and player reports. No changes to game animations or publisher backend.

## Shipped bank changes

- Independent practice now has 952 prompts and **560,449 playable entries**: 46 malformed imported scoreboard labels removed plus 26 source-backed pasta formats added, relative to the prior 560,469.
- All 46 removed labels had copied tier/count prefixes such as "Too clever (2) Kakapo"; the actual answer was **already separately present** in the same question. Full trace: data/krillion-review/removed-ocr-labels.csv.
- 26 pasta-shape names were added to KR0003, with deliberately **estimated 30-point practice tiers** and provenance reference. Manufacturer source: https://www.dececco.com/gb_en/products/semolina-pasta/ . This confirms a pasta shape, **not** official Krillion acceptance or original rarity.
- All **84** normalized collision groups were triaged. **55** same-tier orthographic pairs were reviewed and put in the independent-mode alias ledger; the runtime consolidates each pair while retaining both spellings and the existing score. The remaining **29** groups are held for distinct-entity or score verification, including all **five score conflicts**, preserved separately.
- All **96 questions without a documented 100-point answer** were classified: 37 finite-membership checks, 59 rare-member investigations. No 100-point score was invented.
- The **482** questions below heuristic numeric targets have a priority review queue based on current playable sizes. The targets are not claims that finite sets require more answers.
- All **2,553** model-reviewed candidates remain in a separate **quarantine** for independent category/source and rarity checks. None is added automatically.

## Player reporting and moderation

After a timed round ends, a player can report an answer the matcher rejected. The report includes the question, typed answer, mode, and optional explanation. It cannot change scoring or the accepted answer bank.

Server-side validation enforces request origin, field lengths, a honeypot and a per-IP-hash limit of six reports per hour. No raw IP or player password is stored in a report. A dedicated Neon table stores review items. Admin-only review/list/update supports pending, investigating, valid_unscored, invalid, duplicate. Review interface: /admin/answer-feedback. Marking a report valid does not change the playable bank. Migration: migrations/005_deep_dive_answer_feedback.sql.

## Reproducibility

- Source-backed update: scripts/krillion-curated-pack-update.py; provenance: data/krillion-review/source-reviewed-additions.csv.
- Queues generated from local research: python3 scripts/krillion-build-review-ledgers.py PATH_TO_LOCAL_AUDIT.
- Review data: data/krillion-review/summary.json, 84-collision-review.csv, 96-missing-100-review.csv, coverage-review.csv, model-candidate-review.csv.
- Runtime: public/play/deep-dive/recovered/independent-bank/reviewed-aliases.json.
- Original publisher-revealed 14-question 48,103-answer lane is unchanged; estimated practice tiers remain labeled EST.

## Work still requiring investigation

The 482 below-target prompts, 96 missing documented 100-point cases, 29 held collisions and 2,553 quarantined model candidates remain review work, not a claim of completion. The 26 new pasta formats are a verified independent subset, not a full validation of 560,449 answers. The original Krillion private matcher and player rarity distributions were not recovered.
