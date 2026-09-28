(()=>{if(window.__XANVORA_YANDEX_COLLECTOR__)return;window.__XANVORA_YANDEX_COLLECTOR__=true;
const clean=s=>(s||"").replace(/\s+/g," ").trim();
const collect=()=>{
 const seen=new Set(),results=[];
 for(const a of document.querySelectorAll("a[href]")){
  const href=a.href;if(!href||href.startsWith("javascript:")||href.includes("yandex.com")||href.includes("yandex.ru"))continue;
  const img=a.querySelector("img");const title=clean(a.innerText||a.getAttribute("aria-label")||img?.alt||"");
  const image=img?.currentSrc||img?.src||"";
  if(!title&&!image)continue;
  const key=href+"|"+title+"|"+image;if(seen.has(key))continue;seen.add(key);
  results.push({title:title.slice(0,240),url:href,image:image});
  if(results.length>=24)break;
 }
 const hints=[...document.querySelectorAll("input,textarea,[aria-label]")].map(x=>clean(x.value||x.getAttribute("aria-label")||"")).filter(x=>x.length>2&&x.length<120).slice(0,12);
 return {results,queryHints:[...new Set(hints)]};
};
const send=()=>{const data=collect();if(data.results.length)chrome.runtime.sendMessage({type:"XANVORA_YANDEX_RESULTS",...data});};
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(send,1200)};schedule();new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
})();