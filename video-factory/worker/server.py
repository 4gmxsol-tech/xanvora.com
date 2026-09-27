import os, uuid
from fastapi import FastAPI
from pydantic import BaseModel, Field

app=FastAPI(title="Xanvora Video Worker")
jobs={}

class Job(BaseModel):
    prompt:str=Field(min_length=1,max_length=12000)
    engine:str="auto"
    duration:int=5

@app.get("/health")
def health():
    return {"ok":True,"model":os.getenv("VIDEO_MODEL","auto"),"gpu_policy":"on-demand"}

@app.post("/v1/video/jobs")
def create_job(req:Job):
    jid=str(uuid.uuid4())
    jobs[jid]={"id":jid,"prompt":req.prompt,"engine":req.engine,"duration":req.duration,"status":"queued"}
    return jobs[jid]

@app.get("/v1/video/jobs/{job_id}")
def get_job(job_id:str):
    return jobs.get(job_id,{"status":"not_found"})

# Plug Wan2GP/LTX inference behind this API.
# Keep model credentials and weights on the worker, never in the browser.