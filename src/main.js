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
  evidence={name:f.name,type:f.type,size:f.size,width:img.width,height:img.height,sha256:hash};
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

searchBtn.onclick=async()=>{if(!f)return;q('#step-search').textContent='prepared';q('#step-context').textContent='ready';status.textContent='Building local intelligence — no API required.';research.hidden=false;await buildIntelligence();routes.innerHTML='';const text=encodeURIComponent((evidence.ocr||evidence.name||'image').slice(0,500));const items=[['Google Images','Search image-related web results','https://www.google.com/search?tbm=isch&q='+text],['Bing Images','Search visual/image results','https://www.bing.com/images/search?q='+text],['Google Lens','Open the public Lens entry point','https://lens.google.com/'],['TinEye','Open reverse-image search','https://tineye.com/']];for(const [name,desc,url] of items){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='route';a.innerHTML='<strong>'+name+'</strong><span>'+desc+'</span>';routes.appendChild(a)}};
copyBtn.onclick=async()=>{const report=['XANVORA — LOCAL EVIDENCE','File: '+evidence.name,'Type: '+evidence.type,'Size: '+(evidence.size/1024/1024).toFixed(2)+' MB','Dimensions: '+evidence.width+' × '+evidence.height,'SHA-256: '+evidence.sha256,'Mode: API-free / browser-local analysis'].join('\n');await navigator.clipboard.writeText(report);status.textContent='Evidence summary copied to clipboard.'};
async function buildIntelligence(){
 intel.innerHTML='';
 const rows=[];
 rows.push(['Dimensions',evidence.width+' × '+evidence.height]);
 rows.push(['Aspect ratio',(evidence.width/evidence.height).toFixed(3)]);
 rows.push(['SHA-256',evidence.sha256]);
 rows.push(['Filename',evidence.name]);
 rows.push(['MIME',evidence.type]);
 rows.push(['Size',(evidence.size/1024).toFixed(1)+' KB']);
 const exif=await readExif(f);
 if(exif) rows.push(['EXIF',exif]);
 let ocr='Not available in this zero-API build.';
 try{ocr=await localOCR(f)}catch(e){}
 evidence.ocr=ocr;
 rows.push(['OCR',ocr||'No text detected']);
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
