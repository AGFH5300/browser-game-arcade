#!/usr/bin/env python3
"""Source-filtered English lexical answer additions to Sidequest *estimated* practice.

Exact substring/suffix rules only. Does not invent synonyms, claim publisher
acceptance, equate language frequency to player rarity, or assign 100-point tiers.
Uses locally retained alpha dictionary and wordfreq reference filter; both source
and filter documented in data/krillion-review/lexical-additions.csv.
"""
import csv, json, re, sys
from pathlib import Path
from wordfreq import zipf_frequency

ROOT=Path(__file__).resolve().parents[1]
B=ROOT/'public/play/deep-dive/recovered/independent-bank'
dictionary=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else None
if not dictionary or not dictionary.exists():
    raise SystemExit('Provide absolute local words_alpha_reference.txt path')
SPEC={
 'KR0890':('contains','manu'),
 'KR0901':('contains','neuro'),
 'KR0912':('contains','multi'),
 'KR0908':('contains','path'),
 'KR0947':('contains','ough'),
 'KR0950':('contains','anti'),
 'KR0946':('contains','age'),
 'KR0951':('endswith','ism'),
}
# No "English word borrowed from French", "silent w", idioms, synonyms, etc:
# those cannot be validated by string matching alone.
words={line.strip().lower() for line in dictionary.open(encoding='utf8') if line.strip().isascii()}
manifest_path=B/'manifest.json'
manifest=json.loads(manifest_path.read_text())
byid={x['id']:x for x in manifest['questions']}
normal=lambda s:re.sub('[^a-z0-9]','',s.lower())
additions=[]
for key,(method,pattern) in SPEC.items():
 item=byid[key]
 p=B/item['file']
 data=json.loads(p.read_text())
 original=[r[0] for r in data['answers']]
 used={normal(x) for x in original}
 # Filter implausible strings, proper names and unseen corpus tokens.
 # Zipf >= 1.5 is a presence threshold only, NOT a popularity score.
 eligible=sorted(w for w in words if 4<=len(w)<=24 and re.fullmatch(r'[a-z]+',w)
   and (pattern in w if method=='contains' else w.endswith(pattern))
   and zipf_frequency(w,'en')>=1.5)
 for value in eligible:
    if normal(value) in used:continue
    data['answers'].append([value,2,'lexicon'])
    used.add(normal(value))
    additions.append({
      'id':key,'prompt':data['prompt'],'answer':value,'rule':method+':'+pattern,
      'zipf':round(zipf_frequency(value,'en'),2),
      'score_estimate':30,'publisher_accepted':'NOT_VERIFIED',
      'evidence':'English alpha word list + wordfreq English corpus; exact string criterion',
      'status':'INDEPENDENT_ESTIMATED_PRACTICE'
    })
 item['answerCount']=len(data['answers'])
 if len(data['answers'])!=len(original):
  p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
out=ROOT/'data/krillion-review/lexical-additions.csv'
if additions or not out.exists():
 with out.open('w',encoding='utf8',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(additions[0]),lineterminator='\n')
  writer.writeheader();writer.writerows(additions)
print(json.dumps({'added':len(additions),'by_question':{key:sum(a['id']==key for a in additions) for key in SPEC},
 'independent_entries':manifest['answerCount']},indent=2))
