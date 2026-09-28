(()=>{if(window.__XANVORA_LIVE_SCREEN__)return;window.__XANVORA_LIVE_SCREEN__=true;
const esc=v=>String(v||"");
const render=(m)=>{
 const box=document.querySelector("#matches");if(!box)return;
 box.hidden=false;box.innerHTML="";
 const head=document.createElement("div");head.className="intel-row";
 const a=document.createElement("small");a.textContent="LIVE PUBLIC SEARCH";
 const b=document.createElement("span");b.textContent=(m.results?.length||0)+" visual matches";
 head.append(a,b);box.appendChild(head);
 const grid=document.createElement("div");grid.className="xanvora-live-grid";
 for(const item of (m.results||[])){
  const card=document.createElement("article");card.className="xanvora-live-card";
  if(item.image){const img=document.createElement("img");img.src=item.image;img.alt=item.title||"Visual match";img.loading="lazy";card.appendChild(img)}
  const body=document.createElement("div");body.className="xanvora-live-card-body";
  const title=document.createElement("strong");title.textContent=item.title||"Visual match";body.appendChild(title);
  const link=document.createElement("a");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open source";body.appendChild(link);
  card.appendChild(body);grid.appendChild(card);
 }
 if(!m.results?.length){const p=document.createElement("p");p.textContent="No structured matches received yet. Use Live View for the visible search page.";box.appendChild(p)}
 else box.appendChild(grid);
 const s=document.querySelector("#search-status");if(s)s.textContent="Live Yandex matches received and rendered as cards.";
};
chrome.runtime.onMessage.addListener(m=>{
 if(m?.type==="XANVORA_LIVE_RESULTS"){render(m);return}
 if(m?.type!=="XANVORA_LIVE_SCREEN")return;
 const box=document.querySelector("#matches");if(!box)return;box.hidden=false;box.innerHTML="";
 const head=document.createElement("div");head.className="intel-row";head.innerHTML="<small>LIVE PUBLIC SEARCH</small><span>Yandex live view</span>";box.appendChild(head);
 const img=document.createElement("img");img.src=m.dataUrl;img.alt="Live reverse-image search result";img.style.cssText="width:100%;max-height:720px;object-fit:contain;border-radius:14px;display:block;margin-top:12px";box.appendChild(img);
 const s=document.querySelector("#search-status");if(s)s.textContent="Live Yandex result view received.";
});
})();