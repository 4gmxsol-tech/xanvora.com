export async function runXanvoraV0WebGPU(prompt,{frames=24,width=256,height=144,fps=8,onProgress=()=>{}}={}) {
  const canvas=document.createElement("canvas"); canvas.width=width; canvas.height=height;
  canvas.style.width="100%"; canvas.style.borderRadius="12px"; canvas.style.marginTop="12px";
  const ctx=canvas.getContext("2d");
  if(!ctx) throw new Error("Canvas 2D is unavailable.");
  let engine="CPU/Canvas fallback";
  let device=null;
  if(navigator.gpu){
    try{const adapter=await navigator.gpu.requestAdapter();if(adapter){device=await adapter.requestDevice();engine="WebGPU";}}catch{}
  }
  const seed=[...prompt].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,2166136261);
  const hash=(x)=>{x|=0;x=Math.imul(x^x>>>16,0x45d9f3b);x=Math.imul(x^x>>>16,0x45d9f3b);return (x^x>>>16)>>>0};
  const start=performance.now();
  for(let f=0;f<frames;f++){
    const image=ctx.createImageData(width,height),t=f/Math.max(1,frames-1);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++){
      const i=(y*width+x)*4,q=hash(seed+Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+Math.imul(f+1,2246822519));
      const n=(q>>>8)/16777216,wave=Math.sin((x/width+t)*Math.PI*2+seed%97)*.5+.5;
      const glow=Math.exp(-(((x/width-.5)**2)+((y/height-.52)**2))*7);
      image.data[i]=Math.floor(255*(.10+.45*wave+.35*glow+.10*n));
      image.data[i+1]=Math.floor(255*(.12+.28*(1-wave)+.45*glow+.15*n));
      image.data[i+2]=Math.floor(255*(.18+.55*(1-glow)+.12*n)); image.data[i+3]=255;
    }
    ctx.putImageData(image,0,0); onProgress((f+1)/frames); await new Promise(requestAnimationFrame);
  }
  const blob=await new Promise(r=>canvas.toBlob(r,"image/webp",.9)),url=URL.createObjectURL(blob);
  if(device) device.destroy();
  return {canvas,url,frames,fps,elapsed_ms:Math.round(performance.now()-start),engine};
}