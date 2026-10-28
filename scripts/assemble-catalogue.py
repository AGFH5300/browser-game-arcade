"""Assemble the reviewed reference catalogue; never infer game entrypoint URLs."""
import json,re,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
read=lambda p:json.loads((root/p).read_text())
write=lambda p,v:(root/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
inventory=read('docs/WATCHDOCUMENTARIES_INVENTORY.json')['games']
sources={g['referencePage']:g for g in read('docs/V4_CATALOGUE_SOURCES.json')['games']}
metadata={norm(k):v for k,v in read('scripts/catalogue-metadata.json').items()}
screens={g['source_page']:g['screenshot_source'] for g in read('data/watchdocumentaries-inventory.json')['games']}
approvedfile=root/'docs/V4_APPROVED_PUBLISHER_EMBEDS.json'
approved={g['slug']:g for g in read('docs/V4_APPROVED_PUBLISHER_EMBEDS.json').get('games',[])} if approvedfile.exists() else {}
seed=read('data/seed-games.json');existing={g['slug']:g for g in seed}
archive='https://browser-game-arcade-dxbavg-7923s-projects.vercel.app'
local={'run-3':{'source':'bigjackson/Run3Source','revision':'32afdf8591fb0ab6ef567628f8a6d0273e831f52'}}
packagefile=root/'scripts/catalogue-package-sources.json'
if packagefile.exists():
    packages=read('scripts/catalogue-package-sources.json')
    for p in packages.get('packages',[]):
        if p.get('ready',True):local[p['slug']]={'source':p.get('source',packages.get('source')),'revision':p.get('revision',packages.get('revision'))}
flashfile=root/'scripts/flash-package-sources.json'
if flashfile.exists():
    for p in read('scripts/flash-package-sources.json').get('packages',[]):
        local[p['slug']]={'url':p['url'],'runtime':'ruffle','externalDependencies':p.get('externalDependencies',[]),'embeddedRestriction':p.get('embeddedRestriction')}
coverfiles={g['sourcePage']:g for g in read('scripts/reference-cover-sources.json')['items']}
referencefile=root/'scripts/reference-package-sources.json'
if referencefile.exists():
    for p in read('scripts/reference-package-sources.json').get('packages',[]):
        if p.get('ready'):local[p['slug']]={'url':p.get('sourceUrl') or p.get('sourceURL'),'runtime':'reference-html5'}
extrafile=root/'scripts/extra-package-sources.json'
if extrafile.exists():
    for p in read('scripts/extra-package-sources.json').get('packages',[]):
        if p.get('ready',True):local[p['slug']]={'source':p['source'],'revision':p['revision']}
records=[];covers={};registry=[];missing=[]
for i,g in enumerate(inventory):
    src=sources[g['reference']];slug=g['reference'].rstrip('/').split('/')[-1].removesuffix('-game')
    if slug=='five-nights-at-freddys':slug='fnaf'
    if g['reference']=='https://watchdocumentaries.com/worlds-hardest-game/':slug='worlds-hardest-game'
    old=existing.get(slug);hosted=slug in local
    url=archive+'/play/archives/'+slug+'/index.html' if hosted else src.get('referenceEngineURL')
    if slug in approved:url=approved[slug]['url'];hosted=False
    if slug=='polytrack' and old and not hosted:url=old['gameUrl']
    if old and old['gameUrl'].startswith('/play/'):url=old['gameUrl'];hosted=True
    if not url or (url.endswith('.swf') and not hosted) or (url.startswith('https://watchdocumentaries.com/') and not hosted):
        missing.append(g['title']);continue
    category,description=metadata[norm(g['title'])]
    screenshot=screens[g['reference']]
    coverpath='/'+coverfiles[g['reference']]['outputPath'].removeprefix('public/')
    covers[slug]={'url':screenshot,'mime':'image/png' if '.png' in screenshot.lower() else 'image/jpeg','localPath':coverpath}
    mode='local_package' if hosted else 'reference_embed'
    source=(local[slug].get('url') or 'https://github.com/'+local[slug]['source']+'/tree/'+local[slug]['revision']) if slug in local else g['reference']
    if slug in approved:source=approved[slug]['sourceUrl']
    developer=approved.get(slug,{}).get('developer') or src.get('developer');developer=developer.get('name') if isinstance(developer,dict) else developer
    record={
      'id':slug,'title':g['title'],'slug':slug,'description':description,
      'shortDescription':description,'thumbnail':coverpath,
      'categories':[category,'Classic']+(['Flash Archive'] if local.get(slug,{}).get('runtime')=='ruffle' else []),'collections':['classics'],
      'tags':['reference-catalogue','user-qa-pending',mode.replace('_','-')]+(['ruffle'] if local.get(slug,{}).get('runtime')=='ruffle' else []),
      'developer':developer or 'Creator credits in game','engine':'html5' if hosted else 'iframe',
      'gameUrl':url,'sourceUrl':source,
      'license':'Owner-authorized game archive' if hosted else 'Owner-authorized reference embed',
      'licenseNotes':('Owner supplied content and screenshot authorization on 2026-10-27. '+('Locally packaged files are hash-pinned; original notices retained. ' if slug in local else 'Loaded from the exact observed reference entrypoint; external hosting and availability remain dependencies. ' if not hosted else 'Existing local version and license retained. ')+'No official partnership implied. Manual gameplay, mobile compatibility and audible audio testing are pending user review.'),
      'mobile':False,'controls':'Use the controls shown on the game’s title or help screen. Click inside the game to focus keyboard input.',
      'instructions':description+' Select Play now, then follow the game’s own start and control prompts.',
      'featured':False,'published':True,'displayOrder':100+i,
      'createdAt':'2026-10-27T00:00:00.000Z','updatedAt':'2026-10-27T00:00:00.000Z','publishedAt':'2026-10-27T00:00:00.000Z'}
    if slug in approved:
        record.update(license='Publisher-provided embed',licenseNotes='The provider exposes this exact game embed or official game entrypoint. Game rights remain with the credited creator. The provider controls availability, cookies and in-game advertising. No local game assets copied; no official partnership implied. Gameplay QA pending user review.')
    if old:
        # Retain IDs, existing content, local licenses and collection memberships.
        record={**old,'thumbnail':old.get('thumbnail') or coverpath,'gameUrl':url if not old['gameUrl'].startswith('/play/') else old['gameUrl'],
          'collections':list(dict.fromkeys(old['collections']+['classics'])),
          'tags':list(dict.fromkeys(old['tags']+['reference-catalogue','user-qa-pending']))}
        if slug in local:record.update(engine='html5',sourceUrl=source,license='Owner-authorized game archive',licenseNotes='Owner-authorized pinned community archive. Original notices retained. Manual gameplay QA pending user review.')
    records.append(record)
    registry.append({'title':g['title'],'slug':slug,'reference':g['reference'],'gameUrl':record['gameUrl'],
      'hosting':('local_flash_player' if local.get(slug,{}).get('runtime')=='ruffle' else 'local_package' if record['gameUrl'].startswith('/play/') or record['gameUrl'].startswith(archive+'/play/archives/') else 'external_embed'),
      'sourceUrl':record['sourceUrl'],'coverSource':screenshot,'gameplayQA':'pending_user','mobileQA':'pending_user','audioQA':'pending_user','externalDependencies':local.get(slug,{}).get('externalDependencies',[]),'embeddedRestriction':local.get(slug,{}).get('embeddedRestriction')})
if missing:raise SystemExit('Missing local package or frameable runtime: '+', '.join(missing))
assert len(registry)==128 and len({g['slug'] for g in registry})==128
write('data/reference-games.json',records)
write('data/reference-covers.json',covers)
write('data/reference-entrypoints.json',[g['gameUrl'] for g in records if g['gameUrl'].startswith('https://') and not g['gameUrl'].startswith(archive+'/') and not g['gameUrl'].startswith('https://carlwalks.com/')])
write('docs/V4_INTEGRATION_STATUS.json',{'total':128,'gameplayQA':'pending_user','games':registry})
write('lib/archive-paths.json',sorted(['/play/archives/moto-x3m-2/index.html']+['/play/archives/'+s+'/index.html' for s in local]))
print(json.dumps({'referenceGames':len(registry),'local':sum(g['hosting']=='local_package' for g in registry),'external':sum(g['hosting']=='external_embed' for g in registry),'newRecords':sum(g['slug'] not in existing for g in records)}))
