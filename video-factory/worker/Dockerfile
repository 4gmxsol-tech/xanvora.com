FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04
RUN apt-get update && apt-get install -y python3.11 python3.11-venv python3-pip git ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /opt
RUN git clone --depth 1 https://github.com/deepbeepmeep/Wan2GP.git
WORKDIR /opt/Wan2GP
RUN python3.11 -m pip install --upgrade pip && python3.11 -m pip install -r requirements.txt
WORKDIR /app
COPY requirements.txt .
RUN python3.11 -m pip install --no-cache-dir -r requirements.txt
COPY server.py .
ENV WGP_PROFILE=4
ENV WGP_ATTENTION=sdpa
ENV WANGP_VIDEO_MODEL_TYPE=ti2v_2_2_fastwan
ENV WANGP_RESOLUTION=832x480
ENV WANGP_STEPS=8
ENV VIDEO_OUTPUT_DIR=/data/videos
VOLUME ["/data","/opt/Wan2GP"]
EXPOSE 8000
CMD ["python3.11","-m","uvicorn","server:app","--host","0.0.0.0","--port","8000"]