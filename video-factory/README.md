# Xanvora Video Factory

CPU-first control plane for GPU-efficient AI video generation, built inside Xanvora.

Browser UI -> Video API -> Queue -> GPU worker -> LTX/Wan2GP -> MP4

The browser uses CPU only. GPU is an external, optional worker using offloading/quantization and on-demand capacity.

Current MVP: prompt UI, engine selector, duration selector, client queue, worker API contract, CUDA worker scaffold, and no secrets/model weights committed.

Next deployment step: run the worker on a CUDA host and set window.XANVORA_VIDEO_API_URL to its HTTPS endpoint.