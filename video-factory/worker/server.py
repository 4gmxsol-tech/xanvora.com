import os, uuid, threading
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app=FastAPI(title="Xanvora Video Worker")
app.add_middleware(CORSMiddleware,allow_origins=os.getenv("CORS_ORIGINS","*").split(","),allow_methods=["*"],allow_headers=["*"])
ROOT=Path(os.getenv("WANGP_ROOT","/opt/Wan2GP"))
OUT=Path(os.getenv("VIDEO_OUTPUT_DIR","/data/videos")); OUT.mkdir(parents=True,exist_ok=True)
app.mount("/v1/video/files",StaticFiles(directory=str(OUT)),name="video-files")
jobs={}
_lock=threading.Lock()
_session=None

class Job(BaseModel):
    prompt:str=Field(min_length=1,max_length=12000)
    engine:str="auto"
    duration:int=5

def get_session():
    global _session
    if _session is None:
        from shared.api import init
        profile=os.getenv("WGP_PROFILE","4")
        attention=os.getenv("WGP_ATTENTION","sdpa")
        _session=init(root=ROOT,output_dir=OUT,cli_args=["--attention",attention,"--profile",profile],console_output=True)
    return _session

def run_job(jid, req):
    try:
        with _lock: jobs[jid]["status"]="starting"
        session=get_session()
        model=os.getenv("WANGP_VIDEO_MODEL_TYPE","ltx2_22B_distilled")
        frames=max(49,min(241,round(req.duration*24/8)*8+1))
        settings={"model_type":model,"prompt":req.prompt,"resolution":os.getenv("WANGP_RESOLUTION","704x384"),"num_inference_steps":int(os.getenv("WANGP_STEPS","8")),"video_length":frames,"duration_seconds":req.duration,"force_fps":24,"guidance_scale":1.0}
        with _lock: jobs[jid]["status"]="generating"; jobs[jid]["model"]=model
        result=session.submit_task(settings).result()
        if not result.success:
            message="; ".join(getattr(e,"message",str(e)) for e in result.errors)
            raise RuntimeError(message or "WanGP generation failed")
        files=list(result.generated_files or [])
        if not files: raise RuntimeError("WanGP completed without an output file")
        source=Path(files[0]); target=OUT/(jid+source.suffix)
        if source.resolve()!=target.resolve(): source.replace(target)
        with _lock: jobs[jid].update(status="completed",video_url=f"/v1/video/files/{target.name}",path=str(target))
    except Exception as exc:
        with _lock: jobs[jid].update(status="error",error=str(exc))

@app.get("/health")
def health():
    return {"ok":True,"backend":"WanGP Python API","model":os.getenv("WANGP_VIDEO_MODEL_TYPE","ltx2_22B_distilled"),"profile":os.getenv("WGP_PROFILE","4")}

@app.post("/v1/video/jobs")
def create_job(req:Job):
    jid=str(uuid.uuid4()); jobs[jid]={"id":jid,"prompt":req.prompt,"engine":req.engine,"duration":req.duration,"status":"queued"}
    threading.Thread(target=run_job,args=(jid,req),daemon=True).start()
    return jobs[jid]

@app.get("/v1/video/jobs/{job_id}")
def get_job(job_id:str):
    return jobs.get(job_id,{"status":"not_found"})
