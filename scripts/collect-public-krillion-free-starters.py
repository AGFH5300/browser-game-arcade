#!/usr/bin/env python3
"""Recover free public starter game prompts and independently archived scored answers.
Never use credentials, paywall bypass, protected game indices or undocumented POSTs.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from pathlib import Path
from html import unescape
import json, re, requests, time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public/play/deep-dive/recovered/free-starters.json"
COMPANION="https://krillion-game.com"
OFFICIAL="https://krillion.io"
MODES=("unlimited","movies","sports","geography","lexicon")
SCORES={10,15,30,60,85,100}
# Search index is token-based: complete prompts sometimes miss entries that shorter
# distinctive phrases find. Never relax exact prompt-ID AND full-text validation.
SHORT_TERMS={
    "movies:1:r7":"Bond film",
    "sports:1:r7":"soccer World Cup",
    "geography:1:r2":"national capital",
    "geography:1:r4":"flag includes",
    "geography:1:r5":"English name contains",
    "geography:1:r7":"border with Germany",
}
def get(url,params=None):
    res=requests.get(url,params=params,timeout=20,headers={"User-Agent":"Sidequest-Public-Reference-Inspection/1.0"})
    res.raise_for_status()
    return res
def fetch_one(mode,source):
    ident=mode+":1:"+source["id"]
    text=source["text"]
    if mode=="lexicon":
        return {"id":ident,"text":text,"answers":[],"verified":False,"reason":"No independently published scored answer sheet located"}
    suggested=get(COMPANION+"/api/suggest/",{"q":text,"mode":mode}).json().get("results",[])
    exact=[x for x in suggested if x.get("id")==ident and x.get("text")==text]
    if not exact and ident in SHORT_TERMS:
        suggested=get(COMPANION+"/api/suggest/",{"q":SHORT_TERMS[ident],"mode":mode}).json().get("results",[])
        exact=[x for x in suggested if x.get("id")==ident and x.get("text")==text]
    if len(exact)!=1 or not exact[0].get("archive"):
        return {"id":ident,"text":text,"answers":[],"verified":False,"reason":"No exact independent answer index match"}
    url=COMPANION+exact[0]["archive"]
    res=get(url);html=res.text
    pairs=re.findall(r'<div class="answer-row"\s+[^>]*data-answer="([^"]+)"\s+data-score="(\d+)"',html)
    seen=set();answers=[]
    for value,points in pairs:
        name=unescape(value).strip();score=int(points)
        if score not in SCORES or not name or name.casefold() in seen:continue
        seen.add(name.casefold());answers.append([name,score])
    return {"id":ident,"text":text,"answers":answers,"verified":len(answers)>0,
            "answerSource":url,"answerPageSha256":sha256(res.content).hexdigest()}
def run():
    payload={"sourceType":"Public free starter prompts + independent published scored-answer lists",
        "modes":{},"warning":"Archived answer lists may differ from the current Krillion validator. No paid content or hidden endpoints used."}
    for mode in MODES:
        officialURL=OFFICIAL+("/api/unlimited/1" if mode=="unlimited" else "/api/packs/"+mode+"/1")
        page=get(officialURL);data=page.json()
        assert data.get("game")==1 and len(data.get("prompts",[]))==7
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures=[pool.submit(fetch_one,mode,p) for p in data["prompts"]]
            q=[f.result() for f in futures]
        payload["modes"][mode]={"game":1,"officialUrl":officialURL,"officialVersion":data.get("version"),
            "officialSha256":sha256(page.content).hexdigest(),"questions":q}
        print(mode,"verified",sum(x["verified"] for x in q),"/7",
            "answers",sum(len(x["answers"]) for x in q),flush=True)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n")
    print("SAVED",str(OUT),OUT.stat().st_size,flush=True)
if __name__=="__main__":run()
