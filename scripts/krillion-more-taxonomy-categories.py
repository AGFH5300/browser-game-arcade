#!/usr/bin/env python3
"""Strict source-backed taxonomy expansion for *categorical* practice prompts.

No implied habitat, color, speed, commercial use or rarity. Input GBIF v2 exact
matching results retained from previous public taxonomy review. Every score is
explicitly an independent practice 30-point estimate, not a publisher rarity.
"""
import csv,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
provenance=root/'data/krillion-review'
from_cache=json.loads((provenance/'gbif-taxon-results.json').read_text())
rows=list(csv.DictReader((provenance/'gbif-candidate-verification.csv').open()))
by={}
for r in rows:by.setdefault(r['id'],[]).append(r)
# Taxon class is used for Squamata and Testudines by this GBIF backbone version.
lizard_families={'Agamidae','Lacertidae','Dactyloidae','Gerrhosauridae','Cordylidae',
 'Gekkonidae','Eublepharidae','Iguanidae','Scincidae','Varanidae','Chamaeleonidae',
 'Teiidae','Anguidae','Phrynosomatidae','Gymnophthalmidae'}
marsupials={'Microbiotheria','Notoryctemorphia','Diprotodontia','Dasyuromorphia',
 'Peramelemorphia','Didelphimorphia','Paucituberculata'}
fungal_fruiting_orders={'Cantharellales','Agaricales','Russulales','Pezizales',
 'Boletales','Hymenochaetales','Polyporales'}
def classification(data):
 return {x.get('rank'):x.get('name') for x in data.get('classification',[])}
def qualifies(id,c):
 if id=='KR0170':return c.get('KINGDOM')=='Animalia' and c.get('CLASS')=='Squamata' and c.get('FAMILY') in lizard_families
 if id=='KR0212':return c.get('KINGDOM')=='Animalia' and c.get('CLASS')=='Mammalia' and c.get('ORDER') in marsupials
 if id=='KR0205':return c.get('KINGDOM')=='Animalia' and c.get('CLASS')=='Testudines'
 if id=='KR0149':return c.get('KINGDOM')=='Animalia' and c.get('ORDER')=='Anseriformes' and c.get('FAMILY')=='Anatidae'
 if id=='KR0240':return c.get('KINGDOM')=='Animalia' and c.get('PHYLUM')=='Mollusca'
 if id=='KR0822':return c.get('KINGDOM')=='Animalia' and c.get('CLASS') in {'Squamata','Testudines','Amphibia'}
 if id=='KR0035':return c.get('KINGDOM')=='Plantae' and c.get('CLASS') in {'Magnoliopsida','Liliopsida'}
 if id=='KR0247':return c.get('KINGDOM')=='Fungi' and c.get('ORDER') in fungal_fruiting_orders and c.get('CLASS') in {'Agaricomycetes','Pezizomycetes'}
 return False
bank=root/'public/play/deep-dive/recovered/independent-bank'
man_path=bank/'manifest.json'
manifest=json.loads(man_path.read_text());by_id={x['id']:x for x in manifest['questions']}
accepted=[];rejected=[]
def norm(x):return re.sub('[^a-z0-9]','',x.casefold())
for id in ('KR0170','KR0212','KR0205','KR0149','KR0240','KR0822','KR0035','KR0247'):
 pack_path=bank/(id+'.json');pack=json.loads(pack_path.read_text());seen={norm(a[0]) for a in pack['answers']}
 for row in by.get(id,[]):
  if row['verification_state']!='TAXON_EXACT_CATEGORY_UNVERIFIED':continue
  taxon=from_cache[row['scientific_name']];usage=taxon.get('usage',{});diag=taxon.get('diagnostics',{});c=classification(taxon)
  match=diag.get('matchType')=='EXACT' and diag.get('confidence',0)>=95 and not diag.get('issues') and usage.get('rank')=='SPECIES' and usage.get('status')=='ACCEPTED' and usage.get('canonicalName','').casefold()==row['scientific_name'].casefold()
  if not(match and qualifies(id,c)):
   rejected.append((id,row['scientific_name'],'TAXON_CATEGORY_NOT_PROVEN'));continue
  name=row['scientific_name']
  if norm(name) in seen:continue
  pack['answers'].append([name,2,'gbif']);seen.add(norm(name))
  accepted.append({'id':id,'question':pack['prompt'],'answer':name,
   'gbif_taxon_key':usage['key'],'rank':usage['rank'],
   'taxonomic_class':c.get('CLASS',''),'order':c.get('ORDER',''),
   'family':c.get('FAMILY',''),'score_estimate':30,
   'publisher_acceptance':'NOT_VERIFIED',
   'source_url':'https://www.gbif.org/species/'+str(usage['key'])})
 by_id[id]['answerCount']=len(pack['answers'])
 if any(a['id']==id for a in accepted):pack_path.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
man_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
out=provenance/'gbif-additional-categorical-taxonomy.csv'
with out.open('w',newline='',encoding='utf8') as f:
 w=csv.DictWriter(f,fieldnames=list(accepted[0]),lineterminator='\n');w.writeheader();w.writerows(accepted)
from collections import Counter
print(json.dumps({'new_strict_taxonomic_answers':len(accepted),'by_question':Counter(a['id'] for a in accepted),
 'held':len(rejected),'new_manifest_total':manifest['answerCount']},indent=2))
