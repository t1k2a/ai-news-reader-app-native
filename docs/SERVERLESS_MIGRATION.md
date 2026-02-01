# サーバーレス移行ガイド

このドキュメントでは、本プロジェクトをサーバーレスアーキテクチャ（Vercel Functions / AWS Lambda）に対応させるために必要なリファクタリング作業を説明します。

## 目次

1. [現状の課題](#現状の課題)
2. [リファクタリング作業一覧](#リファクタリング作業一覧)
3. [詳細な実装手順](#詳細な実装手順)
4. [推奨アーキテクチャ](#推奨アーキテクチャ)

---

## 現状の課題

### 1. ファイル構造の問題

現在の構造:
```
project/
├── api/
│   └── index.ts          # Vercel Function (../server を参照)
├── server/
│   ├── rss-feed.ts       # 外部依存が多い
│   ├── translation-api.ts
│   └── routes.ts
└── client/
```

**問題点**: `api/index.ts` から `../server/` への相対インポートがサーバーレス環境でバンドルされない。

### 2. 長時間実行処理

- `fetchAllFeeds()`: 18個のRSSフィードを並列取得（最大8秒×18）
- サーバーレスのタイムアウト制限（Vercel: 10秒、Lambda: 30秒）を超える可能性

### 3. インメモリキャッシュの無効化

```typescript
// server/rss-feed.ts
let cachedNewsItems: AINewsItem[] = [];  // コールドスタートで消失
let lastCacheTime = 0;
```

サーバーレスはリクエストごとに新しいインスタンスが起動する可能性があり、インメモリキャッシュが効かない。

### 4. ESM/CommonJS 互換性

- プロジェクトは `"type": "module"` (ESM)
- 一部の依存関係（rss-parser等）はCommonJS
- サーバーレス環境での動的インポートの挙動が異なる

---

## リファクタリング作業一覧

### Phase 1: コード分離（必須）

| タスク | 優先度 | 工数目安 |
|--------|--------|----------|
| APIルートを独立したファイルに分割 | 高 | 2時間 |
| 共通ロジックを `lib/` に移動 | 高 | 1時間 |
| 相対インポートを絶対パスに変更 | 高 | 30分 |

### Phase 2: キャッシュ戦略の変更（必須）

| タスク | 優先度 | 工数目安 |
|--------|--------|----------|
| Redis/Upstash導入 | 高 | 2時間 |
| または Vercel KV 導入 | 高 | 1時間 |
| キャッシュロジックの書き換え | 中 | 1時間 |

### Phase 3: 非同期処理の最適化（推奨）

| タスク | 優先度 | 工数目安 |
|--------|--------|----------|
| RSSフィード取得をバックグラウンドジョブ化 | 中 | 3時間 |
| Cron Jobによる定期更新 | 中 | 1時間 |
| レスポンスのストリーミング対応 | 低 | 2時間 |

### Phase 4: ビルド設定の調整（必須）

| タスク | 優先度 | 工数目安 |
|--------|--------|----------|
| esbuild/tsupでバンドル設定 | 高 | 1時間 |
| 依存関係の外部化設定 | 中 | 30分 |
| TypeScript設定の統一 | 中 | 30分 |

---

## 詳細な実装手順

### Step 1: ディレクトリ構造の再編成

```
project/
├── api/                      # Vercel Functions
│   ├── news/
│   │   ├── index.ts          # GET /api/news
│   │   ├── item.ts           # GET /api/news/item
│   │   └── source/
│   │       └── [name].ts     # GET /api/news/source/:name
│   └── translate.ts          # POST /api/translate
├── lib/                      # 共通ロジック（api/ と同階層）
│   ├── rss-feed.ts
│   ├── translation-api.ts
│   ├── cache.ts              # 外部キャッシュ抽象化
│   └── types.ts
├── client/
└── vercel.json
```

### Step 2: 各APIエンドポイントの分離

**api/news/index.ts**
```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds } from "../../lib/rss-feed";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const newsItems = await fetchAllFeeds();
    return res.status(200).json(newsItems);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

### Step 3: 外部キャッシュの導入

**lib/cache.ts** (Upstash Redis使用例)
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 5 * 60; // 5分

export async function getCachedNews(): Promise<AINewsItem[] | null> {
  try {
    return await redis.get<AINewsItem[]>("news_cache");
  } catch {
    return null;
  }
}

export async function setCachedNews(items: AINewsItem[]): Promise<void> {
  try {
    await redis.set("news_cache", items, { ex: CACHE_TTL });
  } catch (error) {
    console.error("Cache set error:", error);
  }
}
```

### Step 4: RSSフィード取得の最適化

**lib/rss-feed.ts** (修正版)
```typescript
import { getCachedNews, setCachedNews } from "./cache";

// タイムアウトを短縮（3秒）
const FEED_TIMEOUT = 3000;

// 同時取得数を制限
const CONCURRENT_LIMIT = 5;

export async function fetchAllFeeds(): Promise<AINewsItem[]> {
  // キャッシュチェック
  const cached = await getCachedNews();
  if (cached) {
    return cached;
  }

  // バッチ処理で取得
  const results: AINewsItem[] = [];

  for (let i = 0; i < AI_RSS_FEEDS.length; i += CONCURRENT_LIMIT) {
    const batch = AI_RSS_FEEDS.slice(i, i + CONCURRENT_LIMIT);
    const batchResults = await Promise.allSettled(
      batch.map(feed => fetchFeedWithTimeout(feed, FEED_TIMEOUT))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(...result.value);
      }
    }
  }

  // キャッシュ保存
  await setCachedNews(results);

  return results;
}
```

### Step 5: Cron Jobによるキャッシュ更新

**vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/cron/update-feeds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**api/cron/update-feeds.ts**
```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { refreshCache } from "../../lib/rss-feed";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Vercel Cronからの呼び出しを検証
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await refreshCache();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to refresh cache" });
  }
}
```

### Step 6: vercel.json の設定

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/cron/update-feeds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 推奨アーキテクチャ

### オプション A: Vercel + Upstash Redis

```
[クライアント] → [Vercel Edge/Functions] → [Upstash Redis]
                                              ↑
                                    [Cron Job: 5分毎にRSS取得]
```

**メリット**:
- 設定が簡単
- 無料枠が大きい
- グローバルエッジ配信

**デメリット**:
- 長時間処理に制限あり

### オプション B: Vercel + 外部バックエンド (Render)

```
[クライアント] → [Vercel (静的)] → [Render (API)]
```

**メリット**:
- 既存コードをほぼそのまま使用可能
- 長時間処理OK

**デメリット**:
- 複数サービスの管理が必要
- コールドスタートの遅延

### オプション C: AWS Lambda + DynamoDB/ElastiCache

```
[CloudFront] → [API Gateway] → [Lambda]
                                  ↓
                            [DynamoDB/ElastiCache]
                                  ↑
                          [EventBridge Scheduler]
```

**メリット**:
- スケーラビリティ最高
- 細かい設定が可能

**デメリット**:
- 設定が複雑
- コストが読みにくい

---

## 必要な環境変数（サーバーレス移行後）

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | ○ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | ○ |
| `CRON_SECRET` | Cron Job認証用シークレット | ○ |

---

## 移行チェックリスト

- [ ] ディレクトリ構造を再編成
- [ ] 各APIを独立ファイルに分割
- [ ] 外部キャッシュサービスを設定
- [ ] キャッシュロジックを書き換え
- [ ] Cron Jobを設定
- [ ] タイムアウト設定を調整
- [ ] ローカルで動作確認
- [ ] ステージング環境でテスト
- [ ] 本番デプロイ

---

## 参考リンク

- [Vercel Functions ドキュメント](https://vercel.com/docs/functions)
- [Upstash Redis](https://upstash.com/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
