// 外部キャッシュの抽象化層
// Upstash Redis を優先、利用不可の場合はインメモリキャッシュにフォールバック

import type { AINewsItem } from "./types";

const CACHE_KEY = "news_cache";
const CACHE_TTL = 5 * 60; // 5分（秒単位）

// インメモリキャッシュ（フォールバック用）
let memoryCache: AINewsItem[] = [];
let memoryCacheTime = 0;

// Upstash Redis クライアント（遅延初期化）
let redisClient: {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>;
} | null = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("Upstash Redis not configured, using memory cache");
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url, token });
    console.log("Upstash Redis client initialized");
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
    return null;
  }
}

export async function getCachedNews(): Promise<AINewsItem[] | null> {
  try {
    const redis = await getRedisClient();

    if (redis) {
      const cached = await redis.get<AINewsItem[]>(CACHE_KEY);
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
