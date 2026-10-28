#!/usr/bin/env python3
"""Pin only user-observed missing runtime assets confirmed to exist upstream.
No SDK impersonation, fabricated resources, or unpinned downloads at runtime.
"""
import json,hashlib,mimetypes,pathlib,requests,concurrent.futures,urllib.parse,collections
root=pathlib.Path(__file__).resolve().parent.parent
file=root/'scripts/reference-package-sources.json'
manifest=json.loads(file.read_text())
missing=json.loads((root/'scripts/page-one-reported-missing.json').read_text())
packages={p['slug']:p for p in manifest['packages']}
skip={'fortzone-battle-royale','rocket-league','subway-surfers','level-devil'}
tasks=[]
for slug,paths in missing.items():
    if slug in skip or slug not in packages:continue
    pkg=packages[slug]
    known={x['path'] for x in pkg['files']}
    for path in paths:
        if path in known or '..' in pathlib.PurePosixPath(path).parts:continue
        u=urllib.parse.urljoin(pkg['assetBaseUrl'],urllib.parse.quote(path,safe='/'))
        if urllib.parse.urlsplit(u).hostname!='watchdocumentaries.com':continue
        tasks.append((slug,path,u))
print('Checking exact missing runtime files:',len(tasks),flush=True)
session=requests.Session()
session.headers.update({'Accept-Encoding':'identity'})
cache=root/manifest['cacheRoot']
def capture(task):
    slug,path,url=task
    try:
        h=session.head(url,timeout=15,allow_redirects=True)
        if h.status_code not in (200,405):return (slug,path,h.status_code,None)
        expected=int(h.headers.get('content-length',0))
        if expected>manifest['maxFileBytes']:return (slug,path,'too_large',None)
        result=session.get(url,timeout=(10,90),stream=True)
        if result.status_code!=200:return (slug,path,result.status_code,None)
        ct=result.headers.get('content-type','application/octet-stream').split(';')[0]
        if 'html' in ct:return (slug,path,'html_not_an_asset',None)
        encoding=result.headers.get('content-encoding','identity')
        if encoding!='identity':return (slug,path,'encoded_needs_review',None)
        dest=cache/slug/path
        dest.parent.mkdir(parents=True,exist_ok=True)
        digest=hashlib.sha256();n=0
        with dest.open('wb') as out:
            for data in result.iter_content(chunk_size=256*1024):
                if not data:continue
                n+=len(data)
                if n>manifest['maxFileBytes']:raise ValueError('too large')
                digest.update(data);out.write(data)
        if n<100:return (slug,path,'short',None)
        sha=digest.hexdigest()
        item=dict(path=path,url=url,sourceSha256=sha,sourceSize=n,
                  contentType=ct,contentEncoding='identity',wireContentEncoding='identity',
                  required=True,evidence='user-reported-404-verified-source',
                  finalUrl=result.url,wireSha256=sha,wireSize=n,sha256=sha,size=n,
                  appliedChanges=[])
        return(slug,path,'pinned',item)
    except Exception as e:return(slug,path,str(e)[:120],None)
with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:results=list(pool.map(capture,tasks))
status=collections.Counter();by_slug=collections.Counter()
for slug,path,state,item in results:
    status[str(state)]+=1
    if item:
        packages[slug]['files'].append(item)
        by_slug[slug]+=1
        print('PIN',slug,path,item['sourceSize'],flush=True)
    else:print('SKIP',slug,path,state,flush=True)
for slug,n in by_slug.items():
    pkg=packages[slug]
    pkg['files'].sort(key=lambda f:f['path'])
    pkg['totalFiles']=len(pkg['files'])
    pkg['totalSourceBytes']=sum(f['sourceSize'] for f in pkg['files'])
manifest['totalFiles']=sum(len(p.get('files',[])) for p in manifest['packages'])
manifest['totalBytes']=sum(p.get('totalSourceBytes',0) for p in manifest['packages'])
file.write_text(json.dumps(manifest,indent=2)+'\n')
print('SUMMARY',dict(status),'new_by_game',dict(by_slug),
      'totalFiles',manifest['totalFiles'],'totalBytes',manifest['totalBytes'])
(root/'docs/PAGE_ONE_RUNTIME_SOURCE_RESULTS.json').write_text(
    json.dumps({'pinned':dict(by_slug),'statuses':dict(status),
        'skipped': [{'slug':a,'path':b,'reason':str(c)} for a,b,c,d in results if d is None]},indent=2)+'\n')
