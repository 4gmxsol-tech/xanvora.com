import argparse, csv, json, re
from pathlib import Path

def clean_caption(s):
    s=re.sub(r"\s+"," ",str(s or "")).strip()
    return s[:1000]

def resolve_video(root, row):
    candidates=[]
    for key in ("video","videoid","filename","name"):
        v=row.get(key)
        if v:
            candidates += [root/str(v), root/(str(v)+".mp4")]
    for p in candidates:
        if p.exists(): return p
    return None

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input-csv",required=True)
    p.add_argument("--video-root",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--max-items",type=int,default=10000)
    p.add_argument("--keyword",default="")
    a=p.parse_args()
    root=Path(a.video_root); out=Path(a.output); out.parent.mkdir(parents=True,exist_ok=True)
    wanted=[x.lower() for x in a.keyword.split(",") if x.strip()]
    seen=set(); count=0
    with open(a.input_csv,encoding="utf-8-sig",newline="") as f, out.open("w",encoding="utf-8") as g:
        for row in csv.DictReader(f):
            cap=clean_caption(row.get("caption") or row.get("name") or row.get("text"))
            if not cap: continue
            if wanted and not any(k in cap.lower() for k in wanted): continue
            video=resolve_video(root,row)
            if not video: continue
            rel=str(video.relative_to(out.parent.parent)).replace("\\","/")
            key=str(video.resolve())
            if key in seen: continue
            seen.add(key)
            g.write(json.dumps({"video":rel,"caption":cap},ensure_ascii=False)+"\n")
            count+=1
            if count>=a.max_items: break
    print(f"wrote {count} samples to {out}")

if __name__=="__main__": main()
