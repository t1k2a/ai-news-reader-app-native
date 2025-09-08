// キャッシュの名前とバージョン
const CACHE_NAME = "ai-news-reader-v2";

// キャッシュするファイルのリスト
const CACHE_URLS = [
  // HTML はプリキャッシュしない（常に最新を取得するため）
  "/manifest.json",
  "/pwa-icons/icon.svg",
  "/logo.svg",
  "/og-image.svg",
];

// Service Workerのインストール時
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("キャッシュを開きました");
      return cache.addAll(CACHE_URLS);
    })
  );
});

// アクティベーション時（古いキャッシュを削除）
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("古いキャッシュを削除:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// フェッチリクエスト時
self.addEventListener("fetch", (event) => {
  // HTML（ナビゲーション）リクエストはネットワーク優先
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          return fresh;
        } catch (_e) {
          // オフライン時はキャッシュのルートを返す
          return caches.match("/") || caches.match("/index.html");
        }
      })()
    );
    return;
  }

  // 以下のリクエストはキャッシュしない
  if (
    event.request.url.includes("/api/") ||
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.startsWith("chrome://") ||
    event.request.url.startsWith("moz-extension://")
  ) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // キャッシュにヒットした場合はそれを返す
        if (response) {
          return response;
        }

        // キャッシュにない場合はネットワークリクエスト
        return fetch(event.request).then((response) => {
          // 有効なレスポンスでない場合はそのまま返す
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // chrome-extensionなどのサポートされていないスキームを除外
          if (
            event.request.url.startsWith("chrome-extension://") ||
            event.request.url.startsWith("chrome://") ||
            event.request.url.startsWith("moz-extension://")
          ) {
            return response;
          }

          // レスポンスをキャッシュに追加（クローン作成が必要）
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.log("キャッシュへの保存に失敗:", error);
            });

          return response;
        });
      })
      .catch(() => {
        // オフライン時に特定のページをフォールバックとして表示
        if (event.request.url.includes(".html")) {
          return caches.match("/");
        }
      })
  );
});
