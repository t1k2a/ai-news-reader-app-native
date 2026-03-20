# General Audience Outreach (Issue #16) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brand card 画像を一般層向けに改善し（日本語化・デザイン刷新・文字化け修正）、Instagram への自動投稿を追加する。

**Architecture:** フェーズ1で brand card の品質を先に固め（文字化け修正 → 日本語表示 → デザイン刷新）、フェーズ2で Instagram 自動投稿インフラを構築する。X 投稿と Instagram 投稿は独立した cron として実装し、一方の失敗がもう一方に影響しない。

**Tech Stack:** TypeScript, `canvas` (node-canvas), `@vercel/blob`, Meta Content Publishing API, Vercel Cron, Upstash Redis

**Spec:** `docs/superpowers/specs/2026-03-20-general-audience-outreach-design.md`

**Working directory:** `.worktrees/feature/issue-16-general-audience`

---

## File Map

| ファイル | 種別 | 変更内容 |
|---------|------|---------|
| `assets/fonts/NotoSansJP-Bold.ttf` | 新規 | 日本語フォント |
| `assets/fonts/NotoSansJP-Regular.ttf` | 新規 | 日本語フォント |
| `lib/brand-card.ts` | 変更 | フォント登録・日本語表示・デザイン刷新 |
| `lib/auto-post.ts` | 変更 | brand card 生成前の翻訳注入 |
| `lib/cache.ts` | 変更 | Instagram 用 posted_ids 関数追加 |
| `lib/instagram-post.ts` | 新規 | Instagram 投稿ロジック |
| `api/cron/instagram-post.ts` | 新規 | Vercel Cron ハンドラー |
| `vercel.json` | 変更 | fonts includeFiles・Instagram cron 追加 |
| `package.json` | 変更 | `@vercel/blob` 追加 |
| `scripts/test-instagram-post.ts` | 新規 | Instagram 投稿手動テスト用スクリプト |

---

## Task 1: NotoSansJP フォントを追加

**Files:**
- Create: `assets/fonts/NotoSansJP-Bold.ttf`
- Create: `assets/fonts/NotoSansJP-Regular.ttf`

- [ ] **Step 1: `assets/fonts/` ディレクトリを作成**

```bash
mkdir -p assets/fonts
```

- [ ] **Step 2: Google Fonts から NotoSansJP をダウンロード**

```bash
# Bold weight
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf" -o /tmp/NotoSansJP-Variable.ttf

# 静的ファイルが必要な場合は noto-cjk releases から取得:
# https://github.com/googlefonts/noto-cjk/releases
# NotoSansJP-Bold.otf / NotoSansJP-Regular.otf を ttf に変換 or ttf 直接ダウンロード
```

> **注意:** ダウンロードが難しい場合は npm パッケージを使う:
> ```bash
> npm install @fontsource/noto-sans-jp
> # node_modules/@fontsource/noto-sans-jp/files/ 以下に ttf がある
> cp node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff2 /tmp/
> # woff2 → ttf の変換ツールが必要な場合は fonttools を使用
> ```
>
> **最もシンプルな方法:**
> ```bash
> npx tsx -e "
> import { execSync } from 'child_process';
> execSync('npm install --no-save noto-sans-japanese');
> " 2>/dev/null || true
> # または以下の URL から直接取得 (GitHub raw)
> curl -L "https://github.com/opentypejs/fontkit/raw/master/test/fonts/NotoSans/NotoSans-Regular.ttf" -o assets/fonts/NotoSansJP-Regular.ttf
> ```
>
> **実際に動作が確認されている方法:**
> ```bash
> # @fontsource パッケージから woff2 をコピーし canvas で使えるか確認
> # または以下の npm パッケージのフォントを直接参照
> node -e "require.resolve('@fontsource/noto-sans-jp')" && \
>   find node_modules/@fontsource/noto-sans-jp -name "*.ttf" | head -5
> ```

- [ ] **Step 3: フォントファイルが正しく配置されたことを確認**

```bash
ls -la assets/fonts/
# 期待: NotoSansJP-Bold.ttf と NotoSansJP-Regular.ttf が存在、各 3MB 以上
file assets/fonts/NotoSansJP-Bold.ttf
# 期待: TrueType font data
```

- [ ] **Step 4: コミット**

```bash
git add assets/fonts/
git commit -m "feat: NotoSansJP フォントを追加（brand card 文字化け修正用）"
```

---

## Task 2: brand-card.ts — フォント登録を修正

**Files:**
- Modify: `lib/brand-card.ts`

文字化けの根本原因: `registerFont()` が呼ばれていない、かつ Vercel 環境に日本語フォントが存在しない。

- [ ] **Step 1: `lib/brand-card.ts` のファイル先頭に `path` import と `registerFont` 呼び出しを追加**

`lib/brand-card.ts` の先頭（現在の import 直後）に以下を追加:

```ts
import path from "path";

// 日本語フォントを登録（Vercel 環境での文字化けを防ぐ）
try {
  registerFont(
    path.join(process.cwd(), "assets/fonts/NotoSansJP-Bold.ttf"),
    { family: "NotoSansJP", weight: "bold" }
  );
  registerFont(
    path.join(process.cwd(), "assets/fonts/NotoSansJP-Regular.ttf"),
    { family: "NotoSansJP" }
  );
} catch (e) {
  console.warn("NotoSansJP font registration failed (non-fatal):", e);
}
```

- [ ] **Step 2: 全 `ctx.font` 文字列を `NotoSansJP` ファミリーに変更**

現在のコード（`lib/brand-card.ts` の複数箇所）:
```ts
ctx.font = 'bold 24px "IPAGothic", "Noto Sans CJK JP", "Hiragino Sans", sans-serif';
ctx.font = `bold ${titleFontSize}px "IPAGothic", "Noto Sans CJK JP", "Hiragino Sans", sans-serif`;
ctx.font = `${summaryFontSize}px "IPAGothic", "Noto Sans CJK JP", "Hiragino Sans", sans-serif`;
ctx.font = 'bold 22px "IPAGothic", "Noto Sans CJK JP", sans-serif';
ctx.font = '18px "IPAGothic", "Noto Sans CJK JP", sans-serif';
ctx.font = '16px "IPAGothic", "Noto Sans CJK JP", sans-serif';
```

変更後（全箇所を一括変換）:
```ts
ctx.font = 'bold 24px "NotoSansJP"';
ctx.font = `bold ${titleFontSize}px "NotoSansJP"`;
ctx.font = `${summaryFontSize}px "NotoSansJP"`;
ctx.font = 'bold 22px "NotoSansJP"';
ctx.font = '18px "NotoSansJP"';
ctx.font = '16px "NotoSansJP"';
```

- [ ] **Step 3: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 4: brand card 生成テストで日本語が正しく描画されるか確認**

```bash
npx tsx scripts/test-brand-card.ts
# 期待: tmp/brand_card_*.png が生成される
# 生成された PNG を目視確認: 日本語（ひらがな・カタカナ・漢字）が豆腐（□□□）でなく正しく描画されること
```

- [ ] **Step 5: コミット**

```bash
git add lib/brand-card.ts
git commit -m "fix: brand card の日本語フォントを NotoSansJP に変更し文字化けを修正"
```

---

## Task 3: brand-card.ts — 日本語対応デザインに刷新

**Files:**
- Modify: `lib/brand-card.ts`

現状のダーク系デザイン（`#0f0f23` 背景、英語タイトル）を一般層向けに変更する。

- [ ] **Step 1: `generateBrandCard` 関数のデザインを刷新**

以下の変更を行う（現在の実装を完全に置き換え）:

**背景**: ダーク系グラデーション → 白背景に淡いソースカラーのグラデーション
```ts
// 変更前
gradient.addColorStop(0, "#0f0f23");
gradient.addColorStop(0.5, "#1a1a3e");
gradient.addColorStop(1, "#0f0f23");
ctx.fillStyle = gradient;

// 変更後: 白背景 + 淡いグラデーション
const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
gradient.addColorStop(0, "#ffffff");
gradient.addColorStop(1, "#f0f4ff");
ctx.fillStyle = gradient;
```

**テキストカラーを白 → 黒系に変更**:
```ts
// タイトル
ctx.fillStyle = "#1a1a2e";  // 変更前: "#ffffff"

// 要約
ctx.fillStyle = "rgba(30, 30, 50, 0.75)";  // 変更前: "rgba(255, 255, 255, 0.6)"

// フッターテキスト
ctx.fillStyle = "rgba(30, 30, 50, 0.8)";   // 変更前: "rgba(255, 255, 255, 0.8)"
ctx.fillStyle = "rgba(30, 30, 50, 0.5)";   // 変更前: "rgba(255, 255, 255, 0.4)"
ctx.fillStyle = "rgba(30, 30, 50, 0.4)";   // 変更前: "rgba(255, 255, 255, 0.35)"
```

**区切り線の色**:
```ts
ctx.strokeStyle = "rgba(30, 30, 50, 0.12)";  // 変更前: "rgba(255, 255, 255, 0.1)"
```

**グロー装飾円**: 透明度を上げる（白背景では目立ちすぎる）
```ts
ctx.globalAlpha = 0.04;  // 変更前: 0.08
```

**フッターのキャッチコピーを更新**:
```ts
ctx.fillText("海外AIニュースを日本語で", 230, footerY);  // 変更前: "最新AIニュースを日本語で"
```

- [ ] **Step 2: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 3: brand card 生成テストで新デザインを確認**

```bash
npx tsx scripts/test-brand-card.ts
# 期待: tmp/brand_card_*.png が新デザイン（白背景）で生成される
# 目視確認: 白背景、日本語フォント、ソースカラーのアクセント
```

- [ ] **Step 4: コミット**

```bash
git add lib/brand-card.ts
git commit -m "feat: brand card を一般層向けデザインに刷新（白背景・日本語対応）"
```

---

## Task 4: auto-post.ts — brand card 生成前に翻訳を注入

**Files:**
- Modify: `lib/auto-post.ts`

`generateBrandCard(article)` が呼ばれる前に `article.title` / `article.summary` を日本語に翻訳する。

- [ ] **Step 1: `lib/auto-post.ts` に `translateToJapanese` の import を追加**

ファイル先頭の既存 import 群に追加:
```ts
import { translateToJapanese } from "./translation-api.js";
```

- [ ] **Step 2: `autoPostArticles()` の for ループ先頭に翻訳処理を追加**

`lib/auto-post.ts:430` 付近の以下の箇所:
```ts
for (let i = 0; i < unpostedArticles.length; i++) {
  const article = unpostedArticles[i];
  console.log(
    `[${i + 1}/${unpostedArticles.length}] Posting: ${article.title}`
  );
```

`console.log` の後、`postToX` の前に翻訳ブロックを追加:
```ts
  // brand card 用に日本語翻訳（未翻訳の場合のみ）
  if (USE_BRAND_CARD) {
    const isAlreadyJapanese = /[\u3040-\u9fff]/.test(article.title);
    if (!isAlreadyJapanese) {
      try {
        const originalTitle = article.title;
        const originalSummary = article.summary;
        // 先に original を退避してから上書き
        article.originalTitle = article.originalTitle ?? originalTitle;
        article.originalSummary = article.originalSummary ?? originalSummary;
        article.title = await translateToJapanese(originalTitle, 100);
        if (originalSummary) {
          article.summary = await translateToJapanese(originalSummary, 200);
        }
        console.log(`Translated title: ${article.title}`);
      } catch (translateError) {
        console.warn("Translation failed, using original:", translateError);
        // 翻訳失敗は非致命的 — 元のテキストのままで続行
      }
    }
  }
```

- [ ] **Step 3: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 4: コミット**

```bash
git add lib/auto-post.ts
git commit -m "feat: brand card 生成前に記事タイトル・要約を日本語翻訳"
```

---

## Task 5: cache.ts — Instagram 用 posted_ids 関数を追加

**Files:**
- Modify: `lib/cache.ts`

既存の `getPostedArticleIds()` / `addPostedArticleId()` と同じパターンで、Instagram 用の独立したキーを持つ関数を追加する。

- [ ] **Step 1: `lib/cache.ts` の末尾に Instagram 用関数を追加**

```ts
// Instagram 投稿済み記事IDの管理
const IG_POSTED_IDS_KEY = "ig:posted_article_ids";

export async function getInstagramPostedIds(): Promise<Set<string>> {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const ids = await redis.get(IG_POSTED_IDS_KEY) as string[] | null;
      if (ids) {
        return new Set(ids);
      }
    }
    return new Set();
  } catch (error) {
    console.error("Failed to get Instagram posted article IDs:", error);
    return new Set();
  }
}

export async function addInstagramPostedId(articleId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const existingIds = await getInstagramPostedIds();
      existingIds.add(articleId);
      const idsArray = Array.from(existingIds).slice(-1000);
      await redis.set(IG_POSTED_IDS_KEY, idsArray, { ex: POSTED_IDS_TTL });
      console.log(`Added Instagram posted article ID: ${articleId}`);
    }
  } catch (error) {
    console.error("Failed to add Instagram posted article ID:", error);
  }
}
```

- [ ] **Step 2: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 3: コミット**

```bash
git add lib/cache.ts
git commit -m "feat: Instagram 用 posted_ids 関数を cache.ts に追加"
```

---

## Task 6: lib/instagram-post.ts を新規作成

**Files:**
- Create: `lib/instagram-post.ts`

Meta Content Publishing API を使った Instagram 投稿ロジック。

- [ ] **Step 1: `@vercel/blob` パッケージをインストール**

```bash
npm install @vercel/blob
```

- [ ] **Step 2: `lib/instagram-post.ts` を作成**

```ts
/**
 * Instagram 自動投稿モジュール
 *
 * Meta Content Publishing API を使用して Instagram に投稿する。
 * brand card 画像を Vercel Blob に一時アップロードし、
 * その公開 URL を Meta API に渡すことで画像付き投稿を実現する。
 *
 * 投稿フロー:
 * 1. generateBrandCard() で PNG Buffer を生成
 * 2. Vercel Blob に一時アップロード → 公開 URL 取得
 * 3. POST /v{version}/{ig-user-id}/media → creation_id 取得
 * 4. POST /v{version}/{ig-user-id}/media_publish → 投稿完了
 */

import { put, del } from "@vercel/blob";
import { generateBrandCard } from "./brand-card.js";
import { translateToJapanese } from "./translation-api.js";
import { getInstagramPostedIds, addInstagramPostedId } from "./cache.js";
import { prioritizeArticles } from "./auto-post.js";
import type { AINewsItem } from "./types.js";

// Meta Graph API バージョン（実装時に Meta 公式ドキュメントで最新版を確認）
// https://developers.facebook.com/docs/graph-api/changelog
const META_API_VERSION = process.env.META_API_VERSION || "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";
const MAX_POSTS_PER_RUN = parseInt(
  process.env.IG_MAX_POSTS_PER_RUN || "5",
  10
);
const DELAY_SECONDS = parseInt(
  process.env.IG_POST_DELAY_SECONDS || "15",
  10
);

export interface InstagramPostResult {
  success: boolean;
  articleId: string;
  articleTitle: string;
  instagramPostId?: string;
  error?: string;
}

/**
 * キャプションテキストを生成（最大 2,200 文字）
 */
function formatCaption(article: AINewsItem): string {
  const hashtags = "#AI #生成AI #海外のAIニュース #GlotNexus";
  const url = `${APP_BASE_URL}/?article=${encodeURIComponent(article.id)}`;
  const title = article.title;
  const summary = article.summary
    ? article.summary.slice(0, 200)
    : "";

  const parts = [title];
  if (summary) parts.push(`\n${summary}`);
  parts.push(`\n詳細はこちら👉 ${url}`);
  parts.push(`\n${hashtags}`);

  return parts.join("\n");
}

/**
 * 記事タイトル・要約を日本語に翻訳（未翻訳の場合のみ）
 */
async function ensureJapanese(article: AINewsItem): Promise<AINewsItem> {
  const isAlreadyJapanese = /[\u3040-\u9fff]/.test(article.title);
  if (isAlreadyJapanese) return article;

  try {
    const originalTitle = article.title;
    const originalSummary = article.summary;
    return {
      ...article,
      originalTitle: article.originalTitle ?? originalTitle,
      originalSummary: article.originalSummary ?? originalSummary,
      title: await translateToJapanese(originalTitle, 100),
      summary: originalSummary
        ? await translateToJapanese(originalSummary, 200)
        : originalSummary,
    };
  } catch (e) {
    console.warn("Translation failed, using original:", e);
    return article;
  }
}

/**
 * PNG Buffer を Vercel Blob に一時アップロードし、公開 URL を返す
 */
async function uploadImageToBlob(
  buffer: Buffer,
  articleId: string
): Promise<{ url: string; blobUrl: string }> {
  const filename = `brand-cards/ig-${articleId}-${Date.now()}.png`;
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
  });
  return { url: blob.url, blobUrl: blob.url };
}

/**
 * Meta API: Instagram メディアコンテナを作成
 */
async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const url = `${META_API_BASE}/${igUserId}/media`;
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params}`, { method: "POST" });
  const data = await response.json() as { id?: string; error?: { message: string } };

  if (!response.ok || !data.id) {
    throw new Error(
      `Meta API container creation failed: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  return data.id;
}

/**
 * Meta API: メディアコンテナをパブリッシュ
 */
async function publishMediaContainer(
  igUserId: string,
  accessToken: string,
  creationId: string
): Promise<string> {
  const url = `${META_API_BASE}/${igUserId}/media_publish`;
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken,
  });

  const response = await fetch(`${url}?${params}`, { method: "POST" });
  const data = await response.json() as { id?: string; error?: { message: string } };

  if (!response.ok || !data.id) {
    throw new Error(
      `Meta API publish failed: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  return data.id;
}

/**
 * 単一記事を Instagram に投稿
 */
async function postToInstagram(
  article: AINewsItem,
  igUserId: string,
  accessToken: string
): Promise<{ postId: string } | null> {
  let blobUrl: string | null = null;

  try {
    // 1. 日本語翻訳
    const translatedArticle = await ensureJapanese(article);

    // 2. brand card 生成
    const imageBuffer = await generateBrandCard(translatedArticle);

    // 3. Vercel Blob にアップロード
    const { url: imageUrl, blobUrl: uploadedBlobUrl } = await uploadImageToBlob(
      imageBuffer,
      article.id
    );
    blobUrl = uploadedBlobUrl;

    // 4. キャプション生成
    const caption = formatCaption(translatedArticle);

    // 5. メディアコンテナ作成
    const creationId = await createMediaContainer(
      igUserId,
      accessToken,
      imageUrl,
      caption
    );

    // 6. パブリッシュ
    const postId = await publishMediaContainer(igUserId, accessToken, creationId);

    console.log(`Instagram posted: ${postId} - ${translatedArticle.title}`);
    return { postId };
  } catch (error) {
    console.error(`Instagram post failed for ${article.id}:`, error);
    return null;
  } finally {
    // Blob を削除（一時的な公開 URL なので投稿後は不要）
    if (blobUrl) {
      try {
        await del(blobUrl);
      } catch (e) {
        console.warn("Failed to delete blob (non-fatal):", e);
      }
    }
  }
}

/**
 * 複数記事を Instagram に自動投稿
 */
export async function autoPostToInstagram(
  articles: AINewsItem[],
  maxPosts: number = MAX_POSTS_PER_RUN,
  delaySeconds: number = DELAY_SECONDS
): Promise<InstagramPostResult[]> {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!igUserId || !accessToken) {
    console.error("Instagram credentials not configured (INSTAGRAM_BUSINESS_ACCOUNT_ID, META_ACCESS_TOKEN)");
    return [];
  }

  // 投稿済み ID を取得
  const postedIds = await getInstagramPostedIds();
  console.log(`Instagram: ${postedIds.size} previously posted articles`);

  // 未投稿記事をフィルタリング・優先度順ソート
  const unpostedArticles = prioritizeArticles(
    articles.filter((a) => !postedIds.has(a.id))
  ).slice(0, maxPosts);

  if (unpostedArticles.length === 0) {
    console.log("Instagram: no new articles to post");
    return [];
  }

  console.log(`Instagram: posting ${unpostedArticles.length} articles`);

  const results: InstagramPostResult[] = [];

  for (let i = 0; i < unpostedArticles.length; i++) {
    const article = unpostedArticles[i];
    console.log(`[${i + 1}/${unpostedArticles.length}] Instagram posting: ${article.title}`);

    const result = await postToInstagram(article, igUserId, accessToken);

    if (result) {
      await addInstagramPostedId(article.id);
      results.push({
        success: true,
        articleId: article.id,
        articleTitle: article.title,
        instagramPostId: result.postId,
      });
    } else {
      results.push({
        success: false,
        articleId: article.id,
        articleTitle: article.title,
        error: "Post failed",
      });
    }

    if (i < unpostedArticles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`Instagram auto-post completed: ${successCount}/${results.length} posts successful`);

  return results;
}
```

- [ ] **Step 3: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 4: コミット**

```bash
git add lib/instagram-post.ts package.json package-lock.json
git commit -m "feat: Instagram 投稿モジュールを追加（lib/instagram-post.ts）"
```

---

## Task 7: Instagram Cron + vercel.json 更新

**Files:**
- Create: `api/cron/instagram-post.ts`
- Modify: `vercel.json`

- [ ] **Step 1: `api/cron/instagram-post.ts` を作成**

```ts
/**
 * Instagram 自動投稿 Vercel Cron エンドポイント
 *
 * 毎時30分に実行（X の auto-post cron が毎時0分のため30分ずらす）。
 * CRON_SECRET で認証し、RSS フィードから記事を取得して Instagram に投稿する。
 *
 * 必要な環境変数:
 *   META_ACCESS_TOKEN              - Meta Graph API 長期アクセストークン
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  - Instagram Business アカウントID
 *   BLOB_READ_WRITE_TOKEN           - Vercel Blob トークン
 *   CRON_SECRET                    - Cron 認証シークレット（任意）
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds } from "../../lib/rss-feed.js";
import { autoPostToInstagram } from "../../lib/instagram-post.js";

const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // 認証
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error("Unauthorized Instagram cron request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("========================================");
  console.log("Instagram auto-post cron job started");
  console.log("========================================");

  try {
    const articles = await fetchAllFeeds();
    if (!articles || articles.length === 0) {
      console.log("No articles found");
      return res.status(200).json({ message: "No articles found", posted: 0 });
    }

    console.log(`Fetched ${articles.length} articles from RSS feeds`);

    const results = await autoPostToInstagram(articles);
    const successCount = results.filter((r) => r.success).length;

    console.log("========================================");
    console.log(`Instagram auto-post completed: ${successCount}/${results.length} posts successful`);
    console.log("========================================");

    return res.status(200).json({
      message: "Instagram auto-post completed",
      posted: successCount,
      total: results.length,
      results: results.map((r) => ({
        success: r.success,
        articleId: r.articleId,
        articleTitle: r.articleTitle,
        instagramPostId: r.instagramPostId,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Instagram auto-post cron job failed:", error);
    return res.status(500).json({
      error: "Instagram auto-post failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
```

- [ ] **Step 2: `vercel.json` を更新**

現在の `vercel.json` の `functions` セクションと `crons` セクションを以下に変更:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "regions": ["hnd1"],
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/sitemap" },
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/index.ts": {
      "includeFiles": "lib/**,assets/fonts/**",
      "maxDuration": 60
    },
    "api/sitemap.ts": {
      "includeFiles": "lib/**",
      "maxDuration": 60
    },
    "api/cron/auto-post.ts": {
      "includeFiles": "lib/**,assets/fonts/**",
      "maxDuration": 300
    },
    "api/cron/warm-cache.ts": {
      "includeFiles": "lib/**",
      "maxDuration": 120
    },
    "api/cron/instagram-post.ts": {
      "includeFiles": "lib/**,assets/fonts/**",
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/warm-cache",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/auto-post",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/instagram-post",
      "schedule": "30 * * * *"
    }
  ]
}
```

- [ ] **Step 3: TypeScript 型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 4: 手動テスト用スクリプトを作成（`scripts/test-instagram-post.ts`）**

```ts
/**
 * Instagram 投稿手動テストスクリプト（dry-run）
 *
 * 実際には投稿せず、brand card 生成・キャプション生成・Blob アップロードまでを確認する。
 * 使用: npx tsx scripts/test-instagram-post.ts
 */
import { generateBrandCard } from "../lib/brand-card.js";
import type { AINewsItem } from "../lib/types.js";
import * as fs from "fs";
import * as path from "path";

const testArticle: AINewsItem = {
  id: "test-ig-001",
  title: "GPT-5がリリース、推論能力が大幅向上",
  link: "https://openai.com/blog/gpt5",
  summary: "OpenAIは最新モデル GPT-5 を発表。複雑な推論タスクで人間の専門家レベルを達成したと発表した。",
  content: "",
  publishDate: new Date(),
  sourceName: "OpenAI Blog",
  sourceLanguage: "en",
  categories: ["AI"],
};

async function main() {
  const outputDir = path.resolve("tmp");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("🧪 Instagram 投稿テスト（dry-run）");
  console.log("=".repeat(60));

  // brand card 生成
  const buffer = await generateBrandCard(testArticle);
  const outputPath = path.join(outputDir, "instagram_test_card.png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Brand card generated: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  // キャプション確認
  const APP_BASE_URL = "https://glotnexus.jp";
  const caption = [
    testArticle.title,
    `\n${testArticle.summary?.slice(0, 200) ?? ""}`,
    `\n詳細はこちら👉 ${APP_BASE_URL}/?article=${encodeURIComponent(testArticle.id)}`,
    `\n#AI #生成AI #海外のAIニュース #GlotNexus`,
  ].join("\n");

  console.log("\n📝 Caption preview:");
  console.log("-".repeat(60));
  console.log(caption);
  console.log("-".repeat(60));
  console.log(`\n✨ Dry-run complete! Check tmp/instagram_test_card.png`);
}

main().catch(console.error);
```

- [ ] **Step 5: dry-run テストを実行**

```bash
npx tsx scripts/test-instagram-post.ts
# 期待:
# ✅ Brand card generated: tmp/instagram_test_card.png (...)
# 📝 Caption preview: ... （日本語タイトル・要約・URL・ハッシュタグ）
```

- [ ] **Step 6: コミット**

```bash
git add api/cron/instagram-post.ts vercel.json scripts/test-instagram-post.ts
git commit -m "feat: Instagram 自動投稿 Cron を追加（api/cron/instagram-post.ts）"
```

---

## Task 8: 環境変数の設定（デプロイ準備）

**Files:**
- Modify: `.env.vercel`（ローカル参照用）

- [ ] **Step 1: `.env.vercel` に新規環境変数を追記**

```bash
# Instagram / Meta API
META_ACCESS_TOKEN=                # Meta Graph API 長期アクセストークン
INSTAGRAM_BUSINESS_ACCOUNT_ID=   # Instagram Business アカウントID
BLOB_READ_WRITE_TOKEN=            # Vercel Blob トークン（vercel blob create で取得）

# Instagram cron 設定（任意）
IG_MAX_POSTS_PER_RUN=5
IG_POST_DELAY_SECONDS=15
META_API_VERSION=v21.0
```

- [ ] **Step 2: Vercel ダッシュボードで環境変数を設定**

1. https://vercel.com/dashboard → プロジェクトを選択
2. Settings → Environment Variables
3. 以下を追加:
   - `META_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
   - `BLOB_READ_WRITE_TOKEN`

> **Meta アクセストークンの取得手順:**
> 1. https://developers.facebook.com/ → My Apps → Create App → Business type
> 2. Instagram Graph API を追加
> 3. Facebook ページと Instagram Business アカウントを接続
> 4. Graph API Explorer で `instagram_basic,instagram_content_publish` 権限で Long-Lived Token を生成
>
> **Vercel Blob トークンの取得:**
> ```bash
> vercel blob create   # Vercel CLI でプロジェクトに Blob ストレージを追加
> # BLOB_READ_WRITE_TOKEN が .env.local に追加される
> ```

- [ ] **Step 3: コミット（`.env.vercel` は環境変数の値を含まないこと）**

```bash
git add .env.vercel
git commit -m "docs: Instagram/Meta API 環境変数テンプレートを追加"
```

---

## Task 9: 最終確認・PR 作成

- [ ] **Step 1: 全ファイルの型チェック**

```bash
npm run check
# 期待: エラーなし
```

- [ ] **Step 2: brand card の最終目視確認**

```bash
npx tsx scripts/test-brand-card.ts
# tmp/*.png を開いて確認:
# - 日本語が文字化けしていない
# - 白背景（または淡いグラデーション）
# - タイトル・要約・ソースバッジが正しく配置されている
```

- [ ] **Step 3: Instagram dry-run テスト**

```bash
npx tsx scripts/test-instagram-post.ts
# 期待: brand card 生成・キャプション表示が正常
```

- [ ] **Step 4: finishing-a-development-branch スキルを使って PR を作成**

```bash
# superpowers:finishing-a-development-branch スキルを呼び出す
```
