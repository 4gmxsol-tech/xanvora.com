import json, random
from pathlib import Path
import cv2, torch
from torch.utils.data import Dataset

class VideoDataset(Dataset):
    def __init__(self, manifest, frames=16, size=128):
        self.root=Path(manifest).parent
        self.items=[json.loads(x) for x in open(manifest,encoding="utf-8") if x.strip()]
        self.frames,self.size=frames,size
    def __len__(self): return len(self.items)
    def __getitem__(self,idx):
        item=self.items[idx]; cap=item["caption"]
        path=str(self.root/item["video"])
        reader=cv2.VideoCapture(path)
        n=max(int(reader.get(cv2.CAP_PROP_FRAME_COUNT)),1)
        start=random.randint(0,max(0,n-self.frames))
        reader.set(cv2.CAP_PROP_POS_FRAMES,start)
        frames=[]
        for _ in range(self.frames):
            ok,frame=reader.read()
            if not ok:
                if not frames: frame=cv2.imread(path)
                else: frame=frames[-1]
            frame=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
            frame=cv2.resize(frame,(self.size,self.size),interpolation=cv2.INTER_AREA)
            frames.append(frame)
        reader.release()
        x=torch.from_numpy(__import__("numpy").stack(frames)).permute(3,0,1,2).float()/127.5-1
        return x,cap
