import type { VercelRequest, VercelResponse } from "@vercel/node";
import { refreshCache } from "../../lib/rss-feed";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Vercel Cronからの呼び出しを検証
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRETが設定されている場合のみ認証チェック
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GETメソッドのみ許可（Vercel CronはGETを使用）
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Cron job started: Refreshing RSS feed cache...");
    const items = await refreshCache();
    console.log(`Cron job completed: ${items.length} items cached`);

    return res.status(200).json({
      success: true,
      itemCount: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return res.status(500).json({
      error: "Failed to refresh cache",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
