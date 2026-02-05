import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TwitterApi } from "twitter-api-v2";
import { fetchAllFeeds } from "../../lib/rss-feed.js";
import { getPostedArticleIds, addPostedArticleId } from "../../lib/cache.js";
import type { AINewsItem } from "../../lib/types.js";

// X の文字数制限
const X_MAX_CHARS = 280;

// 1回の実行で投稿する最大件数
const MAX_POSTS_PER_RUN = 3;

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * X API クライアントを初期化
 */
function createXClient(): TwitterApi | null {
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
 * カテゴリからハッシュタグを生成
 */
function generateHashtags(item: AINewsItem): string[] {
  const tags: string[] = ["AI", "GlotNexus"];

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

  return tags;
}

/**
 * ツイート用のテキストを生成（文字数制限対応）
 */
function formatTweetText(item: AINewsItem): string {
  const hashtags = generateHashtags(item).map(tag => `#${tag}`).join(" ");
  const url = item.link;

  // URL の長さ（X では t.co 短縮で 23 文字固定）
  const urlLength = 23;
  const separator = "\n\n";
  const availableChars = X_MAX_CHARS - urlLength - hashtags.length - separator.length * 2;

  // タイトルを切り詰め
  let title = item.title;
  if (title.length > availableChars) {
    title = title.slice(0, availableChars - 3) + "...";
  }

  return `${title}${separator}${url}${separator}${hashtags}`;
}

/**
 * X に投稿
 */
async function postToX(client: TwitterApi, item: AINewsItem): Promise<string | null> {
  try {
    const tweetText = formatTweetText(item);
    const result = await client.v2.tweet(tweetText);
    console.log(`Posted to X: ${result.data.id} - ${item.title}`);
    return result.data.id;
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    if (err.data) {
      console.error(`X API error:`, err.data);
    }
    console.error(`Failed to post: ${err.message || String(error)}`);
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Cron ジョブの認証（Vercel Cron からの呼び出しを確認）
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error("Unauthorized cron request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("Auto-post cron job started");

  try {
    // X API クライアントを初期化
    const client = createXClient();
    if (!client) {
      return res.status(500).json({ error: "X API credentials not configured" });
    }

    // 最新の記事を取得
    const articles = await fetchAllFeeds();
    if (!articles || articles.length === 0) {
      console.log("No articles found");
      return res.status(200).json({ message: "No articles found", posted: 0 });
    }

    // 投稿済み記事IDを取得
    const postedIds = await getPostedArticleIds();
    console.log(`Found ${postedIds.size} previously posted articles`);

    // 未投稿の記事をフィルタリング（最新順で最大 MAX_POSTS_PER_RUN 件）
    const unpostedArticles = articles
      .filter(article => !postedIds.has(article.id))
      .slice(0, MAX_POSTS_PER_RUN);

    if (unpostedArticles.length === 0) {
      console.log("No new articles to post");
      return res.status(200).json({ message: "No new articles to post", posted: 0 });
    }

    console.log(`Found ${unpostedArticles.length} new articles to post`);

    // 記事を投稿
    const results: { id: string; title: string; tweetId: string | null }[] = [];
    for (const article of unpostedArticles) {
      const tweetId = await postToX(client, article);
      if (tweetId) {
        await addPostedArticleId(article.id);
        results.push({ id: article.id, title: article.title, tweetId });
      } else {
        results.push({ id: article.id, title: article.title, tweetId: null });
      }

      // レート制限対策: 投稿間に少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.tweetId !== null).length;
    console.log(`Auto-post completed: ${successCount}/${results.length} posts successful`);

    return res.status(200).json({
      message: "Auto-post completed",
      posted: successCount,
      results,
    });
  } catch (error) {
    console.error("Auto-post cron job failed:", error);
    return res.status(500).json({
      error: "Auto-post failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
