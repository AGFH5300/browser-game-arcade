#!/usr/bin/env python3
"""Verified product-owner browser names, separate new practice and same-product aliases."""
import json,csv,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
b=root/'public/play/deep-dive/recovered/independent-bank'
p=b/'KR0180.json';pack=json.loads(p.read_text())
mfile=b/'manifest.json';m=json.loads(mfile.read_text())
out=root/'data/krillion-review'
def norm(x):return re.sub(r'[^a-z0-9]','',x.casefold())
present={norm(a[0]) for a in pack['answers']}
new=[
 ('Midori','https://astian.org/midori-browser/'),
 ('NetSurf','https://www.netsurf-browser.org/'),
 ('Falkon','https://apps.kde.org/falkon/'),
 ('Basilisk','https://www.basilisk-browser.org/'),
 ('Lunascape','https://www.lunascape.org/'),
 ('Sleipnir','https://www.fenrir-inc.com/jp/sleipnir/')
]
records=[]
for name,url in new:
 assert norm(name) not in present
 pack['answers'].append([name,2,'reference']);present.add(norm(name))
 records.append({'id':'KR0180','answer':name,'score':30,'source_url':url,
 'evidence':'Publisher/developer product website identifies a web browser',
 'publisher_accepted':'NOT_VERIFIED','rarity_method':'INDEPENDENT_ESTIMATED_30'})
aliases=[
 ('Falkon','QupZilla','https://www.falkon.org/posts/2018/2018-02-27-falkon-300-released/'),
 ('GNOME Web','GNOME Web (Epiphany)','https://apps.gnome.org/Epiphany/'),
 ('Maxthon','Maxthon Cloud Browser','https://www.maxthon.com/'),
 ('Brave','Brave Browser','https://brave.com/')
]
aliasrows=[]
for can,alias,url in aliases:
 existing=[r for r in pack['answers'] if r[0]==can]
 assert len(existing)==1
 assert norm(alias) not in present
 aliasrows.append({'id':'KR0180','canonical':can,'alias':alias,'tier':existing[0][1],
 'source_url':url,'review':'independent_official_full_title',
 'kind':'official_browser_name_or_renamed_brand',
 'publisher_original_validator_verified':False})
with (out/'official-browser-source-additions.csv').open('w',encoding='utf8',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(records[0]),lineterminator='\n');w.writeheader();w.writerows(records)
with (out/'official-browser-source-aliases.csv').open('w',encoding='utf8',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(aliasrows[0]),lineterminator='\n');w.writeheader();w.writerows(aliasrows)
p.write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
next(r for r in m['questions'] if r['id']=='KR0180')['answerCount']=len(pack['answers'])
m['answerCount']=sum(a['answerCount'] for a in m['questions'])
mfile.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
print('NEW_BROWSER_ANSWERS',len(records),'ALIASES',len(aliasrows),'TOTAL',m['answerCount'])
