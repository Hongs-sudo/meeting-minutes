/* 중등부 주간회의록 — 오프라인 캐시 */
const CACHE = "mathlib-minutes-v6";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a))))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

/* 정상 응답만 저장한다 — 오류 페이지가 캐시에 눌러앉는 것을 막는다 */
function keep(req, res){
  if(res && res.ok && res.type !== "opaque"){
    const copy = res.clone();
    caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
  }
  return res;
}

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;                      /* 동기화 POST 는 건드리지 않음 */
  const url = new URL(req.url);

  /* 이미지 변환 기능 파일 : 제대로 받아둔 것이 있을 때만 캐시에서 꺼내 쓴다 */
  if(url.href.indexOf("html2canvas") > -1){
    e.respondWith(
      caches.match(req).then(hit =>
        (hit && hit.ok) ? hit : fetch(req).then(res=>keep(req,res))
      ).catch(()=>fetch(req))
    );
    return;
  }

  if(url.origin !== location.origin) return;            /* 구글 저장소 요청은 그대로 통과 */

  /* 화면은 네트워크 우선(최신 버전 반영), 실패하면 캐시 */
  e.respondWith(
    fetch(req).then(res=>keep(req,res))
      .catch(()=>caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
