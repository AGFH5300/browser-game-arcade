#!/usr/bin/env python3
"""Import GBIF independently verified ENGLISH animal names for letter questions.
Only exact accepted species-name matches; no guessed publisher rarity.
"""
import csv,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bank=root/'public/play/deep-dive/recovered/independent-bank'
manifest_file=bank/'manifest.json'
manifest=json.loads(manifest_file.read_text())
meta={x['id']:x for x in manifest['questions']}
source=root/'data/krillion-review/gbif-animal-letter-evidence.csv'
data=list(csv.DictReader(source.open()))
def normalized(s):return re.sub(r'[^a-z0-9]','',s.casefold())
rows=[]
for id in sorted(set(r['id'] for r in data if r['verified']=='EXACT_ENGLISH_SPECIES_AND_LETTER')):
    path=bank/(id+'.json')
    pack=json.loads(path.read_text())
    existing={normalized(r[0]) for r in pack['answers']}
    for r in data:
        if r['id']!=id or r['verified']!='EXACT_ENGLISH_SPECIES_AND_LETTER':continue
        name=r['reviewed_name']
        expected=re.search(r'starts with ([A-Z])$',pack['prompt'])
        assert expected and name.lower().startswith(expected.group(1).lower())
        assert r['source'].startswith('https://www.gbif.org/species/')
        assert r['gbif_taxon_key'].isdigit()
        if normalized(name) in existing:continue
        pack['answers'].append([name,2,'gbif'])
        existing.add(normalized(name))
        rows.append({'id':id,'name':name,'gbif_source':r['source'],
          'gbif_taxon_key':r['gbif_taxon_key'],'canonical_taxon':r['scientific_name'],
          'estimated_score':30,'publisher_acceptance':'NOT_VERIFIED'})
    meta[id]['answerCount']=len(pack['answers'])
    path.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
out=root/'data/krillion-review/gbif-animal-letter-additions.csv'
if rows or not out.exists():
    with out.open('w',newline='',encoding='utf8') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n')
        w.writeheader();w.writerows(rows)
print(json.dumps({'new_english_species_names':len(rows),'new_manifest_total':manifest['answerCount']}))
