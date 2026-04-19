// Service Worker for Piano App - Network First，确保始终获取最新版本
const CACHE_NAME = 'piano-cache-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装 — 预缓存所有资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✓ 预缓存资源');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 — 清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 — Network First（网络优先，离线时回退缓存）
// 确保用户始终拿到最新版本的 index.html
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 网络成功：更新缓存并返回
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 网络失败：回退缓存
        return caches.match(event.request);
      })
  );
});
