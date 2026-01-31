import type { VercelRequest, VercelResponse } from "@vercel/node";

// Dynamic imports for server modules (lazy loading)
let serverModulesLoaded = false;
let translateToJapanese: (text: string) => Promise<string>;
let fetchAllFeeds: () => Promise<any[]>;
let fetchFeed: (feedInfo: any) => Promise<any[]>;
let AI_RSS_FEEDS: any[];

async function loadServerModules() {
  if (serverModulesLoaded) return;

  const translationApi = await import("../server/translation-api");
  const rssFeed = await import("../server/rss-feed");

  translateToJapanese = translationApi.translateToJapanese;
  fetchAllFeeds = rssFeed.fetchAllFeeds;
  fetchFeed = rssFeed.fetchFeed;
  AI_RSS_FEEDS = rssFeed.AI_RSS_FEEDS;

  serverModulesLoaded = true;
}

// CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url?.split("?")[0] || "";

  try {
    // Health check - no external dependencies
    if (path === "/api/health" || path === "/api") {
      return res.json({ status: "ok", timestamp: new Date().toISOString() });
    }

    // Load server modules for other routes
    await loadServerModules();

    // GET /api/news
    if (path === "/api/news" && method === "GET") {
      const category = req.query.category as string;
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam
        ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0))
        : undefined;

      const newsItems = await fetchAllFeeds();
      const filteredNews = category
        ? newsItems.filter((item: any) => item.categories.includes(category))
        : newsItems;
      const limited =
        typeof limit === "number" ? filteredNews.slice(0, limit) : filteredNews;

      return res.json(limited);
    }

    // GET /api/news/item
    if (path === "/api/news/item" && method === "GET") {
      const idParam = req.query.id;
      if (!idParam || typeof idParam !== "string") {
        return res.status(400).json({ message: "記事IDが指定されていません" });
      }

      const decodedId = decodeURIComponent(idParam);
      const newsItems = await fetchAllFeeds();
      const target = newsItems.find((item: any) => item.id === decodedId);

      if (!target) {
        return res.status(404).json({ message: "記事が見つかりませんでした" });
      }

      return res.json(target);
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
      const filteredNews = allNews.filter(
        (item: any) =>
          item.sourceName &&
          item.sourceName.trim().toLowerCase().includes(normalized)
      );

      if (filteredNews.length > 0) {
        const limited =
          typeof limit === "number"
            ? filteredNews.slice(0, limit)
            : filteredNews;
        return res.json(limited);
      }

      const feedInfo = AI_RSS_FEEDS.find(
        (f: any) => f.name.trim().toLowerCase() === normalized
      );
      if (feedInfo) {
        try {
          const fresh = await fetchFeed(feedInfo);
          const limitedFresh =
            typeof limit === "number" ? fresh.slice(0, limit) : fresh;
          return res.json(limitedFresh);
        } catch {
          return res.json([]);
        }
      }

      return res.json([]);
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
      return res.json({ original: text, translated: translatedText });
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
