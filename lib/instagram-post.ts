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
