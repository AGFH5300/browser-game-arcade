#!/usr/bin/env python3
"""Optional, evidence-backed English names mapped to existing GBIF Latin answers.

The existing canonical scored answer is never duplicated, never repriced and
never mapped if the English name is ambiguous within the question. GBIF v1
species/match and vernacularNames (language=eng) are public taxon APIs.
"""
import csv,json,re,sys,time,concurrent.futures,collections,unicodedata
from pathlib import Path
import requests
root=Path(__file__).resolve().parents[1]
bank=root/'public/play/deep-dive/recovered/independent-bank'
cachefile=root/'data/krillion-review/gbif-common-name-cache.json'
outfile=root/'data/krillion-review/gbif-reviewed-common-aliases.csv'
manifest=json.loads((bank/'manifest.json').read_text())
byquestion={}
for entry in manifest['questions']:
 pack=json.loads((bank/entry['file']).read_text())
 latin=[row for row in pack['answers'] if row[2]=='gbif' and re.fullmatch(r'[A-Z][a-z]{2,} [a-z][a-z-]{2,}',row[0])]
 if len(latin)>150:latin=latin[:150]
 if latin:byquestion[entry['id']]=(pack,latin)
all_latin=sorted({row[0] for pack,latin in byquestion.values() for row in latin})
print('Question packs',len(byquestion),'taxa to verify',len(all_latin),flush=True)
cache=json.loads(cachefile.read_text()) if cachefile.exists() else {}
headers={'User-Agent':'SidequestQuestionBankEnglishNameAudit/1.0 (GBIF public vocabulary taxon matching)'}
def verify(name):
 try:
  response=requests.get('https://api.gbif.org/v1/species/match',params={'name':name,'strict':'true'},headers=headers,timeout=20)
  response.raise_for_status();detail=response.json()
  if detail.get('matchType')!='EXACT' or detail.get('rank')!='SPECIES' or detail.get('status')!='ACCEPTED' or detail.get('canonicalName','').casefold()!=name.casefold() or not detail.get('usageKey'):
   return (name,{'status':'NO_EXACT_ACCEPTED_MATCH','names':[]})
  key=detail['usageKey']
  r=requests.get('https://api.gbif.org/v1/species/'+str(key)+'/vernacularNames',params={'limit':1000},headers=headers,timeout=25)
  r.raise_for_status();data=r.json()
  english=sorted({str(e.get('vernacularName','')).strip() for e in data.get('results',[]) if e.get('language') in ('eng','en','english') and e.get('vernacularName')})
  return(name,{'status':'VERIFIED','key':key,'names':english})
 except Exception as e:
  return(name,{'status':'QUERY_FAILED','error':str(e)[:130],'names':[]})
missing=[name for name in all_latin if name not in cache or cache[name].get('status')=='QUERY_FAILED']
for i in range(0,len(missing),45):
 batch=missing[i:i+45]
 with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:
  for name,result in pool.map(verify,batch):cache[name]=result
 cachefile.write_text(json.dumps(cache,ensure_ascii=False,separators=(',',':'))+'\n')
 print('Verified',min(i+45,len(missing)),'/',len(missing),'failure',sum(1 for x in cache.values() if x.get('status')=='QUERY_FAILED'),flush=True)
 time.sleep(0.4)

def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.casefold()) if c.isascii() and c.isalnum())
accepted=[];excluded=collections.Counter()
for id,(pack,latin) in byquestion.items():
 canon={norm(row[0]) for row in pack['answers']}
 candidates=[]
 initial_match=re.search(r'name starts with ([A-Z])$',pack['prompt'])
 required_initial=initial_match.group(1).lower() if initial_match else None
 for row in latin:
  name=row[0]; result=cache.get(name,{})
  if result.get('status')!='VERIFIED':continue
  for alias in result['names']:
   if len(alias)<4 or len(alias)>65 or not re.fullmatch(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 '\u2019-]{2,64}",alias):excluded['bad_spelling']+=1;continue
   if alias.isupper() and len(alias)<=8:excluded['unexplained_abbreviation']+=1;continue
   if required_initial and not alias.casefold().startswith(required_initial):excluded['wrong_initial_for_question']+=1;continue
   if re.search(r'\b(sp|spp|genus|species|unknown|unidentified|cf)\b',alias,re.I):excluded['not_species_name']+=1;continue
   key=norm(alias)
   if not key or key in canon:excluded['already_canonical']+=1;continue
   candidates.append((key,alias,name,row[1],result['key']))
 indexed=collections.defaultdict(set)
 for key,alias,name,tier,taxon in candidates:indexed[key].add(name)
 emitted=set()
 for key,alias,name,tier,taxon in sorted(candidates,key=lambda a:(a[2],len(a[1]),a[1])):
  if len(indexed[key])!=1:excluded['ambiguous_between_species']+=1;continue
  if key in emitted:continue
  per_taxon=sum(r['id']==id and r['canonical']==name for r in accepted)
  if per_taxon>=3:excluded['limited_to_three_per_species']+=1;continue
  emitted.add(key)
  accepted.append({'id':id,'canonical':name,'alias':alias,'tier':tier,
   'gbif_species_key':taxon,'source_url':'https://www.gbif.org/species/'+str(taxon),
   'review':'exact_english_gbif_common_name','publisher_original_validator_verified':'NO'})
with outfile.open('w',newline='',encoding='utf8') as f:
 if accepted:
  w=csv.DictWriter(f,fieldnames=list(accepted[0]),lineterminator='\n');w.writeheader();w.writerows(accepted)
audit_summary={'verified_source_taxa':sum(cache.get(n,{}).get('status')=='VERIFIED' for n in all_latin),
 'taxa_sampled':len(all_latin),'safe_aliases':len(accepted),
 'questions_with_aliases':len({x['id'] for x in accepted}),
 'by_question':dict(collections.Counter(x['id'] for x in accepted)),
 'excluded':dict(excluded)}
(root/'data/krillion-review/gbif-common-name-audit-summary.json').write_text(json.dumps(audit_summary,indent=2)+'\n')
print(json.dumps(audit_summary,indent=2),flush=True)
