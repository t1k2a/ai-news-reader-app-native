import type { VercelRequest, VercelResponse } from "@vercel/node";
import { translateToJapanese } from "../lib/translation-api.js";
import { fetchAllFeeds, fetchFeed, AI_RSS_FEEDS } from "../lib/rss-feed.js";

// CORS headers
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

  const path = req.url?.split("?")[0] || "";
  const method = req.method;

  try {
    // GET /api/news
    if (path === "/api/news" && method === "GET") {
      const category = req.query.category as string;
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam
        ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0))
        : undefined;

      const newsItems = await fetchAllFeeds();
      const filteredNews = category
        ? newsItems.filter((item: any): boolean => {
            return item.categories?.includes(category) === true;
          })
        : newsItems;
      const limited =
        typeof limit === "number" ? filteredNews.slice(0, limit) : filteredNews;

      return res.status(200).json(limited);
    }

    // GET /api/news/item
    if (path === "/api/news/item" && method === "GET") {
      const idParam = req.query.id;
      if (!idParam || typeof idParam !== "string") {
        return res.status(400).json({ message: "記事IDが指定されていません" });
      }

      const decodedId = decodeURIComponent(idParam);
      const newsItems = await fetchAllFeeds();
      const target = newsItems.find((item: any): boolean => {
        return item.id === decodedId;
      });

      if (!target) {
        return res.status(404).json({ message: "記事が見つかりませんでした" });
      }

      return res.status(200).json(target);
    }

    // GET /api/news/source/:sourceName
    const sourceMatch = path.match(/^\/api\/news\/source\/(.+)$/);
    if (sourceMatch && method === "GET") {
      const sourceName = sourceMatch[1];
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam
        ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0))
        : undefined;

      const allNews = await fetchAllFeeds();
      const normalized = decodeURIComponent(sourceName).trim().toLowerCase();
      const filteredNews = allNews.filter((item: any): boolean => {
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

      const feedInfo = AI_RSS_FEEDS.find((f: any): boolean => {
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
    }

    // POST /api/translate
    if (path === "/api/translate" && method === "POST") {
      const { text } = req.body || {};

      if (!text) {
        return res
          .status(400)
          .json({ message: "翻訳するテキストが指定されていません" });
      }

      const translatedText = await translateToJapanese(text);
      return res.status(200).json({ original: text, translated: translatedText });
    }

    // Not found
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
