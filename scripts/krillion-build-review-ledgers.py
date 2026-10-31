#!/usr/bin/env python3
"""Reproducible, NON-publisher-verified review queues from local research exports.

Run:
 python3 scripts/krillion-build-review-ledgers.py /path/to/KRILLION_COMPLETION_AUDIT_2026-10-31

Only explicitly examined orthographic equivalents are enabled as Sidequest
practice aliases. No missing 100-point score is manufactured, and model-only
suggestions never automatically enter playable packs.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
audit = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else None
if audit is None or not audit.is_dir():
    raise SystemExit('Supply a local research-audit directory; no network sources are fetched')
out = root / 'data/krillion-review'
out.mkdir(parents=True,exist_ok=True)
bank = root / 'public/play/deep-dive/recovered/independent-bank'
manifest = json.loads((bank/'manifest.json').read_text())
packs = {q['id']:json.loads((bank/q['file']).read_text()) for q in manifest['questions']}
tiers=[10,15,30,60,85,100]
def rows(name):
    with (audit/name).open(encoding='utf8',newline='') as f:
        return list(csv.DictReader(f))
def write(name,fields,items):
    with (out/name).open('w',encoding='utf8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");w.writeheader();w.writerows(items)
def simple(s):
    s=unicodedata.normalize('NFKD',s.casefold())
    return re.sub(r'[^a-z0-9]','',s)
# By order in the 84-row collisions report, hand-reviewed spelling/spacing
# variants within the SAME prompt/tier. Not claims of original accepted aliases.
# Excludes different cities, people, songs, performers and score conflicts.
APPROVE={
  1,2,3,4,7,8,10,12,13,14,16,17,18,19,21,23,24,25,
  28,29,30,31,33,34,35,38,39,43,45,46,47,48,49,
  51,52,55,57,59,60,61,62,66,67,68,69,70,71,72,73,74,
  77,78,79,80,81,82,84
}
assert len(APPROVE)==57
collision_rows=rows('NORMALIZED_DUPLICATES_AND_CONFLICTS.csv')
assert len(collision_rows)==84
# Original publisher acceptance is unverified; these sources prove real-world
# identity or disambiguation only. Never merge independently distinct entities.
IDENTITIES={
  4: ('SAME_ENTITY','https://www.grassley.senate.gov/news/news-releases/grassley-seeks-prompt-action-accurate-posting-access-air'),
  26:('VERIFIED_DISTINCT','https://www.insee.fr/fr/metadonnees/geographie/arrondissement/9711-basse-terre | https://www.gov.kn/'),
  27:('VERIFIED_DISTINCT','https://otp.gov.ky/web/govky/ourislands | https://factpage.glsc.gov.gy/basics/capital-city/'),
  44:('VERIFIED_DISTINCT','https://www.ceredigion.gov.uk/media/dripe2fr/2024-new-quay-place-plan.pdf | https://www.newquay.gov.uk/'),
  56:('VERIFIED_DISTINCT','https://www.northcentral.edu/ | https://www.nu.edu/national-and-northcentral-have-merged/'),
  57:('SAME_ENTITY','https://up.net/upnet-news-alerts')
}
statuses=[]
allowed={}
for i,r in enumerate(collision_rows,1):
    names=r['variants'].split(' | ')
    existing={v[0]:v[1] for v in packs[r['id']]['answers']}
    scores={existing[n] for n in names if n in existing}
    complete=all(n in existing for n in names)
    checked=r['score_conflict']=='True'
    state=('HOLD_SCORE_CONFLICT' if checked else
           'APPROVED_EDITORIAL_EQUIVALENT' if i in APPROVE and complete and len(scores)==1 else
           'HOLD_MISSING_PLAYABLE_VARIANT' if i in APPROVE else
           'HOLD_DIFFERENT_ENTITIES_OR_UNVERIFIED')
    if state=='APPROVED_EDITORIAL_EQUIVALENT':
        assert len(names)==2 and all(simple(n)==simple(names[0]) for n in names)
        assert tiers[existing[names[0]]]==int(json.loads(r['scores'])[0])
        allowed.setdefault(r['id'],[]).append({
            'canonical': names[0], 'equivalent':names[1], 'tier':existing[names[0]],
            'review':'sidequest_editorial_orthography_only'
        })
    statuses.append({
        'id':r['id'],'question':r['question'],'variants':r['variants'],
        'scores':r['scores'],'source':r['sources'],'review_state':state,
        'applies_to':'independent_practice_only',
        'publisher_acceptance_verified':'NO',
        'identity_verification':IDENTITIES.get(i,('NOT_ESTABLISHED',''))[0],
        'independent_reference':IDENTITIES.get(i,('',''))[1],
        'notes':('Different original tiers: preserve both names and scores' if checked
                 else 'Both variants present in practice bank; identical tier; reviewed orthography' if state=='APPROVED_EDITORIAL_EQUIVALENT'
                 else 'Not safe to merge without independent identity proof')
    })
write('84-collision-review.csv',list(statuses[0]),statuses)
assert sum(s['review_state']=='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses)==57
# Local runtime reads only this explicitly approved subset.
path=bank/'reviewed-aliases.json'
path.write_text(json.dumps({
    'source':'sidequest-editorial-orthography-review',
    'publisherAcceptanceVerified':False,
    'changesPublisherScores':False,
    'groups':allowed
},ensure_ascii=False,separators=(',',':'))+'\n')
missing=rows('MISSING_96_100POINT_POLICY.csv')
assert len(missing)==96
for r in missing:
    r['review_state']='REQUIRES_SOURCE_AND_PLAYER_RARITY_EVIDENCE'
    r['decision']='NO_AUTOMATIC_100_POINT_AWARD'
write('96-missing-100-review.csv',list(missing[0]),missing)
targets={'Finite tiny':5,'Finite small':15,'Finite medium':40,
         'Moderately broad':75,'Broad category':150,'Very broad':400,
         'Open-ended / lexical':1000}
low=[]
for r in rows('ALL_952_RARITY_SCORE_AUDIT.csv'):
    target=targets[r['category']]
    n=len(packs[r['id']]['answers'])
    if n>=target:continue
    gap=target-n
    low.append({'id':r['id'],'question':r['question'],'category':r['category'],
                'present':n,'heuristic_target':target,'numerical_gap':gap,
                'priority': 'P1' if n<target/4 else 'P2' if n<target*0.6 else 'P3',
                'state':'REVIEW_REQUIRED__NOT_PUBLISHER_VERIFIED',
                'note':'Heuristic screening target, not verified category universe size'})
low.sort(key=lambda x:({'P1':0,'P2':1,'P3':2}[x['priority']],-x['numerical_gap'],x['id']))
write('coverage-review.csv',list(low[0]),low)
models=rows('AI_ALL_BROAD_VERY_BROAD_MODEL_ACCEPTED.csv')
assert len(models)==2553
evidence_path=out/'gbif-candidate-verification.csv'
gbif_evidence={}
if evidence_path.exists():
    with evidence_path.open(encoding='utf8',newline='') as f:
        gbif_evidence={int(r['candidate_index']):r for r in csv.DictReader(f)}
candidate=[]
for ix,r in enumerate(models):
    present={simple(x[0]) for x in packs[r['id']]['answers']}
    candidate.append({
      'id':r['id'],'question':r['question'],'suggestion':r['answer'],
      'tier_estimate':r['tier'],'generator':r['generators'],'checker':r['checker'],
      'already_playable_estimate': 'YES' if simple(r['answer']) in present else 'NO',
      'review_state':'QUARANTINED__PRIMARY_SOURCE_AND_RARITY_EVIDENCE_REQUIRED',
      'gbif_evidence_state':gbif_evidence.get(ix,{}).get('verification_state','NOT_CHECKED_BY_GBIF'),
      'gbif_taxon_url':gbif_evidence.get(ix,{}).get('source_url',''),
      'publisher_accepted':'NO','rationale_unverified':r['rationale']
    })
write('model-candidate-review.csv',list(candidate[0]),candidate)
summary={
 'questions':len(packs),
 'independent_playable_answers_from_manifest':manifest['answerCount'],
 'collision_groups_reviewed':len(statuses),
 'approved_editorial_orthographic_groups':sum(s['review_state']=='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses),
 'held_collision_groups':sum(s['review_state']!='APPROVED_EDITORIAL_EQUIVALENT' for s in statuses),
 'held_but_identity_verified_distinct_groups':sum(s['identity_verification']=='VERIFIED_DISTINCT' for s in statuses),
 'remaining_identity_unresolved_groups':sum(s['review_state']!='APPROVED_EDITORIAL_EQUIVALENT' and s['identity_verification']=='NOT_ESTABLISHED' for s in statuses),
 'score_conflicts_preserved':sum(s['review_state']=='HOLD_SCORE_CONFLICT' for s in statuses),
 'missing_documented_100':len(missing),
 'missing_100_policy_breakdown':dict(Counter(r['100_point_policy'] for r in missing)),
 'coverage_below_current_playable_heuristic':len(low),
 'previous_source_reported_coverage_below':482,
 'quarantined_model_review_candidates':len(candidate),
 'gbif_species_taxonomy_category_verified':sum(r['gbif_evidence_state']=='CATEGORY_VERIFIED_INDEPENDENT_SPECIES' for r in candidate),
 'gbif_exact_taxon_but_category_unverified':sum(r['gbif_evidence_state']=='TAXON_EXACT_CATEGORY_UNVERIFIED' for r in candidate),
 'gbif_taxon_no_exact_match':sum(r['gbif_evidence_state']=='TAXON_NOT_EXACT_OR_UNRESOLVED' for r in candidate),
 'model_candidates_absent_from_playable':sum(r['already_playable_estimate']=='NO' for r in candidate),
 'all_scores_are_publisher_verified':False,
 'no_100point_scores_invented':True
}
lexical_target_file=out/'lexical-target-audit.csv'
if lexical_target_file.exists():
    with lexical_target_file.open(encoding='utf8',newline='') as f:
        summary['lexical_heuristic_overstated_cases']=sum(r['screening_result']=='TARGET_NOT_SUPPORTED_BY_LOCAL_REFERENCE' for r in csv.DictReader(f))
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
