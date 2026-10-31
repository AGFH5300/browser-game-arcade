#!/usr/bin/env python3
"""Bulk independent taxonomy audit for model-only question suggestions.

GBIF v2 species/match POST batch; strict species exact matches only.
Taxonomic class/order/family decides select explicit species category prompts.
Not proof of publisher acceptance or player rarity.
"""
import csv,json,re,sys,time,urllib.parse
from pathlib import Path
import requests

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'data/krillion-review/model-candidate-review.csv'
OUT=ROOT/'data/krillion-review/gbif-candidate-verification.csv'
BANK=ROOT/'public/play/deep-dive/recovered/independent-bank'
CACHE=ROOT/'data/krillion-review/gbif-taxon-results.json'
pattern=re.compile(r'^([A-Z][a-z]{2,} [a-z][a-z-]{2,})$')
def scientific(s):
    for segment in re.findall(r'\(([^()]*)\)',s):
        segment=segment.strip().strip('*')
        if pattern.fullmatch(segment):
            return segment
    stripped=s.strip('* ')
    return stripped if pattern.fullmatch(stripped) else None
with SRC.open(encoding='utf8',newline='') as f: rows=list(csv.DictReader(f))
eligible=[(idx,r,scientific(r['suggestion'])) for idx,r in enumerate(rows) if scientific(r['suggestion'])]
unique=sorted(set(name for _,_,name in eligible))
print('Eligible binomials:',len(eligible),'unique:',len(unique),flush=True)
taxa={}
if CACHE.exists():taxa=json.loads(CACHE.read_text())
missing=[n for n in unique if n not in taxa]
sess=requests.Session();sess.headers.update({'User-Agent':'SidequestIndependentQuestionBankResearch/1.0 (public GBIF taxonomy validation)'})
for start in range(0,len(missing),75):
    names=missing[start:start+75]
    for retry in range(3):
      try:
        resp=sess.post('https://api.gbif.org/v2/species/match',
         json=[{'scientificName':n,'rank':'SPECIES'} for n in names],timeout=55)
        resp.raise_for_status()
        results=resp.json()
        if len(results)!=len(names):raise ValueError('Unexpected response item count')
        for name,result in zip(names,results):taxa[name]=result
        break
      except Exception as exc:
        if retry==2:raise
        time.sleep(3*(retry+1))
    print('GBIF validated',len(taxa),'/',len(unique),flush=True)
    CACHE.write_text(json.dumps(taxa,ensure_ascii=False,separators=(',',':'))+'\n')
    time.sleep(0.35)
def category_ok(qid,data):
    c={x.get('rank'):x.get('name') for x in data.get('classification',[])}
    found=lambda rank,expect:c.get(rank)==expect
    if c.get('KINGDOM')!='Animalia':return False
    mapping={
      'KR0093':lambda:found('ORDER','Araneae'),
      'KR0058':lambda:found('FAMILY','Viperidae') or c.get('FAMILY') in {
          'Elapidae','Colubridae','Pythonidae','Boidae','Lamprophiidae','Typhlopidae',
          'Homalopsidae','Aniliidae','Pareidae','Xenopeltidae','Atractaspididae',
          'Leptotyphlopidae','Natricidae','Acrochordidae','Tropidophiidae','Loxocemidae'},
      'KR0037':lambda: c.get('ORDER') in {
          'Carcharhiniformes','Lamniformes','Orectolobiformes','Squaliformes',
          'Hexanchiformes','Heterodontiformes','Pristiophoriformes','Squatiniformes',
          'Echinorhiniformes'},
      'KR0114':lambda:found('ORDER','Strigiformes'),
      'KR0156':lambda:found('ORDER','Coleoptera'),
      'KR0079':lambda:found('ORDER','Primates'),
      'KR0100':lambda:found('ORDER','Rodentia'),
      'KR0205':lambda:found('ORDER','Testudines'),
      'KR0777':lambda:found('FAMILY','Ursidae'),
      'KR0086':lambda:found('CLASS','Amphibia'),
      'KR0009':lambda:c.get('ORDER') in {'Falconiformes','Accipitriformes','Strigiformes','Cathartiformes'},
      'KR0072':lambda:found('CLASS','Insecta'),
      'KR0058':lambda:c.get('FAMILY') in {'Viperidae','Elapidae','Colubridae','Pythonidae',
          'Boidae','Lamprophiidae','Typhlopidae','Homalopsidae','Aniliidae','Pareidae',
          'Xenopeltidae','Atractaspididae','Leptotyphlopidae','Natricidae',
          'Acrochordidae','Tropidophiidae','Loxocemidae'},
      'KR0142':lambda:c.get('CLASS') in {'Malacostraca','Branchiopoda','Maxillopoda','Ostracoda'},
    }
    fn=mapping.get(qid)
    return bool(fn and fn())
out=[]
for idx,row,name in eligible:
    d=taxa[name]
    usage=d.get('usage',{})
    diag=d.get('diagnostics',{})
    exact=diag.get('matchType')=='EXACT' and int(diag.get('confidence',0))>=95 and usage.get('rank')=='SPECIES'
    accepted=(usage.get('canonicalName','').casefold()==name.casefold() and usage.get('status')=='ACCEPTED')
    matched=bool(exact and accepted and not diag.get('issues'))
    good=matched and category_ok(row['id'],d)
    state='CATEGORY_VERIFIED_INDEPENDENT_SPECIES' if good else (
        'TAXON_EXACT_CATEGORY_UNVERIFIED' if matched else 'TAXON_NOT_EXACT_OR_UNRESOLVED')
    out.append({'candidate_index':idx,'id':row['id'],'question':row['question'],
        'original_suggestion':row['suggestion'],'scientific_name':name,
        'gbif_match_type':diag.get('matchType',''),
        'gbif_confidence':diag.get('confidence',''),
        'gbif_status':usage.get('status',''),
        'gbif_rank':usage.get('rank',''),
        'gbif_scientific':usage.get('canonicalName',''),
        'gbif_taxon_id':usage.get('key',''),
        'taxonomic_class':next((x.get('name','') for x in d.get('classification',[]) if x.get('rank')=='CLASS'),''),
        'taxonomic_order':next((x.get('name','') for x in d.get('classification',[]) if x.get('rank')=='ORDER'),''),
        'taxonomic_family':next((x.get('name','') for x in d.get('classification',[]) if x.get('rank')=='FAMILY'),''),
        'verification_state':state,
        'source_url':'https://www.gbif.org/species/'+str(usage.get('key','')) if usage.get('key') else '',
        'publisher_accepted':'NOT_VERIFIED',
        'rarity_verified':'NO'})
with OUT.open('w',encoding='utf8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(out[0]),lineterminator='\n')
    w.writeheader();w.writerows(out)
from collections import Counter
print('GBIF summary:',Counter(r['verification_state'] for r in out),flush=True)
print('verified by question:',Counter(r['id'] for r in out if r['verification_state']=='CATEGORY_VERIFIED_INDEPENDENT_SPECIES'),flush=True)
