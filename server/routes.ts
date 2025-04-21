import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getAllAITweets, getUserTweets } from "./twitter-api";
import { translateToJapanese, batchTranslateToJapanese } from "./translation-api";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for getting all AI-related tweets
  app.get('/api/tweets', async (req: Request, res: Response) => {
    try {
      const tweets = await getAllAITweets();
      
      // テキストが英語の場合、翻訳する
      const tweetTexts = tweets.map(tweet => tweet.text);
      const translatedTexts = await batchTranslateToJapanese(tweetTexts);
      
      // 翻訳したテキストで元のツイートを更新
      const tweetsWithTranslation = tweets.map((tweet, index) => ({
        ...tweet,
        original_text: tweet.text,
        text: translatedTexts[index] || tweet.text
      }));
      
      res.json(tweetsWithTranslation);
    } catch (error) {
      console.error('ツイート取得エラー:', error);
      res.status(500).json({ message: 'ツイートの取得に失敗しました' });
    }
  });
  
  // 特定のアカウントのツイートを取得するルート
  app.get('/api/tweets/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
      const tweetData = await getUserTweets(userId);
      
      if (!tweetData || !tweetData.data) {
        return res.status(404).json({ message: 'ツイートが見つかりませんでした' });
      }
      
      const tweets = tweetData.data;
      
      // テキストが英語の場合、翻訳する
      const tweetTexts = tweets.map(tweet => tweet.text);
      const translatedTexts = await batchTranslateToJapanese(tweetTexts);
      
      // 翻訳したテキストで元のツイートを更新
      const tweetsWithTranslation = tweets.map((tweet, index) => ({
        ...tweet,
        original_text: tweet.text,
        text: translatedTexts[index] || tweet.text
      }));
      
      res.json(tweetsWithTranslation);
    } catch (error) {
      console.error(`ユーザーID ${userId} のツイート取得エラー:`, error);
      res.status(500).json({ message: 'ツイートの取得に失敗しました' });
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

  const httpServer = createServer(app);

  return httpServer;
}
