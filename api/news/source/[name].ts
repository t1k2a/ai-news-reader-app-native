import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds, fetchFeed, AI_RSS_FEEDS } from "../../../lib/rss-feed";

function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sourceName = req.query.name as string;
    if (!sourceName) {
      return res.status(400).json({ message: "ソース名が指定されていません" });
    }

    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam
      ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0))
      : undefined;

    const allNews = await fetchAllFeeds();
    const normalized = decodeURIComponent(sourceName).trim().toLowerCase();
    const filteredNews = allNews.filter((item): boolean => {
      if (!item.sourceName) return false;
      return item.sourceName.trim().toLowerCase().includes(normalized);
    });

    if (filteredNews.length > 0) {
      const limited =
        typeof limit === "number"
          ? filteredNews.slice(0, limit)
          : filteredNews;
      return res.status(200).json(limited);
    }

    const feedInfo = AI_RSS_FEEDS.find((f): boolean => {
      return f.name.trim().toLowerCase() === normalized;
    });
    if (feedInfo) {
      try {
        const fresh = await fetchFeed(feedInfo);
        const limitedFresh =
          typeof limit === "number" ? fresh.slice(0, limit) : fresh;
        return res.status(200).json(limitedFresh);
      } catch {
        return res.status(200).json([]);
      }
    }

    return res.status(200).json([]);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
