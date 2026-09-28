self.onmessage=async e=>{
 const {type,pixels,width,height}=e.data||{};
 if(type!=="fingerprints"||!pixels)return;
 try{
  const g=new Float32Array(width*height);
  for(let i=0,j=0;i<pixels.length;i+=4,j++)g[j]=.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];
  let avg=0;for(const v of g)avg+=v;avg/=g.length;
  let ahash='';for(const v of g)ahash+=v>=avg?'1':'0';
  let dhash='';for(let y=0;y<height;y++)for(let x=0;x<width-1;x++)dhash+=g[y*width+x]>g[y*width+x+1]?'1':'0';
  const N=width,K=Math.min(8,Math.floor(N/2)),coeff=[];
  for(let u=0;u<K;u++)for(let v=0;v<K;v++){
   let sum=0;
   for(let x=0;x<N;x++)for(let y=0;y<N;y++)sum+=g[y*N+x]*Math.cos(((2*x+1)*u*Math.PI)/(2*N))*Math.cos(((2*y+1)*v*Math.PI)/(2*N));
   const au=u===0?Math.sqrt(1/N):Math.sqrt(2/N),av=v===0?Math.sqrt(1/N):Math.sqrt(2/N);
   coeff.push(au*av*sum);
  }
  const ac=coeff.slice(1).sort((a,b)=>a-b),median=ac[Math.floor(ac.length/2)];
  const phash=coeff.map((v,i)=>i===0?(coeff[0]>=median?'1':'0'):(v>=median?'1':'0')).join('');
  self.postMessage({type:"fingerprints",ahash,dhash,phash});
 }catch(err){self.postMessage({type:"error",message:err.message||String(err)})}
};