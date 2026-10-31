#!/usr/bin/env python3
"""Add only exact-GBIF-English-vernacular animal names and qualifying binomials.
Never assign 85/100 absent original empirical rarity. Local practice only.
"""
import csv,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
base=ROOT/'public/play/deep-dive/recovered/independent-bank'
man_path=base/'manifest.json';man=json.loads(man_path.read_text())
by={x['id']:x for x in man['questions']}
rows=list(csv.DictReader((ROOT/'data/krillion-review/gbif-vernacular-verification.csv').open()))
added=[]
def norm(s):return re.sub(r'[^a-z0-9]','',s.casefold())
for id in sorted({r['id'] for r in rows if r['verification']=='PRACTICE_CATEGORY_AND_TAXON_VERIFIED'}):
    file=base/(id+'.json');doc=json.loads(file.read_text())
    used={norm(x[0]) for x in doc['answers']}
    for row in rows:
        if row['id']!=id or row['verification']!='PRACTICE_CATEGORY_AND_TAXON_VERIFIED':continue
        name=row['published_english_name']
        if norm(name) in used:continue
        assert name.casefold().startswith(re.search(r'whose name starts with ([A-Z])',doc['prompt']).group(1).casefold())
        assert row['matched_english_vernacular'] in ['YES','SCIENTIFIC_NAME']
        doc['answers'].append([name,2,'gbif'])
        added.append({'id':id,'answer':name,'taxon':row['scientific_name'],
            'source_url':row['source_url'],'kind':row['matched_english_vernacular'],
            'score_estimate':30,'original_acceptance':'NOT_VERIFIED'})
        used.add(norm(name))
    by[id]['answerCount']=len(doc['answers'])
    file.write_text(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n')
man['answerCount']=sum(x['answerCount'] for x in man['questions'])
man_path.write_text(json.dumps(man,ensure_ascii=False,separators=(',',':'))+'\n')
out=ROOT/'data/krillion-review/gbif-vernacular-additions.csv'
if added or not out.exists():
 with out.open('w',encoding='utf8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(added[0]),lineterminator='\n')
    w.writeheader();w.writerows(added)
print('GBIF exact English name additions:',len(added),'independent manifest total',man['answerCount'])
