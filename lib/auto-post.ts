/**
 * X (Twitter) 自動投稿の共通ロジック
 * Web API と Cron から利用される再利用可能な投稿機能
 */

import { TwitterApi } from "twitter-api-v2";
import { getPostedArticleIds, addPostedArticleId } from "./cache.js";
import {
  formatTweetTextEnhanced,
  formatTweetTextEnhancedAsync,
  formatTweetWithReplyAsync,
} from "./auto-post-enhanced.js";
import type { AINewsItem } from "./types.js";

// X の文字数制限
const X_MAX_CHARS = 280;

// 環境変数から設定を取得（時間帯別の動的調整で上書きされる場合あり）
const DEFAULT_MAX_POSTS_PER_RUN = parseInt(
  process.env.AUTO_POST_MAX_PER_RUN || "10",
  10
);
const DELAY_SECONDS = parseInt(
  process.env.AUTO_POST_DELAY_SECONDS || "10",
  10
);
const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";

// ソースの優先度（高い値 = 高い優先度）
const SOURCE_PRIORITY: Record<string, number> = {
  "OpenAI Blog": 10,
  "Anthropic News": 10,
  "Google AI Blog": 9,
  "Google DeepMind Blog": 9,
  "Meta AI Blog": 8,
  "Microsoft Research Blog": 8,
  "NVIDIA Technical Blog": 7,
  "Hugging Face Blog": 7,
  "Mistral AI News": 7,
  "xAI Blog": 7,
  "VentureBeat AI": 6,
  "TechCrunch AI": 6,
  "Stability AI Blog": 5,
  "Databricks Blog": 5,
  "Cohere Blog": 5,
  "AI News": 4,
  "arXiv cs.AI": 3,
  "arXiv cs.LG": 3,
  "Papers with Code": 3,
};

/**
 * JST（日本標準時）での現在時刻を取得
 */
function getJSTHour(): number {
  const now = new Date();
  // UTC + 9 = JST
  const jstOffset = 9 * 60; // 分単位
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
  return jstTime.getUTCHours();
}

/**
 * 時間帯に基づいて最大投稿数を動的に決定
 *
 * ピークタイム（エンゲージメントが高い時間帯）ではより多く投稿し、
 * オフピーク時間帯では投稿数を抑える
 *
 * JST ピークタイム:
 *   - 朝 7:00-9:00（通勤時間帯）
 *   - 昼 12:00-13:00（昼休み）
 *   - 夜 18:00-21:00（帰宅〜夜のリラックスタイム）
 */
function getMaxPostsForCurrentTime(): number {
  // 環境変数で明示的に指定されている場合はそれを尊重
  if (process.env.AUTO_POST_MAX_PER_RUN) {
    return DEFAULT_MAX_POSTS_PER_RUN;
  }

  const jstHour = getJSTHour();

  // ピークタイム: 多めに投稿（5件）
  if (
    (jstHour >= 7 && jstHour < 9) ||   // 朝の通勤時間帯
    (jstHour >= 12 && jstHour < 13) ||  // 昼休み
    (jstHour >= 18 && jstHour < 21)     // 夕方〜夜
  ) {
    return 5;
  }

  // 準ピークタイム: 中程度（3件）
  if (
    (jstHour >= 9 && jstHour < 12) ||   // 午前中
    (jstHour >= 21 && jstHour < 23)     // 夜遅め
  ) {
    return 3;
  }

  // オフピーク: 少なめ（2件）
  return 2;
}

/**
 * 記事を優先度順にソート
 *
 * ソート基準:
 * 1. ソースの優先度（主要AIラボ > メディア > アカデミック）
 * 2. 公開日時（新しい記事を優先）
 */
function prioritizeArticles(articles: AINewsItem[]): AINewsItem[] {
  return [...articles].sort((a, b) => {
    // ソース優先度で比較（高い方が先）
    const priorityA = SOURCE_PRIORITY[a.sourceName] || 1;
    const priorityB = SOURCE_PRIORITY[b.sourceName] || 1;

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // 同じ優先度なら公開日時で比較（新しい方が先）
    const dateA = new Date(a.publishDate).getTime();
    const dateB = new Date(b.publishDate).getTime();
    return dateB - dateA;
  });
}

// A/Bテスト用のバリアント設定
// "simple" = シンプル版（旧フォーマット）
// "enhanced" = 強化版（新フォーマット）
// "random" = ランダム（50/50）
const TWEET_FORMAT_VARIANT = (process.env.TWEET_FORMAT_VARIANT || "enhanced") as
  | "simple"
  | "enhanced"
  | "random";

// スレッド形式（URL-in-Reply）の有効化
// true: メインツイート + リプライ（URLなし → リプライでURL提供）
// false: 従来の1ツイート形式（デフォルト）
const USE_THREAD_FORMAT = process.env.USE_THREAD_FORMAT === "true";

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
 * ソース名からハッシュタグを取得するマッピング
 * auto-post-enhanced.ts の SOURCE_HASHTAG_MAP と同じ定義を使用
 */
const SOURCE_HASHTAG_MAP: Record<string, string> = {
  "VentureBeat AI": "VentureBeat",
  "AI News": "AINews",
  "Google AI Blog": "GoogleAI",
  "TechCrunch AI": "TechCrunch",
  "OpenAI Blog": "OpenAI",
  "Hugging Face Blog": "HuggingFace",
  "arXiv cs.AI": "arXiv",
  "arXiv cs.LG": "arXiv",
  "Papers with Code": "PapersWithCode",
  "Anthropic News": "Anthropic",
  "Meta AI Blog": "MetaAI",
  "Google DeepMind Blog": "DeepMind",
  "Microsoft Research Blog": "Microsoft",
  "NVIDIA Technical Blog": "NVIDIA",
  "Stability AI Blog": "StabilityAI",
  "Mistral AI News": "MistralAI",
  "xAI Blog": "xAI",
  "Databricks Blog": "Databricks",
  "Cohere Blog": "Cohere",
};

/**
 * シンプル版のツイートテキストを生成（旧フォーマット）
 */
function formatTweetTextSimple(item: AINewsItem): string {
  const tags: string[] = ["AI", "GlotNexus"];

  // ソース名からタグを生成（全ソース対応）
  const sourceTag = SOURCE_HASHTAG_MAP[item.sourceName];
  if (sourceTag) {
    tags.push(sourceTag);
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
 * 単一記事を X に投稿（日本語翻訳対応、スレッド形式対応）
 *
 * USE_THREAD_FORMAT=true の場合:
 *   1. メインツイート（フック + 要約 + ハッシュタグ、URLなし）
 *   2. リプライ（URL + 元記事リンク）
 *
 * @returns {tweetId, variant, isDuplicate}
 */
async function postToX(
  client: TwitterApi,
  item: AINewsItem
): Promise<{ tweetId: string; variant: "simple" | "enhanced"; isDuplicate: false } | { isDuplicate: true } | null> {
  try {
    if (USE_THREAD_FORMAT) {
      // スレッド形式: メインツイート + リプライ
      const { main, reply } = await formatTweetWithReplyAsync(item);
      const mainResult = await client.v2.tweet(main);
      const mainTweetId = mainResult.data.id;
      console.log(
        `Posted main tweet: ${mainTweetId} - ${item.title} [thread format]`
      );

      // リプライを投稿
      try {
        const replyResult = await client.v2.reply(reply, mainTweetId);
        console.log(`Posted reply: ${replyResult.data.id} (with URLs)`);
      } catch (replyError) {
        console.error(`Failed to post reply (main tweet still posted):`, replyError);
      }

      return { tweetId: mainTweetId, variant: "enhanced", isDuplicate: false };
    } else {
      // 従来形式: 1ツイート
      const { text, variant } = await formatTweetTextAsync(item);
      const result = await client.v2.tweet(text);
      console.log(
        `Posted to X: ${result.data.id} - ${item.title} [variant: ${variant}]`
      );
      return { tweetId: result.data.id, variant, isDuplicate: false };
    }
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string; code?: number };

    // X API エラーの詳細を取得
    const errorData = err.data as { detail?: string; status?: number } | undefined;
    const statusCode = errorData?.status;
    const errorDetail = errorData?.detail || "";

    if (err.data) {
      console.error(`X API error:`, err.data);
    }

    // 重複コンテンツエラー（403 Forbidden + duplicate content message）の場合
    if (statusCode === 403 && errorDetail.toLowerCase().includes("duplicate")) {
      console.log(`⚠️ Duplicate content detected, marking as posted to skip in future`);
      return { isDuplicate: true };
    }

    console.error(`Failed to post: ${err.message || String(error)}`);
    return null;
  }
}

/**
 * 複数記事を自動投稿
 *
 * 記事はソース優先度と公開日時でソートされ、
 * 時間帯に基づいて投稿数が動的に調整される
 *
 * @param articles - 投稿対象の記事一覧
 * @param maxPosts - 最大投稿件数（デフォルト: 時間帯に基づく動的値）
 * @param delaySeconds - 投稿間隔（秒）（デフォルト: 環境変数から取得、なければ10）
 * @returns 投稿結果の配列
 */
export async function autoPostArticles(
  articles: AINewsItem[],
  maxPosts: number = getMaxPostsForCurrentTime(),
  delaySeconds: number = DELAY_SECONDS
): Promise<PostResult[]> {
  const jstHour = getJSTHour();
  console.log(`Starting auto-post: ${articles.length} articles, max ${maxPosts} posts (JST hour: ${jstHour})`);

  // X API クライアントを初期化
  const client = createXClient();
  if (!client) {
    console.error("X API client not available");
    return [];
  }

  // 投稿済み記事IDを取得
  const postedIds = await getPostedArticleIds();
  console.log(`Found ${postedIds.size} previously posted articles`);

  // 未投稿の記事をフィルタリングし、優先度順にソート
  const unpostedArticles = prioritizeArticles(
    articles.filter((article) => !postedIds.has(article.id))
  ).slice(0, maxPosts);

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

      if (result && !result.isDuplicate) {
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
      } else if (result && result.isDuplicate) {
        // 重複コンテンツ - IDを記録してスキップ（次回の投稿対象から除外）
        await addPostedArticleId(article.id);
        results.push({
          success: false,
          articleId: article.id,
          articleTitle: article.title,
          error: "Duplicate content (skipped)",
        });
        console.log(`⚠️ Skipped: Duplicate content detected`);
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
