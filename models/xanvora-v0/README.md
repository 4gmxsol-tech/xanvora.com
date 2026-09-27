# Xanvora-V0

A from-scratch research implementation of a text-conditioned video diffusion model.

This is intentionally independent from Wan2GP/LTX. Those systems may be used only as external baselines for evaluation.

## V0 target

- Text-conditioned video generation
- Tiny research-scale architecture
- Latent-free pixel-space prototype first
- 16 frames
- 128x128 training resolution
- 3D spatiotemporal denoiser
- classifier-free guidance
- DDPM/DDIM-style sampling
- trainable from random initialization

V0 is a research prototype, not a production-quality competitor to large video foundation models.

## Dataset format

Create a manifest:

`data/manifest.jsonl`

Each line:

`{"video":"relative/path/video.mp4","caption":"a humanoid robot walking in a warehouse"}`

The dataset loader samples/resizes short clips.

## Train

```bash
python train.py --manifest data/manifest.jsonl --output checkpoints/xanvora-v0
```

## Sample

```bash
python sample.py --checkpoint checkpoints/xanvora-v0/model.pt --prompt "a humanoid robot walking through a warehouse"
```

## Roadmap

V0.1: pixel-space proof of training and sampling
V0.2: stronger temporal attention
V0.3: video VAE/latent space
V0.4: larger transformer backbone
V0.5: curated robotics/physical-AI dataset
V1: scalable distributed training

Do not place private datasets, provider tokens, or model weights in Git.
