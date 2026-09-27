import argparse, torch, imageio
from config import Config
from model import XanvoraV0,tokenize
from diffusion import Diffusion

@torch.no_grad()
def main():
    p=argparse.ArgumentParser(); p.add_argument("--checkpoint",required=True); p.add_argument("--prompt",required=True); p.add_argument("--out",default="sample.mp4")
    a=p.parse_args(); c=Config(); dev="cuda" if torch.cuda.is_available() else "cpu"
    model=XanvoraV0(c.base,c.text_dim,c.time_dim,c.layers,c.heads).to(dev)
    model.load_state_dict(torch.load(a.checkpoint,map_location=dev)["model"]); model.eval()
    diff=Diffusion(c.diffusion_steps); beta,alpha,abar=diff.schedule(dev)
    x=torch.randn(1,3,c.frames,c.size,c.size,device=dev)
    tok=tokenize([a.prompt],device=dev)
    for i in reversed(range(0,c.diffusion_steps,10)):
        t=torch.full((1,),i,device=dev,dtype=torch.long)
        eps=model(x,t,tok); aa=abar[t].view(1,1,1,1,1)
        x=(x-eps*(1-aa).sqrt())/aa.sqrt()
        if i>0:
            x=x+beta[t].sqrt().view(1,1,1,1,1)*torch.randn_like(x)
    video=((x.clamp(-1,1)+1)*127.5).byte()[0].permute(1,2,3,0).cpu().numpy()
    imageio.mimsave(a.out,list(video),fps=8)
    print(a.out)

if __name__=="__main__": main()
