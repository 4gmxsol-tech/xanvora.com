import os, uuid, threading, queue
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
_work_queue=queue.Queue()
_session=None

class Job(BaseModel):
    prompt:str=Field(min_length=1,max_length=12000)
    engine:str="wan2gp"
    duration:int=5

class Batch(BaseModel):
    prompts:list[str]=Field(min_length=1,max_length=100)
    engine:str="wan2gp"
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
        model=os.getenv("WANGP_VIDEO_MODEL_TYPE","ti2v_2_2_fastwan")
        frames=max(49,min(241,round(req.duration*24/8)*8+1))
        settings={"model_type":model,"prompt":req.prompt,"resolution":os.getenv("WANGP_RESOLUTION","832x480"),"num_inference_steps":int(os.getenv("WANGP_STEPS","8")),"video_length":frames,"duration_seconds":req.duration,"force_fps":24,"guidance_scale":1.0}
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

def worker_loop():
    while True:
        jid,req=_work_queue.get()
        try: run_job(jid,req)
        finally: _work_queue.task_done()

threading.Thread(target=worker_loop,daemon=True).start()

@app.get("/health")
def health():
    with _lock:
        queued=sum(1 for j in jobs.values() if j.get("status")=="queued")
        generating=sum(1 for j in jobs.values() if j.get("status") in ("starting","generating"))
    return {"ok":True,"backend":"WanGP Python API","model":os.getenv("WANGP_VIDEO_MODEL_TYPE","ti2v_2_2_fastwan"),"profile":os.getenv("WGP_PROFILE","4"),"queue":queued,"generating":generating}

@app.post("/v1/video/jobs")
def create_job(req:Job):
    jid=str(uuid.uuid4()); jobs[jid]={"id":jid,"prompt":req.prompt,"engine":req.engine,"duration":req.duration,"status":"queued"}
    _work_queue.put((jid,req))
    return jobs[jid]

@app.post("/v1/video/batch")
def create_batch(req:Batch):
    created=[]
    for prompt in req.prompts:
        item=Job(prompt=prompt,engine=req.engine,duration=req.duration)
        jid=str(uuid.uuid4()); jobs[jid]={"id":jid,"prompt":prompt,"engine":req.engine,"duration":req.duration,"status":"queued","batch":True}
        _work_queue.put((jid,item)); created.append(jobs[jid])
    return {"count":len(created),"jobs":created}

@app.get("/v1/video/jobs/{job_id}")
def get_job(job_id:str):
    return jobs.get(job_id,{"status":"not_found"})
