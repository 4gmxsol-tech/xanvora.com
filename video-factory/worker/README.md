# Xanvora Video Worker

## No-Colab deployment

This worker is packaged for a persistent NVIDIA GPU host. It is not dependent on Google Colab.

## Real generation profile

- Wan2GP / Wan 2.2 FastWan 5B
- model: ti2v_2_2_fastwan
- 832x480
- 8 inference steps
- 24 fps
- profile 4 + SDPA
- serialized queue with batch endpoint

## Docker

Build:

docker build -t xanvora-wan2gp .

Run:

docker run --gpus all -p 8000:8000 -v xanvora-video-data:/data/videos xanvora-wan2gp

The GPU host must expose the worker through HTTPS before it is entered into Xanvora Video Factory.

## Endpoints

- GET /health
- POST /v1/video/jobs
- POST /v1/video/batch
- GET /v1/video/jobs/{job_id}
- GET /v1/video/files/{filename}
