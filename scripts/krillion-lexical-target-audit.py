#!/usr/bin/env python3
"""Measure whether the arbitrary 1000-word target is supportable by local word reference.
Does NOT assert 370k reference list contains the entire English language.
"""
import csv,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=ROOT/'public/play/deep-dive/recovered/independent-bank'
dictionary=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else None
if dictionary is None or not dictionary.exists():raise SystemExit('Provide local words_alpha reference path')
terms={'KR0890':'manu','KR0901':'neuro','KR0912':'multi','KR0908':'path',
       'KR0947':'ough','KR0950':'anti','KR0946':'age','KR0951':'ism'}
words={w.strip().lower() for w in dictionary.open(encoding='utf8') if w.strip()}
rowset=[]
for id,term in terms.items():
 valid=[w for w in words if re.fullmatch('[a-z]+',w) and 4<=len(w)<=24
        and (w.endswith('ism') if term=='ism' else term in w)]
 pack=json.loads((data/(id+'.json')).read_text())
 rowset.append({'id':id,'question':pack['prompt'],'original_heuristic_target':1000,
    'all_matching_local_dictionary_words':len(valid),'new_playable_count':len(pack['answers']),
    'screening_result':'TARGET_NOT_SUPPORTED_BY_LOCAL_REFERENCE' if len(valid)<1000
      else 'REFERENCE_HAS_AT_LEAST_TARGET_COUNT',
    'note':'Finite local dictionary count is NOT the definitive number of English words and NOT a measured original Krillion acceptance count.'})
path=ROOT/'data/krillion-review/lexical-target-audit.csv'
with path.open('w',encoding='utf8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rowset[0]),lineterminator='\n');w.writeheader();w.writerows(rowset)
print(json.dumps({'screening_targets_exceed_local_reference':sum(r['all_matching_local_dictionary_words']<1000 for r in rowset),
 'audited':len(rowset),'rows':rowset},indent=2))
