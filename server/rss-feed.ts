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
    url: 'https://www.technologyreview.com/technology/ai/feed',
    name: 'MIT Technology Review AI',
    language: 'en'
  },
  { 
    url: 'https://blog.google/technology/ai/rss/',
    name: 'Google AI Blog',
    language: 'en'
  },
  { 
    url: 'https://www.artificialintelligence-news.com/feed/',
    name: 'AI News',
    language: 'en'
  },
  { 
    url: 'https://venturebeat.com/category/ai/feed/',
    name: 'VentureBeat AI',
    language: 'en'
  },
  { 
    url: 'https://openai.com/blog/rss.xml',
    name: 'OpenAI Blog',
    language: 'en'
  },
  
  // 日本語のRSSフィード
  { 
    url: 'https://ledge.ai/rss',
    name: 'Ledge.ai',
    language: 'ja'
  },
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
 */
export async function fetchAllFeeds(): Promise<AINewsItem[]> {
  const allNewsItems: AINewsItem[] = [];
  
  for (const feedInfo of AI_RSS_FEEDS) {
    try {
      const items = await fetchFeed(feedInfo);
      allNewsItems.push(...items);
      
      // API制限回避のため少し待機（異なるAPIのフィード間）
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`フィード処理エラー (${feedInfo.name}):`, error);
    }
  }
  
  // 公開日の新しい順にソート
  return allNewsItems.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
}