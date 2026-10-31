#!/usr/bin/env python3
"""Conservative GBIF exact English common-name lookup for animal-letter prompts.
No fuzzy, truncated, hybrid species, aggregate genus or guesses admitted.
"""
import csv,json,re,time,requests
from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/'data/krillion-review/model-candidate-review.csv'
out=root/'data/krillion-review/gbif-animal-letter-evidence.csv'
cache=root/'data/krillion-review/gbif-animal-letter-raw.json'
all_rows=list(csv.DictReader(path.open()))
rows=[(i,r) for i,r in enumerate(all_rows) if re.fullmatch(r'Name an animal whose name starts with [A-Z]',r['question'])]
assert len(rows)==116,len(rows)
def normal(s):return re.sub('[^a-z0-9]','',s.casefold())
def label(s):return s.split('(')[0].strip()
def query(name,session):
 try:
  resp=session.get('https://api.gbif.org/v1/species/search',
       params={'q':name,'rank':'SPECIES','limit':20},
       timeout=22)
  resp.raise_for_status()
  return resp.json()
 except Exception as e:return {'error':str(e)[:190]}
session=requests.Session()
session.headers.update({'User-Agent':'SidequestIndependentPracticeEvidenceReview/1.0 (English vernacular validation)'})
saved=json.loads(cache.read_text()) if cache.exists() else {}
for step,(i,row) in enumerate(rows):
 name=label(row['suggestion'])
 if name not in saved:
   saved[name]=query(name,session)
   if (step+1)%15==0:
    cache.write_text(json.dumps(saved,ensure_ascii=False,separators=(',',':'))+'\n')
   time.sleep(0.22)
cache.write_text(json.dumps(saved,ensure_ascii=False,separators=(',',':'))+'\n')
outrows=[]
for i,row in rows:
 name=label(row['suggestion'])
 leading=row['question'][-1].lower()
 valid_name=bool(re.fullmatch(r'[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ -]{2,65}',name) and name.lower().startswith(leading))
 found=None
 data=saved.get(name,{})
 if valid_name:
  for r in data.get('results',[]):
   if r.get('rank')!='SPECIES' or r.get('taxonomicStatus')!='ACCEPTED' or r.get('kingdom')!='Animalia':continue
   aliases=r.get('vernacularNames') or []
   if any(v.get('language') in ('eng','en') and normal(v.get('vernacularName',''))==normal(name) for v in aliases):
    found=r;break
 outrows.append({'candidate_index':i,'id':row['id'],'prompt':row['question'],
   'original_model_suggestion':row['suggestion'],'reviewed_name':name,
   'verified':'EXACT_ENGLISH_SPECIES_AND_LETTER' if found else 'HOLD_UNVERIFIED',
   'gbif_taxon_key':found.get('key','') if found else '',
   'scientific_name':found.get('canonicalName','') if found else '',
   'source':'https://www.gbif.org/species/'+str(found['key']) if found else '',
   'original_publisher_acceptance':'NOT_VERIFIED','score_source':'ESTIMATED_ONLY'})
with out.open('w',encoding='utf8',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(outrows[0]),lineterminator='\n');w.writeheader();w.writerows(outrows)
from collections import Counter
print('GBIF STRICT LETTER CHECK',Counter(r['verified'] for r in outrows),flush=True)
print('Potential names',[(r['id'],r['reviewed_name']) for r in outrows if r['verified'].startswith('EXACT')],flush=True)
