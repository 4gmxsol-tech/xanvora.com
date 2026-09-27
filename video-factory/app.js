const api=window.XANVORA_VIDEO_API_URL||"";
const $=id=>document.getElementById(id),jobsEl=$("jobs"),state=[];
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function render(){jobsEl.innerHTML=state.length?state.map(j=>'<div class="job"><b>'+esc(j.status)+' · '+esc(j.engine)+'</b><div class="meta">'+esc(j.prompt)+'<br>'+esc(j.id)+' · '+esc(j.duration)+'s</div>'+(j.video_url?'<p><a href="'+j.video_url+'" target="_blank" rel="noopener">Open video</a></p>':"")+'</div>').join(""):'<div class="empty">No jobs yet.</div>'}
$("generate").onclick=async()=>{const prompt=$("prompt").value.trim();if(!prompt){$("notice").textContent="Enter a prompt first.";return}
const job={id:"local-"+Date.now(),prompt,engine:$("engine").value,duration:Number($("duration").value),status:"queued"};state.unshift(job);render();
$("notice").textContent=api?"Submitting job to GPU worker…":"Demo queue active. Configure XANVORA_VIDEO_API_URL to connect a worker.";
if(!api){setTimeout(()=>{job.status="waiting_for_worker";render()},500);return}
try{const r=await fetch(api.replace(/\/$/,"")+"/v1/video/jobs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt,engine:job.engine,duration:job.duration})});if(!r.ok)throw new Error("HTTP "+r.status);Object.assign(job,await r.json());job.status=job.status||"queued";render()}catch(e){job.status="error";render();$("notice").textContent="Worker request failed: "+e.message}};
render();