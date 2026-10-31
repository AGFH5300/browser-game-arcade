#!/usr/bin/env python3
"""Promote ONLY GBIF exact species binomials in taxonomically direct prompts.
No common-name identity assumptions and no unmeasured 85/100-point rarity.
"""
import csv,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bank=ROOT/'public/play/deep-dive/recovered/independent-bank'
manifest_path=bank/'manifest.json'
manifest=json.loads(manifest_path.read_text())
byid={m['id']:m for m in manifest['questions']}
rows=list(csv.DictReader((ROOT/'data/krillion-review/gbif-candidate-verification.csv').open()))
normalized=lambda s:re.sub(r'[^a-z0-9]','',s.casefold())
tracked=[]
for id in sorted({r['id'] for r in rows if r['verification_state']=='CATEGORY_VERIFIED_INDEPENDENT_SPECIES'}):
    p=bank/(id+'.json')
    pack=json.loads(p.read_text())
    existing={normalized(r[0]) for r in pack['answers']}
    for item in rows:
      if item['id']!=id or item['verification_state']!='CATEGORY_VERIFIED_INDEPENDENT_SPECIES':continue
      name=item['scientific_name']
      if normalized(name) in existing:continue
      assert item['gbif_match_type']=='EXACT'
      assert item['gbif_status']=='ACCEPTED'
      assert item['gbif_rank']=='SPECIES'
      assert int(item['gbif_confidence'])>=95
      assert item['gbif_scientific'].casefold()==name.casefold()
      assert item['source_url'].startswith('https://www.gbif.org/species/')
      pack['answers'].append([name,2,'gbif'])
      existing.add(normalized(name))
      tracked.append({'id':id,'question':pack['prompt'],'answer':name,
        'source_url':item['source_url'],'gbif_key':item['gbif_taxon_id'],
        'taxonomic_order':item['taxonomic_order'],'taxonomic_family':item['taxonomic_family'],
        'score_estimate':30,'source_acceptance':'NOT_ORIGINAL_PUBLISHER','note':'Accepted GBIF species and question taxonomic category; frequency unverified'})
    byid[id]['answerCount']=len(pack['answers'])
    p.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
out=ROOT/'data/krillion-review/gbif-source-reviewed-additions.csv'
if tracked or not out.exists():
 with out.open('w',encoding='utf8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(tracked[0]),lineterminator='\n');w.writeheader();w.writerows(tracked)
print('GBIF independent source-supported additions',len(tracked),'total',manifest['answerCount'])
