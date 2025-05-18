import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { translateToJapanese } from "./translation-api";
import { fetchAllFeeds, fetchFeed, AINewsItem, AI_CATEGORIES } from "./rss-feed";
import { postNewItems } from "./social-posting";

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

  // ニュースを取得してSNSに投稿するエンドポイント
  app.post('/api/social/post-news', async (req: Request, res: Response) => {
    try {
      if (!process.env.TWITTER_API_KEY || 
          !process.env.TWITTER_API_SECRET || 
          !process.env.TWITTER_ACCESS_TOKEN || 
          !process.env.TWITTER_ACCESS_SECRET) {
        return res.status(400).json({ success: false, message: 'Twitter API認証情報が設定されていません。' });
      }
      
      // 最新のニュースを取得
      const newsItems = await fetchAllFeeds();
      
      // 最新の5件のみを処理対象とする
      const latestItems = newsItems.slice(0, 5);
      
      // SNSに投稿
      const result = await postNewItems(latestItems);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('SNS投稿エラー:', error);
      res.status(500).json({ 
        success: false, 
        message: `投稿処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  });

  // 自動定期実行スケジューラー
  // サーバー起動後に5分ごとにニュース取得と投稿を実行
  let autoPostingInterval: NodeJS.Timeout | null = null;
  
  function startAutoPostingScheduler() {
    if (autoPostingInterval) {
      clearInterval(autoPostingInterval);
    }
    
    // API Keyが設定されている場合のみ自動投稿を有効化
    if (process.env.TWITTER_API_KEY && 
        process.env.TWITTER_API_SECRET && 
        process.env.TWITTER_ACCESS_TOKEN && 
        process.env.TWITTER_ACCESS_SECRET) {
      console.log('自動SNS投稿スケジューラーを開始します（間隔: 5分）');
      
      // 5分ごとに実行
      autoPostingInterval = setInterval(async () => {
        try {
          console.log('定期ニュース取得・SNS投稿を実行します: ' + new Date().toISOString());
          
          // 最新のニュースを取得
          const newsItems = await fetchAllFeeds();
          
          // 最新の3件のみを処理対象とする
          const latestItems = newsItems.slice(0, 3);
          
          // SNSに投稿
          const result = await postNewItems(latestItems);
          
          console.log('自動投稿結果:', {
            totalProcessed: result.totalProcessed,
            newItemsPosted: result.newItemsPosted,
            errors: result.errors
          });
        } catch (error) {
          console.error('自動SNS投稿エラー:', error);
        }
      }, 5 * 60 * 1000); // 5分ごと
    } else {
      console.log('Twitter API認証情報が設定されていないため、自動投稿は無効です');
    }
  }

  // サーバー起動時に自動投稿スケジューラーを開始
  setTimeout(startAutoPostingScheduler, 10000); // サーバー起動10秒後に開始

  const httpServer = createServer(app);

  return httpServer;
}
