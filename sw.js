const C='hires-v7';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const ok=u.origin===location.origin||/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!ok)return;
  const page=r.mode==='navigate'||/\.html?$/.test(u.pathname)||u.pathname.endsWith('/');
  if(page){
    /* HTML: сначала сеть, чтобы обновления приходили сразу; офлайн — из кэша */
    e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(h=>{
    const n=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>h);
    return h||n;
  }));
});
