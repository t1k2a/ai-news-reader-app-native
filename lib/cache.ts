// 外部キャッシュの抽象化層
// Upstash Redis を優先、利用不可の場合はインメモリキャッシュにフォールバック

import type { AINewsItem } from "./types.js";

const CACHE_KEY = "news_cache";
const CACHE_TTL = 5 * 60; // 5分（秒単位）

// インメモリキャッシュ（フォールバック用）
let memoryCache: AINewsItem[] = [];
let memoryCacheTime = 0;

// Upstash Redis クライアント（遅延初期化）
// null: 未初期化, false: 初期化失敗, Redis: 初期化成功
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  // 初期化に失敗した場合は null を返すフラグ
  if (redisClient === false) return null;

  // 開発環境では常にメモリキャッシュを使用（Redisセットアップ不要）
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: using memory cache (Redis disabled)");
    redisClient = false; // 再試行を防ぐ
    return null;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("Upstash Redis not configured, using memory cache");
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url, token });
    console.log("Upstash Redis client initialized successfully");

    // 接続テスト
    await redisClient.ping();
    console.log("Upstash Redis connection verified");

    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
    console.error("Stack trace:", (error as Error).stack);
    // 初期化失敗をマーク（再試行を防ぐ）
    redisClient = false;
    return null;
  }
}

export async function getCachedNews(): Promise<AINewsItem[] | null> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      const cached = await redis.get(CACHE_KEY) as AINewsItem[] | null;
      if (cached) {
        console.log("Cache hit (Redis)");
        return cached;
      }
    } else {
      // インメモリキャッシュにフォールバック
      const now = Date.now();
      if (memoryCache.length > 0 && now - memoryCacheTime < CACHE_TTL * 1000) {
        console.log("Cache hit (memory)");
        return memoryCache;
      }
    }

    return null;
  } catch (error) {
    console.error("Cache get error:", error);
    // エラー時もインメモリキャッシュを試す
    const now = Date.now();
    if (memoryCache.length > 0 && now - memoryCacheTime < CACHE_TTL * 1000) {
      console.log("Cache hit (memory fallback after Redis error)");
      return memoryCache;
    }
    return null;
  }
}

export async function setCachedNews(items: AINewsItem[]): Promise<void> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.set(CACHE_KEY, items, { ex: CACHE_TTL });
      console.log("Cache set (Redis)");
    }

    // インメモリキャッシュも常に更新（フォールバック用）
    memoryCache = items;
    memoryCacheTime = Date.now();
    console.log("Cache set (memory)");
  } catch (error) {
    console.error("Cache set error:", error);
    // エラー時もインメモリキャッシュは更新
    memoryCache = items;
    memoryCacheTime = Date.now();
  }
}

export async function invalidateCache(): Promise<void> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      await redis.set(CACHE_KEY, [], { ex: 1 }); // 1秒で期限切れ
    }

    memoryCache = [];
    memoryCacheTime = 0;
    console.log("Cache invalidated");
  } catch (error) {
    console.error("Cache invalidation error:", error);
    memoryCache = [];
    memoryCacheTime = 0;
  }
}

// 投稿済み記事IDの管理
const POSTED_IDS_KEY = "posted_article_ids";
const POSTED_IDS_TTL = 30 * 24 * 60 * 60; // 30日間保持

export async function getPostedArticleIds(): Promise<Set<string>> {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const ids = await redis.get(POSTED_IDS_KEY) as string[] | null;
      if (ids) {
        return new Set(ids);
      }
    }
    return new Set();
  } catch (error) {
    console.error("Failed to get posted article IDs:", error);
    return new Set();
  }
}

export async function addPostedArticleId(articleId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const existingIds = await getPostedArticleIds();
      existingIds.add(articleId);
      // 最新1000件のみ保持
      const idsArray = Array.from(existingIds).slice(-1000);
      await redis.set(POSTED_IDS_KEY, idsArray, { ex: POSTED_IDS_TTL });
      console.log(`Added posted article ID: ${articleId}`);
    }
  } catch (error) {
    console.error("Failed to add posted article ID:", error);
  }
}
