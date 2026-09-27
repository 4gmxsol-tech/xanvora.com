import torch

def cosine_beta_schedule(n,device):
    s=0.008
    x=torch.linspace(0,n,n+1,device=device)
    a=torch.cos(((x/n)+s)/(1+s)*torch.pi/2)**2
    a=a/a[0]
    betas=1-(a[1:]/a[:-1])
    return betas.clamp(1e-5,0.999)

class Diffusion:
    def __init__(self,n=1000):
        self.n=n
    def schedule(self,device):
        beta=cosine_beta_schedule(self.n,device)
        alpha=1-beta
        abar=torch.cumprod(alpha,0)
        return beta,alpha,abar
    def q_sample(self,x0,t,noise,abar):
        a=abar[t].view(-1,1,1,1,1)
        return a.sqrt()*x0+(1-a).sqrt()*noise
