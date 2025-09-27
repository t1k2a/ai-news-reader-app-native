import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { translateToJapanese } from "./translation-api";
import { fetchAllFeeds, fetchFeed, AI_RSS_FEEDS } from "./rss-feed";

export async function registerRoutes(app: Express): Promise<Server> {
  // すべてのAIニュースを取得
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const limitParam = req.query.limit as string | undefined;
      const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0)) : undefined;
      
      const newsItems = await fetchAllFeeds();
      const filteredNews = category
        ? newsItems.filter(item => item.categories.includes(category))
        : newsItems;
      const limited = typeof limit === 'number' ? filteredNews.slice(0, limit) : filteredNews;
      
      res.json(limited);
    } catch (error) {
      console.error('ニュース取得エラー:', error);
      res.status(500).json({ message: 'ニュースの取得に失敗しました' });
    }
  });
  
  // ソース別のニュース取得
  app.get('/api/news/source/:sourceName', async (req: Request, res: Response) => {
    const { sourceName } = req.params;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 0)) : undefined;
    
    try {
      const allNews = await fetchAllFeeds();
      const normalized = decodeURIComponent(sourceName).trim().toLowerCase();
      const filteredNews = allNews.filter(item =>
        item.sourceName && item.sourceName.trim().toLowerCase().includes(normalized)
      );

      if (filteredNews.length > 0) {
        const limited = typeof limit === 'number' ? filteredNews.slice(0, limit) : filteredNews;
        return res.json(limited);
      }

      const feedInfo = AI_RSS_FEEDS.find(f => f.name.trim().toLowerCase() === normalized);
      if (feedInfo) {
        try {
          const fresh = await fetchFeed(feedInfo);
          const limitedFresh = typeof limit === 'number' ? fresh.slice(0, limit) : fresh;
          return res.json(limitedFresh);
        } catch (_e) {
          return res.json([]);
        }
      }

      return res.json([]);
    } catch (error) {
      console.error(`ソース "${sourceName}" のニュース取得エラー:`, error);
      res.status(500).json({ message: 'ニュースの取得に失敗しました' });
    }
  });
  
  // 翻訳API
  app.post('/api/translate', async (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: '翻訳するテキストが指定されていません' });
    }
    
    try {
      const translatedText = await translateToJapanese(text);
      res.json({ original: text, translated: translatedText });
    } catch (error) {
      console.error('翻訳エラー:', error);
      res.status(500).json({ message: '翻訳に失敗しました' });
    }
  });
  
  // ヘルスチェック
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
