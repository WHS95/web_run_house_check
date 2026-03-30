const CACHE_VERSION = "3";
const CACHE_NAME = `runhouse-v${CACHE_VERSION}`;

// 프리캐시할 정적 자산
const PRECACHE_URLS = [
    "/",
    "/manifest.json",
    "/android-chrome-192x192.png",
    "/android-chrome-512x512.png",
    "/apple-touch-icon.png",
];

// 캐시하지 않을 경로 패턴
const NO_CACHE_PATTERNS = [
    /\/auth\//,
    /\/api\/auth/,
    /supabase/,
    /\/sw\.js$/,
    /firebase/,
];

// 정적 자산 패턴 (cache-first)
const STATIC_ASSET_PATTERNS = [
    /\/_next\/static\//,
    /\/_next\/image\//,
    /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/,
    /\/fonts\//,
];

// API/데이터 패턴 (stale-while-revalidate)
const SWR_PATTERNS = [
    /\/api\/ranking/,
    /\/api\/attendance/,
];

// 설치 이벤트 — 정적 자산 프리캐시
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    // 대기 중인 이전 SW를 즉시 교체
    self.skipWaiting();
});

// 활성화 이벤트 — 오래된 캐시 정리
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    // 즉시 모든 클라이언트 제어
    self.clients.claim();
});

// URL이 패턴 목록에 매칭되는지 확인
function matchesPattern(url, patterns) {
    return patterns.some((pattern) => pattern.test(url));
}

// 페치 이벤트 — 계층화된 캐싱 전략
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = request.url;

    // POST 등 비GET 요청은 캐시하지 않음
    if (request.method !== "GET") return;

    // 캐시 제외 대상
    if (matchesPattern(url, NO_CACHE_PATTERNS)) return;

    // 1) 정적 자산 → Cache First
    if (matchesPattern(url, STATIC_ASSET_PATTERNS)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // 2) API 데이터 → Stale While Revalidate
    if (matchesPattern(url, SWR_PATTERNS)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // 3) 페이지 네비게이션 → Network First (오프라인 폴백)
    if (request.mode === "navigate") {
        event.respondWith(networkFirst(request));
        return;
    }

    // 4) 기타 → Network First
    event.respondWith(networkFirst(request));
});

// Cache First: 캐시 우선, 없으면 네트워크
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response("", { status: 408 });
    }
}

// Network First: 네트워크 우선, 실패 시 캐시
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // 네비게이션 요청의 오프라인 폴백
        if (request.mode === "navigate") {
            const fallback = await caches.match("/");
            if (fallback) return fallback;
        }
        return new Response("오프라인 상태입니다.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
}

// Stale While Revalidate: 캐시 즉시 반환 + 백그라운드 갱신
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // 백그라운드에서 네트워크 갱신
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    // 캐시가 있으면 즉시 반환, 없으면 네트워크 대기
    return cached || fetchPromise;
}
