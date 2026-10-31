#!/usr/bin/env python3
"""Source-backed independent practice answers and official full-name aliases.

No original Krillion server rarity implied. Existing answers retain exact tier.
"""
from pathlib import Path
from collections import defaultdict
import requests,bs4,csv,json,re,unicodedata
from urllib.parse import urljoin
root=Path(__file__).resolve().parents[1]
bank=root/'public/play/deep-dive/recovered/independent-bank'
out=root/'data/krillion-review'
manfile=bank/'manifest.json';manifest=json.loads(manfile.read_text())
byid={x['id']:x for x in manifest['questions']}
packcache={}
def pack(id):
 if id not in packcache:packcache[id]=json.loads((bank/(id+'.json')).read_text())
 return packcache[id]
def norm(t):
 x=unicodedata.normalize('NFKD',t.casefold())
 return ''.join(c for c in x if c.isascii() and c.isalnum())
new=[];aliases=[];evidence=[]
def add(id,name,src,why,tier=2,provenance='reference'):
 existing={norm(x[0]) for x in pack(id)['answers']}
 assert norm(name) not in existing,(id,name)
 pack(id)['answers'].append([name,tier,provenance])
 new.append({'id':id,'answer':name,'score':(10,15,30,60,85,100)[tier],
  'source_url':src,'evidence':why,'publisher_accepted':'NOT_VERIFIED',
  'rarity_method':'THIRD_PARTY_ARCHIVED_TIER' if provenance=='archive' else 'INDEPENDENT_ESTIMATED_30'})
def alias(id,canonical,value,src,reason):
 target=[x for x in pack(id)['answers'] if x[0]==canonical]
 assert len(target)==1,(id,canonical)
 assert norm(value) not in {norm(x[0]) for x in pack(id)['answers']},(id,'already canonical',value)
 assert norm(value) not in {norm(x['alias']) for x in aliases if x['id']==id},(id,'duplicate alias',value)
 aliases.append({'id':id,'canonical':canonical,'alias':value,'tier':target[0][1],
  'source_url':src,'review':'independent_official_full_title','kind':reason,
  'publisher_original_validator_verified':False})
# Official NPS public national-park category, no state parks / monuments mixed in.
source='https://www.nps.gov/aboutus/national-park-system.htm'
response=requests.get(source,timeout=25,headers={'User-Agent':'Mozilla/5.0 Sidequest evidence audit'})
response.raise_for_status()
soup=bs4.BeautifulSoup(response.text,'html.parser')
first=soup.find('a',string='Acadia National Park')
assert first is not None
parks=[(x.get_text(' ',strip=True),urljoin(source,x.get('href',''))) for x in first.parent.select('a')]
assert len(parks)==64,len(parks)
for name,url in parks:
 short=name.removesuffix(' National Park').removesuffix(' National Park and Preserve')
 if name=='National Park of American Samoa':short='American Samoa'
 if name=="Hawai'i Volcanoes National Park":short='Hawaii Volcanoes'
 # Official title and source are recognized; preserve original short-title score.
 matches=[r[0] for r in pack('KR0084')['answers'] if norm(r[0])==norm(short)]
 if not matches:
  assert short=='Chiricahua',(name,short)
  add('KR0084',short,url,'NPS official current National Park System directory')
 else:
  assert len(matches)==1
  alias('KR0084',matches[0],name,url,'official_nps_full_title')
# Disney Animation source (separate feature list; not Disney live-action films)
disney='https://www.disneyanimation.com/films/'
alias('KR0032','Oliver and Company','Oliver & Company',disney,'official_studio_punctuation_variant')
add('KR0032','Winnie the Pooh',disney,'WDAS official feature-film list')
# Pixar protagonists: official Disney/Pixar movie story/cast pages.
for canonical,name,url in [
 ('Miguel','Miguel Rivera','https://movies.disney.com/coco'),
 ('Riley','Riley Anderson','https://movies.disney.com/inside-out'),
 ('Luca','Luca Paguro','https://movies.disney.com/luca')
]:
 alias('KR0454',canonical,name,url,'studio_canonical_full_character_name')
# Carl Fredricksen is already canonical in source; discard the model's
# incorrect "Carl Fredrickson" rather than create an unverified duplicate.
# Exact Pokémon Fire/Dragon Mega form official franchise source.
add('KR0513','Mega Charizard X',
 'https://www.pokemon.com/uk/features/a-guide-to-mega-evolution-in-pokemon-go',
 'The Pokémon Company official type reference explicitly Fire/Dragon')
for name,url in [
 ('Kathleen Lonsdale','https://royalsociety.org/about-us/who-we-are/diversity-inclusion/influential-british-women-science/'),
 ('Rudolf Peierls','https://www.birmingham.ac.uk/about/college-of-engineering-and-physical-sciences/physics-and-astronomy/about'),
 ('Ernest Walton','https://www.nobelprize.org/prizes/physics/1951/walton/facts/'),
 ('Felix Bloch','https://www.nobelprize.org/prizes/physics/1952/bloch/facts/'),
 ('Julian Schwinger','https://www.nobelprize.org/prizes/physics/1965/schwinger/facts/'),
 ('David Thouless','https://www.nobelprize.org/prizes/physics/2016/thouless/facts/')
]:
 add('KR0215',name,url,'Physicist biography and documented scientific work')
# Third-party archive, not original server confirmation. The original server
# refuses replay for July 27: HTTP 403 'That puzzle is not open for play'.
# Preserve this uncertainty; score 100 is an *archived tier claim*.
records=list(csv.DictReader((out/'public-daily-100-evidence.csv').open()))
assert len(records)==1 and records[0]['id']=='KR0078'
row=records[0]
assert row['proposed_100_point_answer']=='Western Sahara' and row['archive_date']=='2026-07-27'
add('KR0078','Western Sahara',row['source_url'],
 'Third-party public daily archive shows 100, disputed sovereign-status edge case; original server replay unavailable',5,'archive')
# Keep all old scores untouched; pack-level flags remain false.
for id,p in packcache.items():
 p['originalPublisherAcceptanceVerified']=False
 p['allScoresEmpiricallyCalibrated']=False
 (bank/(id+'.json')).write_text(json.dumps(p,ensure_ascii=False,separators=(',',':'))+'\n')
 byid[id]['answerCount']=len(p['answers'])
manifest['answerCount']=sum(x['answerCount'] for x in manifest['questions'])
manfile.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
for file,rows in [('official-source-new-answers.csv',new),('official-source-title-aliases.csv',aliases)]:
 with (out/file).open('w',encoding='utf8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
print(json.dumps({'NPS_directory':len(parks),'added_total':len(new),
 'archived_claimed_100':sum(x['rarity_method']=='THIRD_PARTY_ARCHIVED_TIER' for x in new),
 'new_source_estimate':sum(x['rarity_method']=='INDEPENDENT_ESTIMATED_30' for x in new),
 'full_title_aliases':len(aliases),'new_answer_count':manifest['answerCount'],
 'by_question':{id:sum(x['id']==id for x in new) for id in set(x['id'] for x in new)}},indent=2))
