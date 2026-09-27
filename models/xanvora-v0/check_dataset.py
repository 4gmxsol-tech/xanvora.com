import argparse, json, cv2
from pathlib import Path

def main():
    p=argparse.ArgumentParser(); p.add_argument("--manifest",required=True); p.add_argument("--max-items",type=int,default=1000)
    a=p.parse_args(); good=bad=0
    root=Path(a.manifest).parent
    for i,line in enumerate(open(a.manifest,encoding="utf-8")):
        if i>=a.max_items: break
        try:
            x=json.loads(line); path=root/x["video"]; cap=cv2.VideoCapture(str(path))
            n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); fps=float(cap.get(cv2.CAP_PROP_FPS) or 0); w=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); h=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)); cap.release()
            if n>=16 and w>=64 and h>=64 and fps>0 and x.get("caption"): good+=1
            else: bad+=1
        except Exception: bad+=1
    print(f"checked={good+bad} good={good} bad={bad}")

if __name__=="__main__": main()
