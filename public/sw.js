// Service Worker - Advanced Caching Strategy
// Phase 24: Offline Caching

// ============================================================
// 캐시 설정
// ============================================================

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// 캐시 제한
const DYNAMIC_CACHE_MAX_ENTRIES = 50;
const IMAGE_CACHE_MAX_ENTRIES = 100;

// 정적 자산 (프리캐시)
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ============================================================
// 설치 이벤트
// ============================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ============================================================
// 활성화 이벤트
// ============================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ============================================================
// Fetch 이벤트
// ============================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 다른 도메인 요청은 무시
  if (url.origin !== location.origin) return;

  // API 요청: Network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 이미지: Cache-first
  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_CACHE_MAX_ENTRIES));
    return;
  }

  // JS/CSS/_next: Stale-while-revalidate
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, DYNAMIC_CACHE_MAX_ENTRIES));
    return;
  }

  // 페이지 네비게이션: Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 기타: Network-first
  event.respondWith(networkFirst(request));
});

// ============================================================
// 캐싱 전략 함수들
// ============================================================

/**
 * Network-first: 네트워크 우선, 실패 시 캐시
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // API 요청의 경우 오프라인 에러 응답
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

/**
 * Network-first with fallback: 네트워크 우선, 실패 시 /offline
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    // 성공 시 캐시에 저장
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 캐시된 페이지 확인
    const cached = await caches.match(request);
    if (cached) return cached;

    // 오프라인 폴백 페이지
    const fallback = await caches.match('/offline');
    if (fallback) return fallback;

    throw error;
  }
}

/**
 * Cache-first: 캐시 우선, 없으면 네트워크
 */
async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      // 캐시 항목 수 제한
      limitCacheEntries(cacheName, maxEntries);
    }
    return response;
  } catch (error) {
    // 이미지 요청 실패 시 투명 픽셀 반환
    return new Response('', { status: 404 });
  }
}

/**
 * Stale-while-revalidate: 캐시 먼저 반환, 백그라운드에서 업데이트
 */
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 백그라운드에서 네트워크 요청
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        limitCacheEntries(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => null);

  // 캐시가 있으면 즉시 반환, 없으면 네트워크 응답 대기
  return cached || fetchPromise;
}

// ============================================================
// 헬퍼 함수들
// ============================================================

/**
 * 이미지 요청인지 확인
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)
  );
}

/**
 * 정적 자산인지 확인 (JS, CSS, fonts)
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/') ||
    /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)
  );
}

/**
 * 캐시 항목 수 제한
 */
async function limitCacheEntries(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // 오래된 항목부터 삭제 (FIFO)
    const deleteCount = keys.length - maxEntries;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ============================================================
// Push Notification (Phase 23)
// ============================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
