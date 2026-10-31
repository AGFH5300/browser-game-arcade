# Independent Krillion answer-bank expansion — source-backed categories and English names

Date: 31 October 2026. This release changes question answers and validation aliases, not visual animations, monetization, original server APIs, or publisher-confirmed scores.

## Source-driven expansion

The independent Sidequest bank initially contained **561,152 answers in 952 packs**. The new taxonomic pass added **55** accepted GBIF species binomials from eight strictly determined category types: lizards (7), marsupials (5), turtles and tortoises (5), waterfowl (6), mollusks (2), cold-blooded vertebrates (12), flowering plants (10), and fruiting-body mushrooms (8). All were exact taxonomic identities with species rank, accepted status, at least 95 confidence, and the relevant order, family, class, kingdom or phylum. Each received an independently ESTIMATED 30-point practice tier, **not** an original Krillion rarity. One uncertain fungal candidate was held. New total **561,207 independent scored entries**. The 48,103 separately publisher-revealed scored answers remain untouched.

Per-answer taxonomic evidence: `data/krillion-review/gbif-additional-categorical-taxonomy.csv`, with a GBIF species URL and taxonomic identifiers. Reproduce using `scripts/krillion-more-taxonomy-categories.py` and the previously documented 736-name GBIF v2 response cache.

## 958 English common-name aliases without new scores

The pass recovered **958** safe English common-name aliases across **23 question packs** from a sampled **1,054** Latin species names (capped at 150 existing Latin entries per very large question bank). Many packs already contained GBIF-verified Latin names while players would naturally type English common names. We sampled the public GBIF taxon catalogue, verified each binomial independently against the v1 *species/match* endpoint (EXACT, accepted, rank species), and fetched the GBIF English vernacular name list for only matching taxon IDs. Only spelling-safe, question-relevant aliases are retained. Strict matching retained only verified GBIF accepted species. The `Name an animal whose name starts with X` questions additionally require that any common-name alias also start with the requested letter. Names that collide with an existing scored canonical or another sampled species are excluded; uninformative abbreviations, unverified taxa, unknown names and unsupported characters are excluded. Each species is limited to three English aliases to avoid flooding the matcher.

The aliases map to the **existing canonical Latin answer's exact existing tier** and its source provenance. There are no extra scored answer records for alternate names and no invented publisher popularity. They are packed as the `commonNameAliases` section of `public/play/deep-dive/recovered/independent-bank/reviewed-aliases.json`, checked again at runtime before use. The playable source pool has exactly the same 952 question identities and original six tiers.

Machine-readable source evidence is `data/krillion-review/gbif-reviewed-common-aliases.csv` (question ID, canonical binomial, accepted English alias, original tier, GBIF taxon link) and an optional API research cache `gbif-common-name-cache.json`; the cache is NOT used in gameplay. Reproduce with `scripts/krillion-gbif-common-aliases.py`; the public API is only called during offline source curation, not when a player submits an answer.

GBIF references: https://techdocs.gbif.org/en/openapi/v1/species and https://api.gbif.org/v1/species. GBIF name evidence validates a common species name, **not original Krillion server acceptance or rarity**.

## Additional collision decisions

Source research identifies **40/4 chair and 404 chair** as the same David Rowland design (manufacturer: https://www.howe.com/us/products/chairs/404/; distributor: https://www.designcraft.net.au/products/howe-404-chair). Because both stored entries already share a tier, this group is now a single editorial same-tier alias in independent practice.

Conversely, **re:View** (Red Letter Media web series, IMDb https://www.imdb.com/title/tt5763098/) and **Review** (Comedy Central series starring Andy Daly, IMDb https://www.imdb.com/title/tt2141913) are genuinely different comedy programmes. They retain separate canonical entries and original stored tiers; neither spelling is remapped to the other.

Thus the reviewed 84 collisions consist of **59 safe same-tier aliases**, **17 verified separate entities**, and **8 unresolved** identity groups. All five existing historical score conflicts are preserved without auto-merging.

## What remains outside source certainty

The legacy 482 numerical target flags have 10 finite complete, five local-dictionary-limited and 467 requiring category-specific source review. Of the original 96 no-documented-100 cases, 27 finite memberships have been independently checked, leaving 69 requiring real publisher rarity evidence; none is assigned a fictitious 100. The 2,544 unverified model-only suggestions are not automatically imported. Legitimate species names from independently published taxonomy sources can be added even if the model-only candidate description is unverified; source-backed binomial acceptance never endorses a model's unsupported claims about habitat, behavior, color or popularity.

This release does **not** assert complete original publisher parity or a recovered private validator.

Au/Ra is a separately identified German-Antiguan singer who explicitly stylized her artist name to distinguish it from other musicians called Aura; H:dn and HDN are distinct Spotify artists with separate IDs, discographies and listener histories. See https://en.wikipedia.org/wiki/Au/Ra, https://streamclout.io/artist/h-dn/4gD6ddSF1KwHyvk34XykYH and https://streamclout.io/artist/hdn/2VeycUHUfDjoYqpkOSllnn. Both pairs remain separate scored names, never normalized into each other.
