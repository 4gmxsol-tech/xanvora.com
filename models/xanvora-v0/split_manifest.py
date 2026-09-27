import argparse, json, random
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True); p.add_argument("--train",required=True); p.add_argument("--val",required=True)
    p.add_argument("--val-ratio",type=float,default=0.02); p.add_argument("--seed",type=int,default=42)
    a=p.parse_args()
    rows=[json.loads(x) for x in open(a.input,encoding="utf-8") if x.strip()]
    random.Random(a.seed).shuffle(rows)
    n=max(1,int(len(rows)*a.val_ratio))
    val,train=rows[:n],rows[n:]
    for path,data in ((a.train,train),(a.val,val)):
        Path(path).parent.mkdir(parents=True,exist_ok=True)
        with open(path,"w",encoding="utf-8") as f:
            for row in data: f.write(json.dumps(row,ensure_ascii=False)+"\n")
    print(f"train={len(train)} val={len(val)}")

if __name__=="__main__": main()
