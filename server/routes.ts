import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { translateToJapanese } from "./translation-api";
import { fetchAllFeeds, fetchFeed, AINewsItem, AI_CATEGORIES } from "./rss-feed";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for getting all AI-related news
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      // クエリパラメータからカテゴリを取得
      const category = req.query.category as string;
      
      const newsItems = await fetchAllFeeds();
      
      // カテゴリでフィルタリング（カテゴリが指定されている場合）
      const filteredNews = category 
        ? newsItems.filter(item => item.categories.includes(category))
        : newsItems;
      
      res.json(filteredNews);
    } catch (error) {
      console.error('ニュース取得エラー:', error);
      res.status(500).json({ message: 'ニュースの取得に失敗しました' });
    }
  });
  
  // 特定のフィードからニュースを取得するルート
  app.get('/api/news/source/:sourceName', async (req: Request, res: Response) => {
    const { sourceName } = req.params;
    
    try {
      const allNews = await fetchAllFeeds();
      const filteredNews = allNews.filter(item => 
        item.sourceName.toLowerCase().includes(sourceName.toLowerCase())
      );
      
      if (filteredNews.length === 0) {
        return res.status(404).json({ message: '指定されたソースのニュースが見つかりませんでした' });
      }
      
      res.json(filteredNews);
    } catch (error) {
      console.error(`ソース "${sourceName}" のニュース取得エラー:`, error);
      res.status(500).json({ message: 'ニュースの取得に失敗しました' });
    }
  });
  
  // 翻訳APIのテストルート
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
  
  // サーバーステータスチェック用エンドポイント
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
