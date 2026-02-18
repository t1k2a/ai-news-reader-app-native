/**
 * @deprecated このファイルは Vercel Cron 専用エンドポイントです。
 * 手動実行・テストには scripts/auto-post/rss-auto-post.ts を使用してください。
 * 共通ロジックは lib/auto-post.ts にあります。
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds } from "../../lib/rss-feed.js";
import { autoPostArticles } from "../../lib/auto-post.js";

// Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

// 環境変数から設定を取得
const MAX_POSTS_PER_RUN = parseInt(
  process.env.AUTO_POST_MAX_PER_RUN || "10",
  10
);
const DELAY_SECONDS = parseInt(
  process.env.AUTO_POST_DELAY_SECONDS || "10",
  10
);

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

  console.log("========================================");
  console.log("Auto-post cron job started");
  console.log(`Max posts: ${MAX_POSTS_PER_RUN}, Delay: ${DELAY_SECONDS}s`);
  console.log("========================================");

  try {
    // 最新の記事を取得
    const articles = await fetchAllFeeds();
    if (!articles || articles.length === 0) {
      console.log("No articles found");
      return res.status(200).json({ message: "No articles found", posted: 0 });
    }

    console.log(`Fetched ${articles.length} articles from RSS feeds`);

    // 自動投稿を実行（共通ロジックを使用）
    const results = await autoPostArticles(
      articles,
      MAX_POSTS_PER_RUN,
      DELAY_SECONDS
    );

    const successCount = results.filter((r) => r.success).length;

    console.log("========================================");
    console.log(`Auto-post completed: ${successCount}/${results.length} posts successful`);
    console.log("========================================");

    return res.status(200).json({
      message: "Auto-post completed",
      posted: successCount,
      total: results.length,
      results: results.map((r) => ({
        success: r.success,
        articleId: r.articleId,
        articleTitle: r.articleTitle,
        tweetId: r.tweetId,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Auto-post cron job failed:", error);
    return res.status(500).json({
      error: "Auto-post failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
