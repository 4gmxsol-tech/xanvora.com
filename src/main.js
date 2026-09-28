const q=s=>document.querySelector(s);
const file=q('#file'),empty=q('#empty'),picked=q('#picked'),preview=q('#preview'),results=q('#results');
const searchBtn=q('#search'),matches=q('#matches'),status=q('#search-status');
let f=null;

q('#choose').onclick=()=>file.click();
q('#drop').classList.add('dropzone');
file.onchange=e=>set(e.target.files[0]);

function set(x){
  if(!x||!x.type.startsWith('image/')) return;
  f=x;
  preview.src=URL.createObjectURL(x);
  q('#name').textContent=x.name;
  q('#size').textContent=(x.size/1024/1024).toFixed(2)+' MB';
  q('#filetype').textContent=x.type;
  q('#filesize').textContent=(x.size/1024/1024).toFixed(2)+' MB';
  empty.hidden=true;picked.hidden=false;
}

q('#clear').onclick=()=>location.reload();

q('#analyze').onclick=async()=>{
  if(!f) return;
  results.hidden=false;
  q('#hash').textContent='computing…';
  const h=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());
  q('#hash').textContent=[...new Uint8Array(h)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,16)+'…';
  searchBtn.disabled=false;
  q('#step-fingerprint').textContent='complete';
  results.scrollIntoView({behavior:'smooth'});
};

searchBtn.onclick=async()=>{
  if(!f) return;
  const endpoint=window.XANVORA_VISUAL_SEARCH_API_URL||'';
  if(!endpoint){
    status.textContent='Visual search is not deployed yet. Configure XANVORA_VISUAL_SEARCH_API_URL after deploying the worker.';
    return;
  }
  searchBtn.disabled=true;
  q('#step-search').textContent='searching…';
  q('#step-context').textContent='collecting…';
  status.textContent='Uploading a temporary search copy and querying public visual matches…';
  try{
    const body=new FormData();
    body.append('image',await prepareImage(f),f.name.replace(/\.[^.]+$/,'')+'.jpg');
    const res=await fetch(endpoint,{method:'POST',body});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Visual search failed');
    q('#step-search').textContent='complete';
    q('#step-context').textContent='complete';
    status.textContent='Search complete. Review the public-source evidence below.';
    renderMatches(data);
  }catch(err){
    q('#step-search').textContent='error';
    q('#step-context').textContent='waiting';
    status.textContent=err.message||'Search connector unavailable.';
  }finally{searchBtn.disabled=false;}
};

async function prepareImage(input){
  const bmp=await createImageBitmap(input);
  const max=1600;
  const scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bmp.width*scale));
  canvas.height=Math.max(1,Math.round(bmp.height*scale));
  canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);
  let quality=.82;
  let blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',quality));
  while(blob&&blob.size>500*1024&&quality>.45){
    quality-=.08;
    blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',quality));
  }
  return blob||input;
}

function renderMatches(data){
  const items=[...(data.exact_matches||[]),...(data.visual_matches||[])].slice(0,20);
  matches.hidden=false;
  matches.innerHTML='';
  if(!items.length){matches.innerHTML='<p>No public matches were returned.</p>';return;}
  const title=document.createElement('h3');
  title.textContent='Public matches';
  matches.appendChild(title);
  for(const item of items){
    const card=document.createElement('article');
    card.className='match';
    const a=document.createElement('a');
    a.href=item.link;a.target='_blank';a.rel='noopener noreferrer';
    a.textContent=item.title||item.source||item.link;
    const meta=document.createElement('small');
    meta.textContent=(item.kind==='exact'?'Exact match':'Visual match')+' · '+(item.source||'unknown source');
    card.append(a,meta);matches.appendChild(card);
  }
}
