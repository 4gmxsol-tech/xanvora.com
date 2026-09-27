import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class SinusoidalEmbedding(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.dim = dim
    def forward(self, t):
        half = self.dim // 2
        freq = torch.exp(-math.log(10000) * torch.arange(half, device=t.device) / max(half-1, 1))
        x = t.float()[:, None] * freq[None, :]
        return torch.cat([x.sin(), x.cos()], dim=-1)

class TextEncoder(nn.Module):
    def __init__(self, vocab=256, dim=256):
        super().__init__()
        self.emb = nn.Embedding(vocab, dim)
        self.norm = nn.LayerNorm(dim)
    def forward(self, tokens):
        x = self.emb(tokens)
        mask = (tokens != 0).float()[..., None]
        return self.norm((x * mask).sum(1) / mask.sum(1).clamp_min(1.0))

class Block(nn.Module):
    def __init__(self, dim, heads):
        super().__init__()
        self.n1=nn.LayerNorm(dim)
        self.attn=nn.MultiheadAttention(dim, heads, batch_first=True)
        self.n2=nn.LayerNorm(dim)
        self.ff=nn.Sequential(nn.Linear(dim,dim*4),nn.GELU(),nn.Linear(dim*4,dim))
    def forward(self,x,cond):
        h=self.n1(x+cond[:,None,:])
        x=x+self.attn(h,h,h,need_weights=False)[0]
        return x+self.ff(self.n2(x))

class XanvoraV0(nn.Module):
    def __init__(self, base=64, text_dim=256, time_dim=256, layers=6, heads=4):
        super().__init__()
        self.base=base
        self.in_proj=nn.Conv3d(3,base,3,padding=1)
        self.out_proj=nn.Conv3d(base,3,3,padding=1)
        self.text=TextEncoder(256,text_dim)
        self.time=nn.Sequential(SinusoidalEmbedding(time_dim),nn.Linear(time_dim,time_dim),nn.SiLU(),nn.Linear(time_dim,text_dim))
        self.blocks=nn.ModuleList([Block(base,heads) for _ in range(layers)])
        self.cond=nn.Linear(text_dim,base)
    def forward(self,x,t,tokens):
        h=self.in_proj(x)
        b,c,f,hh,w=h.shape
        z=h.permute(0,2,3,4,1).reshape(b,f*hh*w,c)
        cond=self.cond(self.text(tokens)+self.time(t))
        for block in self.blocks:
            z=block(z,cond)
        h=z.reshape(b,f,hh,w,c).permute(0,4,1,2,3)
        return self.out_proj(h)

def tokenize(texts, max_len=64, device=None):
    out=torch.zeros(len(texts),max_len,dtype=torch.long,device=device)
    for i,s in enumerate(texts):
        vals=[(ord(ch)%255)+1 for ch in s[:max_len]]
        if vals: out[i,:len(vals)]=torch.tensor(vals,device=device)
    return out
