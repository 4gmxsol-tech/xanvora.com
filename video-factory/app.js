const $=id=>document.getElementById(id),jobsEl=$("jobs"),state=[];
const savedApi=localStorage.getItem("xanvora_worker_url")||window.XANVORA_VIDEO_API_URL||"",savedToken=localStorage.getItem("xanvora_worker_token")||"",savedHFToken=localStorage.getItem("xanvora_hf_token")||"";
const workerInput=$("workerUrl"),tokenInput=$("workerToken"),hfInput=$("hfSpace"),hfTokenInput=$("hfToken"),workerStatus=$("workerStatus");
if(workerInput) workerInput.value=savedApi;if(tokenInput) tokenInput.value=savedToken;if(hfTokenInput) hfTokenInput.value=savedHFToken;
if(hfInput) hfInput.value=localStorage.getItem("xanvora_hf_space")||window.XANVORA_HF_SPACE||"https://chopperblu-ltx-2-5-demo.hf.space";
function api(){return (workerInput?.value.trim()||window.XANVORA_VIDEO_API_URL||"").replace(/\/$/,"")}
function token(){return tokenInput?.value.trim()||""}
function hfSpace(){return (hfInput?.value.trim()||window.XANVORA_HF_SPACE||"").replace(/\/$/,"")}
function hfToken(){return hfTokenInput?.value.trim()||""}
function headers(){return {"content-type":"application/json","X-Xanvora-Token":token()}}
function hfHeaders(){const h={"content-type":"application/json"};if(hfToken())h.Authorization="Bearer "+hfToken();return h}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function render(){jobsEl.innerHTML=state.length?state.map(j=>'<div class="job"><b>'+esc(j.status)+' · '+esc(j.engine)+'</b><div class="meta">'+esc(j.prompt)+'<br>'+esc(j.id)+' · '+esc(j.duration)+'s</div>'+(j.video_url?'<p><a href="'+j.video_url+'" target="_blank" rel="noopener">Open video</a></p>':"")+(j.error?'<div class="meta">'+esc(j.error)+'</div>':"")+'</div>').join(""):'<div class="empty">No jobs yet.</div>'}
async function poll(job,base){if(!job.id)return;for(let i=0;i<720;i++){await new Promise(r=>setTimeout(r,3000));try{const r=await fetch(base+"/v1/video/jobs/"+encodeURIComponent(job.id),{headers:{"X-Xanvora-Token":token()}});if(!r.ok)continue;const data=await r.json();Object.assign(job,data);if(data.video_url&&!/^https?:\/\//.test(data.video_url))job.video_url=base+data.video_url;render();if(["completed","error"].includes(job.status))return}catch(e){}}}
async function checkWorker(){
 const base=api(),tok=token();
 if(!base||!tok){workerStatus.textContent="Wan2GP Worker: 🔴 not connected — Auto will use Free Cloud";return false}
 try{const r=await fetch(base+"/health",{headers:{"X-Xanvora-Token":tok}});if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();workerStatus.textContent="Wan2GP Worker: 🟢 connected · queue "+(d.queue??0)+" · GPU "+(d.generating?"busy":"ready");return true}catch(e){workerStatus.textContent="Wan2GP Worker: 🔴 offline — Auto will use Free Cloud";return false}
}
async function hfGenerate(job,space){
 localStorage.setItem("xanvora_hf_space",space);if(hfToken())localStorage.setItem("xanvora_hf_token",hfToken());
 job.engine="free-ltx";job.status="queued";render();
 const data=[job.prompt,null,1024,576,job.duration,false,Math.floor(Math.random()*2147483647),true,"conv"];
 const r=await fetch(space+"/gradio_api/call/generate_video",{method:"POST",headers:hfHeaders(),body:JSON.stringify({data})});
 if(!r.ok)throw new Error("Hugging Face API HTTP "+r.status);
 const start=await r.json();if(!start.event_id)throw new Error("Hugging Face did not return an event id");
 const s=await fetch(space+"/gradio_api/call/generate_video/"+encodeURIComponent(start.event_id),{headers:hfHeaders()});if(!s.ok)throw new Error("Hugging Face event HTTP "+s.status);
 const text=await s.text(),lines=text.split("\n");let result=null,error=null;
 for(let i=0;i<lines.length;i++){if(lines[i].startsWith("event: error"))error=lines[i+1]||"generation error";if(lines[i].startsWith("event: complete")){try{result=JSON.parse(lines[i+1]?.replace(/^data:\s*/,"")||"null")}catch{}}}
 if(error){let msg=error;try{const parsed=JSON.parse((error||"").replace(/^data:\s*/,""));msg=parsed.error||parsed.title||parsed.message||error}catch{};if(/quota exceeded|ZeroGPU quota/i.test(msg))msg="ZeroGPU quota exceeded. Auto will need the Wan2GP Worker until the quota resets.";throw new Error(msg)}
 if(!result)throw new Error("No completed video was returned. The Space may be busy.");
 const video=result[0]?.url||result[0]?.path||result[0];if(!video)throw new Error("The Space returned no video URL");
 job.status="completed";job.video_url=/^https?:\/\//.test(video)?video:(video?.url?video.url:space+"/gradio_api/file="+encodeURIComponent(video));render();
}
async function runWorker(job,base,tok,engine){
 localStorage.setItem("xanvora_worker_url",base);localStorage.setItem("xanvora_worker_token",tok);
 $("notice").textContent="Checking GPU worker…";if(!(await checkWorker()))throw new Error("Wan2GP Worker health check failed.");
 job.engine=engine==="auto"?"wan2gp":engine;
 const r=await fetch(base+"/v1/video/jobs",{method:"POST",headers:headers(),body:JSON.stringify({prompt:job.prompt,engine:job.engine,duration:job.duration})});
 if(!r.ok){const t=await r.text();throw new Error("HTTP "+r.status+" "+t)}
 Object.assign(job,await r.json());render();$("notice").textContent="Queued on Wan2GP GPU worker…";poll(job,base);
}
$("generate").onclick=async()=>{
 const prompt=$("prompt").value.trim(),engine=$("engine").value,duration=Number($("duration").value),base=api(),tok=token(),space=hfSpace();
 if(!prompt){$("notice").textContent="Enter a prompt first.";return}
 const job={id:"local-"+Date.now(),prompt,engine,duration,status:"queued"};state.unshift(job);render();
 try{
  if(engine==="free-ltx"){ $("notice").textContent="Sending to Hugging Face ZeroGPU…";await hfGenerate(job,space);$("notice").textContent="Video generated by the free ZeroGPU Space.";return; }
  if(engine==="wan2gp"){if(!base||!tok)throw new Error("Wan2GP requires the Worker URL and Worker Token.");await runWorker(job,base,tok,engine);return;}
  if(engine==="auto"){
   if(base&&tok){$("notice").textContent="Auto: trying Wan2GP GPU worker first…";if(await checkWorker()){await runWorker(job,base,tok,engine);return;}}
   $("notice").textContent="Auto: Wan2GP unavailable, falling back to Free Cloud…";await hfGenerate(job,space);$("notice").textContent="Video generated by the free ZeroGPU fallback.";return;
  }
  if(!base||!tok)throw new Error("Paste the Worker URL and Worker Token, or choose Free Cloud.");
  await runWorker(job,base,tok,engine);
 }catch(e){job.status="error";job.error=e.message;render();$("notice").textContent="Generation failed: "+e.message}
};
$("generateBatch").onclick=async()=>{
 const prompts=$("batchPrompts").value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,100),base=api(),tok=token(),duration=Number($("duration").value);
 if(!prompts.length){$("notice").textContent="Add one prompt per line first.";return}
 if(!base||!tok){$("notice").textContent="Batch generation requires the Wan2GP Worker URL and Token.";return}
 try{
  $("notice").textContent="Checking Wan2GP batch worker…";if(!(await checkWorker()))throw new Error("Wan2GP Worker is offline.");
  const r=await fetch(base+"/v1/video/batch",{method:"POST",headers:headers(),body:JSON.stringify({prompts,engine:"wan2gp",duration})});
  if(!r.ok){const t=await r.text();throw new Error("Batch HTTP "+r.status+" "+t)}
  const data=await r.json();
  for(const j of (data.jobs||[])){state.unshift(j);poll(j,base)}
  render();$("notice").textContent="Batch queued: "+(data.count||prompts.length)+" real video generations.";
 }catch(e){$("notice").textContent="Batch failed: "+e.message}
};
render();checkWorker();