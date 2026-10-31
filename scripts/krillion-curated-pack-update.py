#!/usr/bin/env python3
"""Explicit, source-backed Sidequest practice additions and malformed OCR cleanup.

Only editorially reviewed pasta shapes from De Cecco's public format catalogue
are added, with conservative ESTIMATED scores. Original Krillion acceptance
and rarity remain unverified. Drops 46 corrupt community labels when the
unprefixed answer is *already* playable (no unique valid answer is lost).
"""
import csv
import json
import re
from pathlib import Path

root=Path(__file__).resolve().parents[1]
bank=root/'public/play/deep-dive/recovered/independent-bank'
manifest_path=bank/'manifest.json'
manifest=json.loads(manifest_path.read_text())
source='https://www.dececco.com/gb_en/products/semolina-pasta/'
new_pasta=[
 'Candele Spezzate','Farfalle Medie','Spaccatella','Ghiottole',
 'Fusilli Giganti','Orecchiette Grandi','Chifferi Rigati',
 'Pipe Rigate','Anelli Siciliani','Gramigna','Mezzi Paccheri Rigati',
 'Paccheri Rigati','Bombardoni Rigati','Conchiglioni Rigati',
 'Lumaconi Rigati','Lasagna Riccia','Lasagnette','Fedelini','Pennettine',
 'Tubetti','Farfalline','Squared Spaghetti','Rigatoni Napoletani',
 'Fusilli Corti Bucati','Candele Lunghe','Mezzi Paccheri'
]
assert len(new_pasta)==26
clean=re.compile(r'^Too clever \([2-4]\) (.+)$',re.I)
def norm(s):return re.sub(r'[^a-z0-9]','',s.casefold())
removed=[]
added=[]
for q in manifest['questions']:
 p=bank/q['file']
 doc=json.loads(p.read_text())
 rows=doc['answers']
 existing={norm(row[0]) for row in rows if not clean.match(row[0])}
 next_rows=[]
 for row in rows:
  hit=clean.match(row[0])
  if hit:
   if norm(hit.group(1)) not in existing:
    raise SystemExit('Cannot remove unique answer without review: '+str((q['id'],row)))
   if row[2]!='community':
    raise SystemExit('Unexpected source for corrupt label: '+str((q['id'],row)))
   removed.append([q['id'],row[0],hit.group(1),'BAD_COMMUNITY_SCOREBOARD_LABEL_DUPLICATE'])
  else:next_rows.append(row)
 if q['id']=='KR0003':
  for name in new_pasta:
   matched=[row for row in next_rows if norm(name)==norm(row[0])]
   if matched and (len(matched)!=1 or matched[0]!=[name,2,'reference']):
    raise SystemExit('Unexpected duplicate source-reviewed pasta format '+name)
   if not matched:
    next_rows.append([name,2,'reference']) # 30 pts ESTIMATED, NOT original
   added.append([q['id'],name,30,source,'SIDEQUEST_EDITORIAL_FACT_CHECK','NO','Estimated tier; manufacturer documents distinct pasta format'])
 if next_rows!=rows:
  doc['answers']=next_rows
  p.write_text(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n')
 q['answerCount']=len(next_rows)
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
out=root/'data/krillion-review'
out.mkdir(parents=True,exist_ok=True)
def write(name,headers,data):
 with (out/name).open('w',encoding='utf8',newline='') as f:
  w=csv.writer(f,lineterminator="\n");w.writerow(headers);w.writerows(data)
if removed or not (out/'removed-ocr-labels.csv').exists():
 write('removed-ocr-labels.csv',['id','removed_label','existing_valid_answer','reason'],removed)
write('source-reviewed-additions.csv',['id','answer','score_estimate','evidence_url','evidence_type',
 'publisher_acceptance_verified','reason'],added)
print(json.dumps({'corrupt_duplicate_rows_removed':len(removed),
 'source_backed_pasta_shapes_added':len(added),
 'new_total':manifest['answerCount']},indent=2))
