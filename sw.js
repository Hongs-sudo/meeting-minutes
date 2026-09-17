/* 중등부 주간회의록 — 오프라인 캐시 */
const CACHE = "mathlib-minutes-v5";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;                      /* 동기화 POST 는 건드리지 않음 */
  const url = new URL(req.url);
  /* 이미지 변환 라이브러리는 한 번 받아두고 다음부터는 오프라인에서도 사용 */
  if(url.href.indexOf("html2canvas") > -1){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      return res;
    })));
    return;
  }
  if(url.origin !== location.origin) return;            /* 구글 저장소 요청은 그대로 통과 */

  /* 화면은 네트워크 우선(최신 버전 반영), 실패하면 캐시 */
  e.respondWith(
    fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(req).then(r=>r || caches.match("./index.html")))
  );
});
