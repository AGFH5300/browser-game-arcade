#!/usr/bin/env python3
"""Import *publicly published* historical answer snapshots for local practice.

Source: krilliongame.com/krillion-answers/YYYY-MM-DD/ (independent archive).
No official private/paid endpoint is queried. A date is added only when a\npublic independent archive snapshot exists. Data may differ from live scoring.
This one-time importer checks source dates and tier/point consistency, writes
one small JSON per day, and records the provenance and source response digest.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from hashlib import sha256
from pathlib import Path
import json, re, sys, time
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/play/deep-dive/recovered/archive"
OUT.mkdir(parents=True, exist_ok=True)
LEVEL = {"plankton": 10, "tooclever": 15, "schooler": 30, "rare": 60, "deepcut": 85, "krillion": 100}
START, END = date(2026, 7, 16), date(2026, 11, 1)
DAYS = [(START + timedelta(days=i)).isoformat() for i in range((END-START).days + 1)]
SESSION = requests.Session()
SESSION.headers["User-Agent"] = "Sidequest-Authorized-Public-Archive-Research/1.0"
def collect(day):
    url = f"https://krilliongame.com/krillion-answers/{day}/"
    dst = OUT / f"{day}.json"
    if dst.exists():
        value = json.loads(dst.read_text())
        return day, len(value["questions"]), sum(len(q["answers"]) for q in value["questions"]), "cached"
    last = None
    for attempt in range(3):
        try:
            response = SESSION.get(url, timeout=22)
            if response.status_code != 200:
                raise ValueError(f"HTTP {response.status_code}")
            m = re.search(r'<script[^>]+id="krilling-practice-data"[^>]*>(.*?)</script>', response.text, re.S)
            if not m:
                raise ValueError("public answer data not present")
            source = json.loads(m.group(1))
            if source["date"] != day or len(source.get("prompts", [])) != 7:
                raise ValueError("unexpected date or round count")
            result = {"date":day, "dayNumber":source["dayNumber"],
                      "source":url, "sourceSha256":sha256(response.content).hexdigest(), "questions":[]}
            for q in source["prompts"]:
                answers = []
                seen = set()
                for a in q.get("answers", []):
                    word, tier, points = a.get("answer"), a.get("tier"), a.get("score")
                    if not isinstance(word,str) or not word.strip() or LEVEL.get(tier) != points:
                        continue
                    norm = word.casefold().strip()
                    if norm in seen: continue
                    seen.add(norm)
                    answers.append([word, points])
                if not answers or not isinstance(q.get("text"),str):
                    raise ValueError("empty/invalid question")
                result["questions"].append({"id":f"archive:{day}:{q['id']}",
                                            "text":q["text"], "answers":answers})
            temp = dst.with_suffix(".tmp")
            temp.write_text(json.dumps(result, separators=(",",":"), ensure_ascii=False))
            temp.replace(dst)
            return day, 7, sum(len(q["answers"]) for q in result["questions"]), "downloaded"
        except Exception as e:
            last = e
            time.sleep(0.6 * (attempt+1))
    return day, 0, 0, str(last)

if __name__ == "__main__":
    dates = DAYS
    if len(sys.argv) > 1:
        dates = [d for d in DAYS if d >= sys.argv[1]]
    if len(sys.argv) > 2:
        dates = [d for d in dates if d <= sys.argv[2]]
    rows = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for f in as_completed([pool.submit(collect, day) for day in dates]):
            row = f.result()
            rows.append(row)
            if row[3] != "cached":
                print(*row, flush=True)
    rows.sort()
    success = [r for r in rows if r[1] == 7]
    manifest = {"source":"Independent archived snapshots at krilliongame.com (not live official API)",
                "firstDate":START.isoformat(),"lastDate":END.isoformat(),
                "importedDates":len(success),"prompts":sum(r[1] for r in success),
                "acceptedAnswerRows":sum(r[2] for r in success),
                "dates":[{"date":r[0],"prompts":r[1],"acceptedAnswers":r[2]} for r in success],
                "failures":[{"date":r[0],"error":r[3]} for r in rows if r[1] != 7]}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")
    print("FINAL",len(success),"dates",manifest["prompts"],"prompts",manifest["acceptedAnswerRows"],"answers",len(manifest["failures"]),"failed",flush=True)
    if manifest["failures"]: sys.exit(2)
