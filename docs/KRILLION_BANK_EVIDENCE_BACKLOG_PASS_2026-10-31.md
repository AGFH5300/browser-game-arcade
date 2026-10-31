# Krillion question-bank evidence pass — 31 October 2026

Scope: independent Sidequest practice question bank only. No private original Krillion source, empirical player rarity, publisher-revealed scores, animation or purchasing logic was modified.

## Playable answer expansion

Independent practice had 560,449 playable answer entries across 952 prompts before this pass. It now has **561,107**, adding **658** independently source-supported entries at **estimated 30-point practice tiers**. This is not a claim of original publisher acceptance or rarity.

- **559 lexical answers** for eight literal English substring or suffix prompts: manu, neuro, multi, path, ough, anti, age, and words ending in ism. Exact alphabetic substring matching, a locally held 370k-word English reference and the independent multi-source wordfreq English corpus were required. Frequency threshold Zipf >=1.5 verifies meaningful corpus presence, NOT the original game's guess-popularity score.
- **75 scientific binomials** newly added for taxonomically explicit animal questions. Of 755 model-suggested scientific-name occurrences (736 distinct names) sent to GBIF v2 batch match, only 89 passed the strict species/category checks. Fourteen were already playable, so 75 exact binomials were added. Conditions: exact match, confidence at least 95, accepted name, rank species, canonical name equal and taxonomic order/class/family consistent with the specific question.
- **24 GBIF English common names or qualifying scientific binomials** newly added for prompts asking for animal names beginning with a specific letter. Source checks required both the verified species and either an exact English vernacular-name match or a verified scientific binomial starting with the requested letter. One of the 25 qualifying entries was already playable. Nine other checked possibilities lacked matching GBIF English names and were withheld.
- Never automatically assign 85- or 100-point tiers to these additions. The publisher-revealed 48,103 entries in a separate bank remain untouched.

Sources and attribution: local English source references dwyl English Words (https://github.com/dwyl/english-words), whose README acknowledges original wordlist provenance limitations. Wordfreq by Robyn Speer (2022), https://doi.org/10.5281/zenodo.7199437, licensed data CC BY-SA 4.0 with required attribution. The shortlist is cross-filtered and no complete dictionary is redistributed. GBIF API and taxonomy interpretation: https://techdocs.gbif.org/en/openapi/v1/species and https://techdocs.gbif.org/en/data-processing/taxonomy-interpretation . A GBIF match does not prove an asserted behavior, color, geographic habitat or original game's acceptance.

All per-answer source evidence and GBIF raw returned diagnostics are retained in data/krillion-review: lexical-additions.csv, gbif-taxon-results.json, gbif-candidate-verification.csv, gbif-source-reviewed-additions.csv, gbif-vernacular-verification.csv, and gbif-vernacular-additions.csv. Reproducible scripts are in scripts/krillion-*.

## Collision adjudications

The earlier audit had 84 normalized name collision groups; **57** are now approved same-tier orthographic aliases, up from 55. The new same-entity decisions are Access Air/AccessAir (contemporaneous U.S. Senator source: https://www.grassley.senate.gov/news/news-releases/grassley-seeks-prompt-action-accurate-posting-access-air) and the ISP up.net/Upnet (provider's own site https://up.net/upnet-news-alerts). Both retained their exact existing practice tiers.

Of the 27 pairs NOT collapsed, four are now independently source-confirmed to be distinct, rather than unresolved spelling errors:
- Basse-Terre in Guadeloupe versus Basseterre in Saint Kitts (https://www.insee.fr/fr/metadonnees/geographie/arrondissement/9711-basse-terre).
- George Town in the Cayman Islands vs Georgetown in Guyana (https://otp.gov.ky/web/govky/ourislands ; https://factpage.glsc.gov.gy/basics/capital-city/).
- New Quay in Wales vs Newquay in Cornwall (https://www.ceredigion.gov.uk/media/dripe2fr/2024-new-quay-place-plan.pdf ; https://www.newquay.gov.uk/).
- North Central University in Minneapolis vs former Northcentral University merged into National University (https://www.northcentral.edu/ ; https://www.nu.edu/national-and-northcentral-have-merged/).

**23 pairs still lack independent identity proof**. All five historical score conflicts remain preserved. The four distinct-name groups need no alias merging.

## Scores and arbitrary numerical targets

The 482 questions below legacy category targets reflect heuristic thresholds (150/400/1000 entries), not a verified number of legitimate category members. New verified additions decrease the numeric shortfall but the same 482 can still be below large thresholds. Five lexical prompts have a 1,000-entry heuristic target that exceeds the entire local reference dictionary's count matching the literal word rule; this is an unsupported *local screening target*, not a claim about the entire English language. See lexical-target-audit.csv.

**96 cases still lack a documented publisher 100-point score** (37 finite-category membership cases, 59 rare-member research cases). There is no mathematically necessary 100-point answer in any finite trivia category; a genuine 100 point score requires actual source observation or game-specific rarity data, and none is invented here. The 96 case-by-case records remain on the queue.

The full 2,553 model-only suggestions remain quarantined unless a separate independently sourced taxonomic answer was admitted. GBIF source checks found 89 exact species/category candidate occurrences, 251 additional exact taxa without question-category proof and 415 non-exact/unresolved taxa among 755 scientific-name proposals. Other model suggestions still lack independent verification. We do not misrepresent these results as a complete original-publisher validator recovery.

## Verification

Run npm test, npm run typecheck, npm run lint and node --check public/play/deep-dive/game.js. All pack provenance flags remain originalPublisherAcceptanceVerified=false and allScoresEmpiricallyCalibrated=false. No remote server request occurs during player answer checking.
