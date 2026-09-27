# Xanvora Video Worker Contract

POST /v1/video/jobs
{ "prompt": "...", "engine": "auto|ltx|wan2gp|veed", "duration": 5 }

GET /v1/video/jobs/:id

The worker should route auto to the lowest-cost compatible backend, queue jobs, load models only while jobs exist, use CPU offloading/quantization where supported, and shut down idle GPU capacity.

Suggested first backend: Wan2GP. Suggested second backend: LTX. VEED is an optional external fallback.

No provider keys or model weights belong in this repository.