const VERSION='xanvora-321591cbe2b28da27c997979dc452ca6209f2e92';
const STATIC=[location.pathname,'./style.css','./src/main.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 if(e.request.mode==='navigate'){
  e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));
  return;
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
  const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));return r;
 }).catch(()=>caches.match(e.request)));
});
