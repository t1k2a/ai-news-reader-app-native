import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds } from "../../lib/rss-feed";

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
    const category = req.query.category as string;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam
      ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0))
      : undefined;

    const newsItems = await fetchAllFeeds();
    const filteredNews = category
      ? newsItems.filter((item): boolean => {
          return item.categories?.includes(category) === true;
        })
      : newsItems;
    const limited =
      typeof limit === "number" ? filteredNews.slice(0, limit) : filteredNews;

    return res.status(200).json(limited);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
