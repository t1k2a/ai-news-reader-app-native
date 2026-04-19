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
