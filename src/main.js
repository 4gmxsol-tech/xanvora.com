const q=s=>document.querySelector(s);
const file=q('#file'),empty=q('#empty'),picked=q('#picked'),preview=q('#preview'),results=q('#results');
const searchBtn=q('#search'),status=q('#search-status'),research=q('#research'),routes=q('#routes'),copyBtn=q('#copy-report'),intel=q('#intel');
let f=null,evidence={};
q('#choose').onclick=()=>file.click(); q('#drop').classList.add('dropzone'); file.onchange=e=>set(e.target.files[0]);
function set(x){if(!x||!x.type.startsWith('image/'))return;f=x;preview.src=URL.createObjectURL(x);q('#name').textContent=x.name;q('#size').textContent=(x.size/1024/1024).toFixed(2)+' MB';q('#filetype').textContent=x.type;q('#filesize').textContent=(x.size/1024/1024).toFixed(2)+' MB';empty.hidden=true;picked.hidden=false}
q('#clear').onclick=()=>location.reload();
q('#analyze').onclick=async()=>{
 if(!f)return;
 results.hidden=false;
 q('#hash').textContent='computing…';
 try{
  const buf=await f.arrayBuffer();
  let hash='';
  if(window.crypto&&window.crypto.subtle){
   const h=await window.crypto.subtle.digest('SHA-256',buf);
   hash=[...new Uint8Array(h)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }else{
   hash=await fallbackHash(buf);
  }
  const img=await createImageBitmap(f);
  const phash=await perceptualHash(img); evidence={name:f.name,type:f.type,size:f.size,width:img.width,height:img.height,sha256:hash,phash};
  q('#hash').textContent=hash.slice(0,16)+'…';
  q('#step-fingerprint').textContent='complete';
  q('#step-search').textContent='browser ready';
  q('#step-context').textContent='local';
  searchBtn.disabled=false;
  copyBtn.disabled=false;
  results.scrollIntoView({behavior:'smooth'});
 }catch(err){
  console.error(err);
  q('#hash').textContent='unavailable';
  q('#step-fingerprint').textContent='error';
  status.textContent='Local fingerprint failed: '+(err.message||'browser security restriction');
 }
};
async function fallbackHash(buffer){
 const bytes=new Uint8Array(buffer);
 let a=2166136261,b=2246822519,c=3266489917,d=668265263;
 for(let i=0;i<bytes.length;i++){
  const x=bytes[i];
  a=Math.imul(a^x,16777619)>>>0;
  b=Math.imul(b^x,2246822519)>>>0;
  c=Math.imul(c^x,3266489917)>>>0;
  d=Math.imul(d^x,668265263)>>>0;
 }
 return [a,b,c,d].map(v=>v.toString(16).padStart(8,'0')).join('');
}

searchBtn.onclick=async()=>{
 if(!f)return;
 q('#step-search').textContent='prepared';
 q('#step-context').textContent='evidence only';
 status.textContent='Preparing local image intelligence — no filename search.';
 research.hidden=false;
 await buildIntelligence();
 routes.innerHTML='';
 const items=[
  ['Google Lens','Paste the copied image for true visual matching','https://lens.google.com/'],
  ['Yandex Images','Paste/upload the copied image for reverse-image search','https://yandex.com/images/'],
  ['Bing Visual Search','Paste/upload the copied image for visual search','https://www.bing.com/visualsearch'],
  ['TinEye','Paste/upload the copied image for reverse-image search','https://tineye.com/']
 ];
 for(const [name,desc,url] of items){
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='route';
  a.innerHTML='<strong>'+name+'</strong><span>'+desc+'</span>';
  routes.appendChild(a);
 }
};

async function imageAsPngBlob(input){
 const bmp=await createImageBitmap(input);
 const canvas=document.createElement('canvas');
 canvas.width=bmp.width;canvas.height=bmp.height;
 const ctx=canvas.getContext('2d');
 ctx.drawImage(bmp,0,0);
 if(bmp.close)bmp.close();
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG conversion failed')),'image/png'));
}
q('#copy-image').onclick=async()=>{
 try{
  if(!navigator.clipboard||!window.ClipboardItem)throw new Error('Image clipboard is not supported by this browser');
  if(!f)throw new Error('No image selected');
  // Clipboard image support is more reliable with PNG than the source MIME (e.g. JPEG).
  const png=await imageAsPngBlob(f);
  if(!ClipboardItem.supports || ClipboardItem.supports('image/png')){
   await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
  }else{
   throw new Error('PNG clipboard is not supported by this browser');
  }
  q('#copy-status').textContent='Image copied as PNG. Open a visual-search engine and paste (Ctrl+V / long-press Paste).';
 }catch(e){
  q('#copy-status').textContent='Copy failed: '+(e.message||e)+'. Use the engine upload button instead.';
 }
};
copyBtn.onclick=async()=>{const report=['XANVORA — LOCAL EVIDENCE','File: '+evidence.name,'Type: '+evidence.type,'Size: '+(evidence.size/1024/1024).toFixed(2)+' MB','Dimensions: '+evidence.width+' × '+evidence.height,'SHA-256: '+evidence.sha256,'Mode: API-free / browser-local analysis'].join('\n');await navigator.clipboard.writeText(report);status.textContent='Evidence summary copied to clipboard.'};
async function perceptualHash(img){const size=32,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,size,size);const p=ctx.getImageData(0,0,size,size).data;const gray=[];for(let i=0;i<p.length;i+=4)gray.push(.299*p[i]+.587*p[i+1]+.114*p[i+2]);const avg=gray.reduce((a,b)=>a+b,0)/gray.length;return gray.map(v=>v>=avg?'1':'0').join('')}

async function imageFingerprints(img){
 const size=32,c=document.createElement('canvas');c.width=size;c.height=size;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,size,size);
 const p=ctx.getImageData(0,0,size,size).data;
 const g=[];for(let i=0;i<p.length;i+=4)g.push(.299*p[i]+.587*p[i+1]+.114*p[i+2]);
 const avg=g.reduce((a,b)=>a+b,0)/g.length;
 const ahash=g.map(v=>v>=avg?'1':'0').join('');
 let dhash='';for(let y=0;y<32;y++)for(let x=0;x<31;x++)dhash+=g[y*32+x]>g[y*32+x+1]?'1':'0';

 // True pHash: 32×32 grayscale -> 8×8 low-frequency 2D DCT -> median threshold.
 const N=32, K=8, coeff=[];
 for(let u=0;u<K;u++){
  for(let v=0;v<K;v++){
   let sum=0;
   for(let x=0;x<N;x++)for(let y=0;y<N;y++){
    sum+=g[y*N+x]*
      Math.cos(((2*x+1)*u*Math.PI)/(2*N))*
      Math.cos(((2*y+1)*v*Math.PI)/(2*N));
   }
   const au=u===0?Math.sqrt(1/N):Math.sqrt(2/N);
   const av=v===0?Math.sqrt(1/N):Math.sqrt(2/N);
   coeff.push(au*av*sum);
  }
 }
 const dc=coeff[0];
 const ac=coeff.slice(1);
 const sorted=[...ac].sort((a,b)=>a-b);
 const median=sorted[Math.floor(sorted.length/2)];
 const phash=coeff.map((v,i)=>i===0?dc>=median?'1':'0':v>=median?'1':'0').join('');
 return {ahash,dhash,phash};
}
async function buildIntelligence(){
 intel.innerHTML='';
 const rows=[];
 rows.push(['Dimensions',evidence.width+' × '+evidence.height]);
 rows.push(['Aspect ratio',(evidence.width/evidence.height).toFixed(3)]);
 rows.push(['SHA-256',evidence.sha256]); const fps=await imageFingerprints(await createImageBitmap(f)); evidence.ahash=fps.ahash; evidence.dhash=fps.dhash; evidence.phash=fps.phash; rows.push(['aHash',fps.ahash]); rows.push(['dHash',fps.dhash]); rows.push(['pHash',fps.phash]); const fp=q('#fingerprints'); fp.innerHTML='<div class="intel-row"><small>aHash</small><span>'+fps.ahash+'</span></div><div class="intel-row"><small>dHash</small><span>'+fps.dhash+'</span></div><div class="intel-row"><small>pHash</small><span>'+fps.phash+'</span></div>';
 rows.push(['Filename',evidence.name]);
 rows.push(['MIME',evidence.type]);
 rows.push(['Size',(evidence.size/1024).toFixed(1)+' KB']);
 const exif=await readExif(f);
 if(exif) rows.push(['EXIF',exif]);
 let ocr='Not available in this zero-API build.';
 try{ocr=await localOCR(f)}catch(e){}
 evidence.ocr=ocr;
 rows.push(['OCR',ocr||'No text detected']); if(!ocr) rows.push(['Search basis','No text-derived web query. Visual search requires manual upload to a public visual-search service.']);
 for(const [k,v] of rows){
  const d=document.createElement('div');d.className='intel-row';
  d.innerHTML='<small>'+k+'</small><span>'+escapeHtml(String(v))+'</span>';
  intel.appendChild(d);
 }
}
async function localOCR(input){
 if('TextDetector' in window){
  const bmp=await createImageBitmap(input);
  const detector=new TextDetector();
  const blocks=await detector.detect(bmp);
  return blocks.map(x=>x.rawValue||'').filter(Boolean).join(' ').trim();
 }
 return '';
}
async function readExif(input){
 if(!input.arrayBuffer)return '';
 const b=new Uint8Array(await input.arrayBuffer());
 if(b[0]!==255||b[1]!==216)return '';
 for(let i=2;i<b.length-4;){
  if(b[i]!==255){i++;continue}
  const marker=b[i+1],len=(b[i+2]<<8)|b[i+3];
  if(marker===225&&b[i+4]===69&&b[i+5]===120&&b[i+6]===105&&b[i+7]===102){
   return 'EXIF metadata present (details intentionally kept local)';
  }
  if(len<2)break;i+=2+len;
 }
 return 'No EXIF segment detected';
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

const indexFiles=q('#index-files'),indexAdd=q('#index-add'),indexSearch=q('#index-search'),indexClear=q('#index-clear'),indexStatus=q('#index-status'),indexResults=q('#index-results');
let extractor=null,queryEmbedding=null;
async function getExtractor(){if(extractor)return extractor;status.textContent='Loading local vision model (first run may take a while)…';const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');extractor=await mod.pipeline('image-feature-extraction','Xenova/clip-vit-base-patch32',{dtype:'q8'});return extractor}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('xanvora-index',1);r.onupgradeneeded=()=>r.result.createObjectStore('images',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putIndex(item){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('images','readwrite');tx.objectStore('images').add(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function allIndex(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('images','readonly');const r=tx.objectStore('images').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function clearIndex(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('images','readwrite');tx.objectStore('images').clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function vec(t){return Array.from(t.data||t.tolist?.()?.[0]||[])}
function cosine(a,b){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1)}
async function embedFile(file){const p=await getExtractor();const url=URL.createObjectURL(file);try{const out=await p(url,{pool:true});return vec(out)}finally{URL.revokeObjectURL(url)}}
function bitSimilarity(a,b){if(!a||!b||a.length!==b.length)return null;let same=0;for(let i=0;i<a.length;i++)if(a[i]===b[i])same++;return same/a.length}
function combinedSimilarity(item,query){
 const clip=Math.max(0,Math.min(1,cosine(query.embedding,item.embedding)));
 const ph=bitSimilarity(query.phash,item.phash);
 const dh=bitSimilarity(query.dhash,item.dhash);
 const parts=[{v:clip,w:.6},{v:ph,w:.25},{v:dh,w:.15}].filter(x=>x.v!==null&&Number.isFinite(x.v));
 const totalW=parts.reduce((a,x)=>a+x.w,0)||1;
 const score=parts.reduce((a,x)=>a+x.v*x.w,0)/totalW;
 let kind='Visually Similar';
 if(score>=.97 && ph>=.95 && dh>=.95)kind='Near Duplicate';
 else if(ph>=.94 && dh>=.9)kind='Resized / Re-encoded';
 else if(ph>=.86 && dh>=.82)kind='Likely Crop / Transform';
 else if(clip>=.9)kind='Semantically Similar';
 return {score,clip,phash:ph,dhash:dh,kind};
}
function matchClass(score){if(score>=.97)return'near';if(score>=.9)return'high';if(score>=.75)return'mid';return'low'}
function renderRanked(ranked){
 const host=indexResults;
 host.innerHTML='<div class="match-toolbar"><select id="match-filter"><option value="all">All matches</option><option value="near">Near Duplicate</option><option value="high">High similarity</option><option value="mid">Similar</option></select><select id="match-sort"><option value="score">Best match</option><option value="clip">Highest CLIP</option><option value="phash">Highest pHash</option><option value="dhash">Highest dHash</option></select></div><h3>Local visual matches</h3><div id="match-grid" class="match-grid"></div>';
 const grid=host.querySelector('#match-grid');
 const draw=()=>{
  let list=[...ranked];
  const filter=host.querySelector('#match-filter').value,sort=host.querySelector('#match-sort').value;
  if(filter!=='all')list=list.filter(x=>matchClass(x.score)===filter);
  list.sort((a,b)=>b[sort]-a[sort]);
  grid.innerHTML='';
  for(const [i,x] of list.slice(0,24).entries()){
   const card=document.createElement('article');card.className='match-card';
   if(x.blob){const img=document.createElement('img');img.src=URL.createObjectURL(x.blob);img.onload=()=>URL.revokeObjectURL(img.src);img.alt=x.name;card.appendChild(img)}
   const body=document.createElement('div');body.className='match-body';
   body.innerHTML='<strong>#'+(i+1)+' '+escapeHtml(x.name)+'</strong><b>'+ (x.score*100).toFixed(1)+'% Combined</b><span>'+escapeHtml(x.kind)+'</span><small>CLIP '+(x.clip*100).toFixed(1)+'% · pHash '+(x.phash*100).toFixed(1)+'% · dHash '+(x.dhash*100).toFixed(1)+'%</small>';
   card.appendChild(body);grid.appendChild(card);
  }
  if(!list.length)grid.innerHTML='<p>No matches in this filter.</p>';
 };
 host.querySelector('#match-filter').onchange=draw;host.querySelector('#match-sort').onchange=draw;draw();
}
indexAdd.onclick=()=>indexFiles.click();
indexFiles.onchange=async e=>{const files=[...e.target.files];if(!files.length)return;try{indexAdd.disabled=true;for(let i=0;i<files.length;i++){indexStatus.textContent='Indexing '+(i+1)+' / '+files.length+'…';const emb=await embedFile(files[i]);const bmp=await createImageBitmap(files[i]);const fp=await imageFingerprints(bmp);if(bmp.close)bmp.close();await putIndex({name:files[i].name,size:files[i].size,type:files[i].type,blob:files[i],embedding:emb,phash:fp.phash,dhash:fp.dhash,ahash:fp.ahash,created:new Date().toISOString()})}const n=(await allIndex()).length;indexStatus.textContent=n+' reference image'+(n===1?'':'s')+' indexed locally.';indexSearch.disabled=!f}catch(e){console.error(e);indexStatus.textContent='Indexing failed: '+(e.message||e)}finally{indexAdd.disabled=false;indexFiles.value=''}};
indexSearch.onclick=async()=>{if(!f)return;try{indexSearch.disabled=true;indexStatus.textContent='Computing query embedding…';queryEmbedding=await embedFile(f);const qb=await createImageBitmap(f);const qfp=await imageFingerprints(qb);if(qb.close)qb.close();const query={embedding:queryEmbedding,phash:qfp.phash,dhash:qfp.dhash};const items=await allIndex();const ranked=items.map(x=>({...x,...combinedSimilarity(x,query)})).sort((a,b)=>b.score-a.score).slice(0,24);renderRanked(ranked);indexStatus.textContent=ranked.length?'Multi-stage CLIP + pHash + dHash ranking complete.':'Index is empty.'}catch(e){console.error(e);indexStatus.textContent='Local search failed: '+(e.message||e)}finally{indexSearch.disabled=false}};
indexClear.onclick=async()=>{await clearIndex();indexResults.innerHTML='';indexStatus.textContent='Local index cleared.';indexSearch.disabled=true};
(async()=>{try{const n=(await allIndex()).length;if(n){indexStatus.textContent=n+' reference image'+(n===1?'':'s')+' indexed locally.';indexSearch.disabled=!f}}catch(e){}})();
