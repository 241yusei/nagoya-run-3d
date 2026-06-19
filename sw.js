// ナゴヤ人間RUN 3D — Service Worker（HTMLはネット優先で常に最新／重いアセットはキャッシュ優先で高速＆オフライン対応）
const V = 'nagoya-run-v3';
const CORE = [
  './', './index.html',
  './libs/three.min.js', './libs/GLTFLoader.js',
  './character/nagoya_opt.glb', './character/star_anim_opt.glb', './character/knockdown_anim.glb',
  './ui/hero_head.png', './ui/hero_full.png', './ui/road.jpg',
  './manifest.json', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isHTML) {
    // HTMLはネットワーク優先（更新を即反映）。オフライン時のみキャッシュ
    e.respondWith(
      fetch(e.request).then(resp => { const cc = resp.clone(); caches.open(V).then(c => c.put(e.request, cc)); return resp; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // それ以外（GLB/音/画像/JS）はキャッシュ優先＋ランタイムキャッシュ
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const cc = resp.clone();
        caches.open(V).then(c => c.put(e.request, cc));
      }
      return resp;
    }).catch(() => r))
  );
});
