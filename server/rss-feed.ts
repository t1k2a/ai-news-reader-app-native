import Parser from 'rss-parser';
import { translateToJapanese, summarizeText } from './translation-api';

// RSSパーサーの初期化
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  },
});

// AI関連のRSSフィードのURL
const AI_RSS_FEEDS = [
  // 英語のRSSフィード
  { 
    url: 'https://venturebeat.com/category/ai/feed/',
    name: 'VentureBeat AI',
    language: 'en'
  },
  { 
    url: 'https://www.artificialintelligence-news.com/feed/',
    name: 'AI News',
    language: 'en'
  },

  
  // 日本語のRSSフィード
  { 
    url: 'https://ai-trend.jp/feed/',
    name: 'AI-TREND',
    language: 'ja'
  },
  {
    url: 'https://ainow.ai/feed/',
    name: 'AINow',
    language: 'ja'
  }
];

export interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  publishDate: Date;
  sourceName: string;
  sourceLanguage: string;
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
}

/**
 * 特定のRSSフィードから記事を取得する
 */
export async function fetchFeed(feedInfo: { url: string, name: string, language: string }): Promise<AINewsItem[]> {
  try {
    const feed = await parser.parseURL(feedInfo.url);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`${feedInfo.name}からの記事はありませんでした`);
      return [];
    }
    
    const newsItems: AINewsItem[] = [];
    
    for (const item of feed.items.slice(0, 10)) { // 最新10件に制限
      const content = item.content || item.contentSnippet || '';
      
      // 要約作成（最大140文字）
      const summary = summarizeText(content);
      
      let translatedTitle = item.title || '';
      let translatedContent = content;
      let translatedSummary = summary;
      
      // 英語の場合は翻訳する
      if (feedInfo.language === 'en') {
        try {
          translatedTitle = await translateToJapanese(item.title || '');
          // 要約した内容だけを翻訳（効率化のため）
          translatedSummary = await translateToJapanese(summary);
          
          // 記事URLからユニークIDを生成
          const id = item.guid || item.link || `${feedInfo.name}-${Date.now()}-${Math.random()}`;
          
          newsItems.push({
            id,
            title: translatedTitle,
            link: item.link || '',
            content: translatedContent,
            summary: translatedSummary,
            publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            sourceName: feedInfo.name,
            sourceLanguage: feedInfo.language,
            originalTitle: item.title,
            originalContent: content,
            originalSummary: summary
          });
        } catch (error) {
          console.error(`翻訳エラー (${feedInfo.name}):`, error);
        }
      } else {
        // 日本語の場合はそのまま追加
        const id = item.guid || item.link || `${feedInfo.name}-${Date.now()}-${Math.random()}`;
        
        newsItems.push({
          id,
          title: translatedTitle,
          link: item.link || '',
          content: translatedContent,
          summary: translatedSummary,
          publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          sourceName: feedInfo.name,
          sourceLanguage: feedInfo.language
        });
      }
    }
    
    return newsItems;
  } catch (error) {
    console.error(`RSSフィード取得エラー (${feedInfo.url}):`, error);
    return [];
  }
}

/**
 * すべてのRSSフィードから記事を取得して結合する
 * タイムアウト機能付き並列処理
 */
export async function fetchAllFeeds(): Promise<AINewsItem[]> {
  const allNewsItems: AINewsItem[] = [];
  
  // 並列でフィードを取得（各フィードに5秒のタイムアウトを設定）
  const fetchPromises = AI_RSS_FEEDS.map(async (feedInfo) => {
    try {
      // タイムアウト付きでフィードを取得
      const timeoutPromise = new Promise<AINewsItem[]>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout fetching ${feedInfo.name}`)), 5000);
      });
      
      const items = await Promise.race([
        fetchFeed(feedInfo),
        timeoutPromise
      ]);
      
      return items;
    } catch (error) {
      console.error(`フィード処理エラー (${feedInfo.name}):`, error);
      return [];
    }
  });
  
  // すべての結果を待機して結合
  const results = await Promise.all(fetchPromises);
  results.forEach(items => {
    allNewsItems.push(...items);
  });
  
  // 公開日の新しい順にソート
  return allNewsItems.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
}