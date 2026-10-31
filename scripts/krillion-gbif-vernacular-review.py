#!/usr/bin/env python3
"""GBIF English vernacular audit for *animal name starts with X* prompts.
Only exact English vernacular/taxon binomial matched, no fuzzy language aliases.
"""
import csv,json,re,concurrent.futures,requests
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'data/krillion-review/gbif-candidate-verification.csv'
rows=list(csv.DictReader(p.open()))
items=[]
for r in rows:
    match=re.search(r'whose name starts with ([A-Z])\b',r['question'])
    if not match or r['verification_state']!='TAXON_EXACT_CATEGORY_UNVERIFIED':
        continue
    expected=match.group(1).lower()
    label=r['original_suggestion'].split('(')[0].strip()
    pure=label==r['scientific_name']
    if not (label.lower().startswith(expected) if not pure else r['scientific_name'].lower().startswith(expected)):
        continue
    items.append((r,expected,label,pure))
keys=sorted({r['gbif_taxon_id'] for r,_,_,pure in items if not pure})
session=requests.Session()
session.headers.update({'User-Agent':'Sidequest IndependentPracticeTaxonomyReview/1.0 (source-backed names)'})
def lookup(key):
    try:
        response=requests.get('https://api.gbif.org/v1/species/'+key+'/vernacularNames',
            params={'limit':1000},headers={'User-Agent':'Sidequest IndependentPracticeTaxonomyReview/1.0'},
            timeout=22)
        response.raise_for_status()
        data=response.json()
        return key,{re.sub(r'[^a-z0-9]','',row['vernacularName'].casefold()) for row in data.get('results',[])
            if row.get('language','').lower() in {'eng','en','english'} and row.get('vernacularName')}
    except Exception as e:
        return key,None
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    matched=dict(pool.map(lookup,keys))
out=[]
for r,expected,label,pure in items:
    names=matched.get(r['gbif_taxon_id'],set())
    norm=re.sub(r'[^a-z0-9]','',label.casefold())
    ok=pure or (names is not None and norm in names)
    out.append({'id':r['id'],'question':r['question'],'suggestion':r['original_suggestion'],
        'published_english_name':label,'scientific_name':r['scientific_name'],
        'gbif_taxon_id':r['gbif_taxon_id'],
        'matched_english_vernacular':'YES' if not pure and ok else 'SCIENTIFIC_NAME' if pure else 'NO',
        'name_starts_correct_letter':'YES',
        'verification':'PRACTICE_CATEGORY_AND_TAXON_VERIFIED' if ok else 'HOLD_ENGLISH_NAME_UNCONFIRMED',
        'source_url':'https://www.gbif.org/species/'+r['gbif_taxon_id'],
        'publisher_acceptance':'NOT_VERIFIED','score_verification':'ESTIMATED_ONLY'})
p=root/'data/krillion-review/gbif-vernacular-verification.csv'
with p.open('w',encoding='utf8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(out[0]),lineterminator='\n')
    w.writeheader();w.writerows(out)
from collections import Counter
print('Review source-backed English/common names',Counter(r['verification'] for r in out))
print('validated',[(r['id'],r['published_english_name']) for r in out if r['verification']=='PRACTICE_CATEGORY_AND_TAXON_VERIFIED'])
