/**
 * X (Twitter) 自動投稿の共通ロジック
 * Web API と Cron から利用される再利用可能な投稿機能
 */

import { TwitterApi } from "twitter-api-v2";
import { getPostedArticleIds, addPostedArticleId } from "./cache.js";
import {
  formatTweetTextEnhanced,
  formatTweetTextEnhancedAsync,
} from "./auto-post-enhanced.js";
import type { AINewsItem } from "./types.js";

// X の文字数制限
const X_MAX_CHARS = 280;

// 環境変数から設定を取得
const MAX_POSTS_PER_RUN = parseInt(
  process.env.AUTO_POST_MAX_PER_RUN || "10",
  10
);
const DELAY_SECONDS = parseInt(
  process.env.AUTO_POST_DELAY_SECONDS || "10",
  10
);
const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";

// A/Bテスト用のバリアント設定
// "simple" = シンプル版（旧フォーマット）
// "enhanced" = 強化版（新フォーマット）
// "random" = ランダム（50/50）
const TWEET_FORMAT_VARIANT = (process.env.TWEET_FORMAT_VARIANT || "enhanced") as
  | "simple"
  | "enhanced"
  | "random";

/**
 * 投稿結果の型定義
 */
export interface PostResult {
  success: boolean;
  articleId: string;
  articleTitle: string;
  tweetId?: string;
  error?: string;
  variant?: "simple" | "enhanced"; // A/Bテスト用バリアント情報
}

/**
 * X API クライアントを初期化
 */
export function createXClient(): TwitterApi | null {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.error("X API credentials not configured");
    return null;
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessTokenSecret,
  });
}

/**
 * シンプル版のツイートテキストを生成（旧フォーマット）
 */
function formatTweetTextSimple(item: AINewsItem): string {
  const tags = ["AI", "GlotNexus"];

  // ソース名からタグを生成
  const sourceMap: Record<string, string> = {
    "OpenAI Blog": "OpenAI",
    "Google AI Blog": "Google",
    "Anthropic News": "Anthropic",
    "Hugging Face Blog": "HuggingFace",
    "Meta AI Blog": "Meta",
    "Microsoft Research": "Microsoft",
  };

  if (sourceMap[item.sourceName]) {
    tags.push(sourceMap[item.sourceName]);
  }

  const hashtags = tags.map((tag) => `#${tag}`).join(" ");
  const encodedId = encodeURIComponent(item.id);
  const url = `${APP_BASE_URL}/?article=${encodedId}`;

  // URL の長さ（X では t.co 短縮で 23 文字固定）
  const urlLength = 23;
  const separator = "\n\n";
  const availableChars =
    X_MAX_CHARS - urlLength - hashtags.length - separator.length * 2;

  // タイトルを切り詰め
  let title = item.title;
  if (title.length > availableChars) {
    title = title.slice(0, availableChars - 3) + "...";
  }

  return `${title}${separator}${url}${separator}${hashtags}`;
}

/**
 * ツイート用のテキストを生成（A/Bテスト対応、非同期版）
 *
 * 環境変数 TWEET_FORMAT_VARIANT で制御：
 * - "simple": シンプル版（旧フォーマット）
 * - "enhanced": 強化版（新フォーマット、日本語翻訳対応、デフォルト）
 * - "random": ランダム（50/50）
 *
 * @returns {text, variant}
 */
export async function formatTweetTextAsync(
  item: AINewsItem
): Promise<{ text: string; variant: "simple" | "enhanced" }> {
  let variant: "simple" | "enhanced" = "enhanced";

  // バリアント選択
  if (TWEET_FORMAT_VARIANT === "simple") {
    variant = "simple";
  } else if (TWEET_FORMAT_VARIANT === "enhanced") {
    variant = "enhanced";
  } else if (TWEET_FORMAT_VARIANT === "random") {
    // 50/50 ランダム
    variant = Math.random() < 0.5 ? "simple" : "enhanced";
  }

  // フォーマット生成
  const text =
    variant === "simple"
      ? formatTweetTextSimple(item)
      : await formatTweetTextEnhancedAsync(item); // 非同期版を使用（翻訳対応）

  return { text, variant };
}

/**
 * ツイート用のテキストを生成（A/Bテスト対応、同期版）
 *
 * 注意: この同期版では翻訳機能は使用されません。
 * 翻訳機能を使用する場合は formatTweetTextAsync を使用してください。
 *
 * @returns {text, variant}
 */
export function formatTweetText(
  item: AINewsItem
): { text: string; variant: "simple" | "enhanced" } {
  let variant: "simple" | "enhanced" = "enhanced";

  // バリアント選択
  if (TWEET_FORMAT_VARIANT === "simple") {
    variant = "simple";
  } else if (TWEET_FORMAT_VARIANT === "enhanced") {
    variant = "enhanced";
  } else if (TWEET_FORMAT_VARIANT === "random") {
    // 50/50 ランダム
    variant = Math.random() < 0.5 ? "simple" : "enhanced";
  }

  // フォーマット生成（同期版）
  const text =
    variant === "simple"
      ? formatTweetTextSimple(item)
      : formatTweetTextEnhanced(item); // 同期版（翻訳なし）

  return { text, variant };
}

/**
 * 単一記事を X に投稿（日本語翻訳対応）
 *
 * @returns {tweetId, variant}
 */
async function postToX(
  client: TwitterApi,
  item: AINewsItem
): Promise<{ tweetId: string; variant: "simple" | "enhanced" } | null> {
  try {
    // 非同期版を使用（日本語翻訳対応）
    const { text, variant } = await formatTweetTextAsync(item);
    const result = await client.v2.tweet(text);
    console.log(
      `Posted to X: ${result.data.id} - ${item.title} [variant: ${variant}]`
    );
    return { tweetId: result.data.id, variant };
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    if (err.data) {
      console.error(`X API error:`, err.data);
    }
    console.error(`Failed to post: ${err.message || String(error)}`);
    return null;
  }
}

/**
 * 複数記事を自動投稿
 *
 * @param articles - 投稿対象の記事一覧
 * @param maxPosts - 最大投稿件数（デフォルト: 環境変数から取得、なければ10）
 * @param delaySeconds - 投稿間隔（秒）（デフォルト: 環境変数から取得、なければ10）
 * @returns 投稿結果の配列
 */
export async function autoPostArticles(
  articles: AINewsItem[],
  maxPosts: number = MAX_POSTS_PER_RUN,
  delaySeconds: number = DELAY_SECONDS
): Promise<PostResult[]> {
  console.log(`Starting auto-post: ${articles.length} articles, max ${maxPosts} posts`);

  // X API クライアントを初期化
  const client = createXClient();
  if (!client) {
    console.error("X API client not available");
    return [];
  }

  // 投稿済み記事IDを取得
  const postedIds = await getPostedArticleIds();
  console.log(`Found ${postedIds.size} previously posted articles`);

  // 未投稿の記事をフィルタリング
  const unpostedArticles = articles
    .filter((article) => !postedIds.has(article.id))
    .slice(0, maxPosts);

  if (unpostedArticles.length === 0) {
    console.log("No new articles to post");
    return [];
  }

  console.log(`Posting ${unpostedArticles.length} new articles`);

  // 記事を順次投稿
  const results: PostResult[] = [];

  for (let i = 0; i < unpostedArticles.length; i++) {
    const article = unpostedArticles[i];
    console.log(
      `[${i + 1}/${unpostedArticles.length}] Posting: ${article.title}`
    );

    try {
      const result = await postToX(client, article);

      if (result) {
        // 投稿成功 - IDを記録
        await addPostedArticleId(article.id);
        results.push({
          success: true,
          articleId: article.id,
          articleTitle: article.title,
          tweetId: result.tweetId,
          variant: result.variant,
        });
        console.log(
          `✅ Success: Tweet ID ${result.tweetId} [variant: ${result.variant}]`
        );
      } else {
        // 投稿失敗
        results.push({
          success: false,
          articleId: article.id,
          articleTitle: article.title,
          error: "Post failed",
        });
        console.log(`❌ Failed to post`);
      }
    } catch (error) {
      console.error(`Error posting article ${article.id}:`, error);
      results.push({
        success: false,
        articleId: article.id,
        articleTitle: article.title,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 最後の投稿以外は待機時間を入れる
    if (i < unpostedArticles.length - 1) {
      console.log(`Waiting ${delaySeconds} seconds before next post...`);
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `Auto-post completed: ${successCount}/${results.length} posts successful`
  );

  return results;
}
