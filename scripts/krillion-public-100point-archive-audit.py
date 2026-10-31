#!/usr/bin/env python3
"""Read public daily snapshot page HEADERS and only 100-point lists for selected prompts.

Never treat a third-party aggregation as authenticated original-server evidence.
Extracts minimal claimed tier data and preserves public URL/date provenance.
"""
import csv,datetime,json,re,concurrent.futures,requests,time
from pathlib import Path
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
source=root/'data/krillion-review/96-missing-100-review.csv'
out=root/'data/krillion-review/public-daily-100-evidence.csv'
audit=root/'data/krillion-review/public-daily-100-source-audit.json'
rows=list(csv.DictReader(source.open()))
unresolved={r['question']:r for r in rows}
start=datetime.date(2026,7,16)
end=datetime.date(2026,10,31)
dates=[start+datetime.timedelta(days=i) for i in range((end-start).days+1)]
def check(day):
 url='https://minutecryptic.today/krillion-answers/'+day.isoformat()
 try:
  resp=requests.get(url,headers={'User-Agent':'Mozilla/5.0 (independent Krillion source research)'},timeout=26)
  if resp.status_code!=200:return({'date':day.isoformat(),'http':resp.status_code,'count':0},[])
  soup=BeautifulSoup(resp.text,'html.parser')
  evidence=[]
  cards=soup.select('article[data-krillion-card]')
  for card in cards:
   h=card.select_one('h3')
   if h is None:continue
   question=h.get_text(' ',strip=True)
   if question not in unresolved:continue
   tier=card.select_one('details[data-tier="krillion"]')
   if tier is None:continue
   lis=tier.select('ul[data-answer-grid] li')
   for li in lis:
    # Comments/description are nested small, not part of answer label.
    little=li.find('small')
    if little:little.extract()
    name=li.get_text(' ',strip=True)
    if name and len(name)<220:evidence.append({
      'id':unresolved[question]['id'],'question':question,'archive_date':day.isoformat(),
      'proposed_100_point_answer':name,
      'source_url':url,'third_party_archive_points':100,
      'original_publisher_verified':'NO','confidence':'THIRD_PARTY_PUBLIC_TIER_CLAIM'
    })
  return({'date':day.isoformat(),'http':200,'count':len(cards),'matched_missing_100':len(evidence)},evidence)
 except Exception as exc:
  return({'date':day.isoformat(),'http':'ERROR','error':str(exc)[:160]},[])
reports=[];found=[]
for batch_start in range(0,len(dates),15):
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
  for report,evidence in pool.map(check,dates[batch_start:batch_start+15]):
   reports.append(report);found.extend(evidence)
 print('SCANNED',len(reports),'/',len(dates),'ARCHIVED_100',len(found),'NO_HTML',sum(x['http']!=200 for x in reports),flush=True)
 time.sleep(0.7)
with out.open('w',newline='',encoding='utf8') as f:
 fields=['id','question','archive_date','proposed_100_point_answer','source_url','third_party_archive_points','original_publisher_verified','confidence']
 w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows(found)
audit.write_text(json.dumps({'dates':reports,'matched_archive_answers':len(found),
 'matching_questions':len(set(x['id'] for x in found)),
 'user_warning':'Third-party public archived score is not direct evidence of the original private server'},indent=2)+'\n')
print('ARCHIVE_100_MATCHED',len(found),'QUESTIONS',len(set(x['id'] for x in found)))
print('MATCHES',[(x['id'],x['proposed_100_point_answer']) for x in found[:70]],flush=True)
