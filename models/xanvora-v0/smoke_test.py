import torch
from config import Config
from model import XanvoraV0, tokenize
from diffusion import Diffusion

def main():
    c=Config(frames=4,size=32,base=32,layers=2,heads=4)
    dev="cuda" if torch.cuda.is_available() else "cpu"
    model=XanvoraV0(c.base,c.text_dim,c.time_dim,c.layers,c.heads).to(dev)
    x=torch.randn(1,3,c.frames,c.size,c.size,device=dev)
    t=torch.randint(0,1000,(1,),device=dev)
    tok=tokenize(["a humanoid robot walking"],device=dev)
    y=model(x,t,tok)
    assert y.shape==x.shape,(y.shape,x.shape)
    diff=Diffusion(1000); _,_,abar=diff.schedule(dev)
    noise=torch.randn_like(x); xt=diff.q_sample(x,t,noise,abar)
    assert xt.shape==x.shape
    loss=(y-noise).pow(2).mean(); loss.backward()
    print(f"Xanvora-V0 smoke test: PASS device={dev} loss={loss.item():.5f}")

if __name__=="__main__": main()
