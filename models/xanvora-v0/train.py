import argparse, os, torch
from torch.utils.data import DataLoader
from tqdm import tqdm
from config import Config
from dataset import VideoDataset
from diffusion import Diffusion
from model import XanvoraV0,tokenize

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--manifest",required=True); p.add_argument("--output",default="checkpoints/xanvora-v0")
    p.add_argument("--steps",type=int,default=10000); p.add_argument("--batch",type=int,default=1)
    a=p.parse_args(); c=Config(); os.makedirs(a.output,exist_ok=True)
    dev="cuda" if torch.cuda.is_available() else "cpu"
    ds=VideoDataset(a.manifest,c.frames,c.size)
    dl=DataLoader(ds,batch_size=a.batch,shuffle=True,num_workers=2,pin_memory=True)
    model=XanvoraV0(c.base,c.text_dim,c.time_dim,c.layers,c.heads).to(dev)
    opt=torch.optim.AdamW(model.parameters(),lr=c.lr,betas=(0.9,0.99),weight_decay=0.01)
    diff=Diffusion(c.diffusion_steps); beta,alpha,abar=diff.schedule(dev)
    model.train(); step=0
    while step<a.steps:
        for x,texts in dl:
            x=x.to(dev); t=torch.randint(0,c.diffusion_steps,(x.size(0),),device=dev); noise=torch.randn_like(x)
            xt=diff.q_sample(x,t,noise,abar)
            drop=torch.rand(x.size(0),device=dev)<c.p_uncond
            toks=tokenize([("" if d else s) for s,d in zip(texts,drop.tolist())],device=dev)
            pred=model(xt,t,toks); loss=(pred-noise).pow(2).mean()
            opt.zero_grad(set_to_none=True); loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(),c.grad_clip); opt.step()
            step+=1
            if step%100==0:
                print(f"step={step} loss={loss.item():.5f}")
                torch.save({"model":model.state_dict(),"step":step},os.path.join(a.output,"model.pt"))
            if step>=a.steps: break

if __name__=="__main__": main()
