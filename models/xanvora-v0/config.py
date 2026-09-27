from dataclasses import dataclass

@dataclass
class Config:
    frames: int = 16
    size: int = 128
    channels: int = 3
    base: int = 64
    text_dim: int = 256
    time_dim: int = 256
    heads: int = 4
    layers: int = 6
    diffusion_steps: int = 1000
    train_batch: int = 1
    lr: float = 2e-4
    grad_clip: float = 1.0
    p_uncond: float = 0.10
