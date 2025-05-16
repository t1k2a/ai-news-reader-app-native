import Parser from 'rss-parser';
import { translateToJapanese, summarizeText, translateLongContent, extractFirstParagraph } from './translation-api';

// RSSパーサーの初期化
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
      ['media:content', 'media'],
    ]
  },
});

// AIカテゴリの定義
export const AI_CATEGORIES = {
  ML: '機械学習',
  NLP: '自然言語処理',
  CV: 'コンピュータビジョン',
  ROBOTICS: 'ロボティクス',
  ETHICS: 'AI倫理',
  RESEARCH: 'AI研究',
  BUSINESS: 'ビジネス活用',
  GENERAL: '一般'
};

// AI関連のRSSフィードのURL
const AI_RSS_FEEDS = [
  // 英語のRSSフィード
  { 
    url: 'https://venturebeat.com/category/ai/feed/',
    name: 'VentureBeat AI',
    language: 'en',
    defaultCategories: [AI_CATEGORIES.BUSINESS, AI_CATEGORIES.GENERAL]
  },
  { 
    url: 'https://www.artificialintelligence-news.com/feed/',
    name: 'AI News',
    language: 'en',
    defaultCategories: [AI_CATEGORIES.GENERAL]
  },
  { 
    url: 'https://blog.google/technology/ai/rss/',
    name: 'Google AI Blog',
    language: 'en',
    defaultCategories: [AI_CATEGORIES.RESEARCH, AI_CATEGORIES.BUSINESS]
  },
  { 
    url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
    name: 'TechCrunch AI',
    language: 'en',
    defaultCategories: [AI_CATEGORIES.BUSINESS, AI_CATEGORIES.GENERAL]
  },
  { 
    url: 'https://openai.com/blog/rss.xml',
    name: 'OpenAI Blog',
    language: 'en',
    defaultCategories: [AI_CATEGORIES.RESEARCH, AI_CATEGORIES.ML]
  },
  
  // 日本語のRSSフィード
  { 
    url: 'https://ai-trend.jp/feed/',
    name: 'AI-TREND',
    language: 'ja',
    defaultCategories: [AI_CATEGORIES.GENERAL, AI_CATEGORIES.BUSINESS]
  },
  {
    url: 'https://ainow.ai/feed/',
    name: 'AINow',
    language: 'ja',
    defaultCategories: [AI_CATEGORIES.GENERAL]
  },
  {
    url: 'https://rss.itmedia.co.jp/rss/2.0/ait.xml',
    name: 'ITmedia AI',
    language: 'ja',
    defaultCategories: [AI_CATEGORIES.GENERAL, AI_CATEGORIES.BUSINESS]
  }
];

export interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  firstParagraph?: string;
  publishDate: Date;
  sourceName: string;
  sourceLanguage: string;
  categories: string[];
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
  originalFirstParagraph?: string;
}

/**
 * 記事の内容からカテゴリを推測する関数
 * キーワードベースの単純な分類
 */
function inferCategoriesFromContent(title: string, content: string): string[] {
  const inferredCategories: string[] = [];
  const lowercaseTitle = title.toLowerCase();
  const lowercaseContent = content.toLowerCase();
  const combinedText = `${lowercaseTitle} ${lowercaseContent}`;
  
  // 機械学習関連
  if (
    combinedText.includes('機械学習') || 
    combinedText.includes('machine learning') || 
    combinedText.includes('ml') ||
    combinedText.includes('ディープラーニング') ||
    combinedText.includes('deep learning') ||
    combinedText.includes('強化学習') ||
    combinedText.includes('reinforcement learning')
  ) {
    inferredCategories.push(AI_CATEGORIES.ML);
  }
  
  // 自然言語処理関連
  if (
    combinedText.includes('自然言語処理') || 
    combinedText.includes('nlp') ||
    combinedText.includes('言語モデル') ||
    combinedText.includes('language model') ||
    combinedText.includes('chatgpt') ||
    combinedText.includes('gpt') ||
    combinedText.includes('bert') ||
    combinedText.includes('llm')
  ) {
    inferredCategories.push(AI_CATEGORIES.NLP);
  }
  
  // コンピュータビジョン関連
  if (
    combinedText.includes('コンピュータビジョン') || 
    combinedText.includes('computer vision') ||
    combinedText.includes('画像認識') ||
    combinedText.includes('image recognition') ||
    combinedText.includes('物体検出') ||
    combinedText.includes('object detection')
  ) {
    inferredCategories.push(AI_CATEGORIES.CV);
  }
  
  // ロボティクス関連
  if (
    combinedText.includes('ロボット') || 
    combinedText.includes('robot') ||
    combinedText.includes('自律') ||
    combinedText.includes('autonomous') ||
    combinedText.includes('ドローン') ||
    combinedText.includes('drone')
  ) {
    inferredCategories.push(AI_CATEGORIES.ROBOTICS);
  }
  
  // AI倫理関連
  if (
    combinedText.includes('倫理') || 
    combinedText.includes('ethics') ||
    combinedText.includes('公平性') ||
    combinedText.includes('fairness') ||
    combinedText.includes('バイアス') ||
    combinedText.includes('bias') ||
    combinedText.includes('透明性') ||
    combinedText.includes('transparency')
  ) {
    inferredCategories.push(AI_CATEGORIES.ETHICS);
  }
  
  // AI研究関連
  if (
    combinedText.includes('研究') || 
    combinedText.includes('research') ||
    combinedText.includes('論文') ||
    combinedText.includes('paper') ||
    combinedText.includes('学会') ||
    combinedText.includes('conference')
  ) {
    inferredCategories.push(AI_CATEGORIES.RESEARCH);
  }
  
  // ビジネス活用関連
  if (
    combinedText.includes('ビジネス') || 
    combinedText.includes('business') ||
    combinedText.includes('企業') ||
    combinedText.includes('company') ||
    combinedText.includes('導入事例') ||
    combinedText.includes('case study') ||
    combinedText.includes('roi') ||
    combinedText.includes('投資')
  ) {
    inferredCategories.push(AI_CATEGORIES.BUSINESS);
  }
  
  // カテゴリが見つからない場合は「一般」に分類
  if (inferredCategories.length === 0) {
    inferredCategories.push(AI_CATEGORIES.GENERAL);
  }
  
  return inferredCategories;
}

// 翻訳のキャッシュ
const translationCache: Record<string, string> = {};

/**
 * 特定のRSSフィードから記事を取得する（最適化版）
 */
export async function fetchFeed(feedInfo: { url: string, name: string, language: string, defaultCategories: string[] }): Promise<AINewsItem[]> {
  try {
    const feed = await parser.parseURL(feedInfo.url);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`${feedInfo.name}からの記事はありませんでした`);
      return [];
    }
    
    const newsItems: AINewsItem[] = [];
    
    // 最初は5件に制限して高速に表示
    for (const item of feed.items.slice(0, 5)) {
      // 記事の全文を取得（より多くのコンテンツソースを試す）
      let content = '';
      
      // できるだけ多くの情報を持つコンテンツソースを優先して使用
      if (item['contentEncoded'] && (item['contentEncoded'] as string).length > 200) {
        content = item['contentEncoded'] as string;
      } else if (item.content && item.content.length > 200) {
        content = item.content;
      } else if (item['description'] && (item['description'] as string).length > 100) {
        content = item['description'] as string;
      } else {
        content = item.contentSnippet || '';
      }
      
      // 要約作成（最大2000文字）
      const summary = summarizeText(content, 2000);
      
      // 最初の段落を抽出
      const firstParagraph = extractFirstParagraph(content);
      
      let translatedTitle = item.title || '';
      let translatedContent = content;
      let translatedSummary = summary;
      let translatedFirstParagraph = firstParagraph;
      
      // 記事URLからユニークIDを生成
      const id = item.guid || item.link || `${feedInfo.name}-${Date.now()}-${Math.random()}`;
      
      // 英語の場合は翻訳する
      if (feedInfo.language === 'en') {
        try {
          // タイトルの翻訳（キャッシュを利用）
          const titleCacheKey = `title:${item.title}`;
          if (translationCache[titleCacheKey]) {
            translatedTitle = translationCache[titleCacheKey];
          } else {
            translatedTitle = await translateToJapanese(item.title || '');
            translationCache[titleCacheKey] = translatedTitle;
          }
          
          // 要約を翻訳（キャッシュを利用）
          const summaryCacheKey = `summary:${summary.substring(0, 100)}`;
          if (translationCache[summaryCacheKey]) {
            translatedSummary = translationCache[summaryCacheKey];
          } else {
            translatedSummary = await translateToJapanese(summary);
            translationCache[summaryCacheKey] = translatedSummary;
          }
          
          // 最初の段落も翻訳（キャッシュを利用）
          const paragraphCacheKey = `paragraph:${firstParagraph.substring(0, 100)}`;
          if (translationCache[paragraphCacheKey]) {
            translatedFirstParagraph = translationCache[paragraphCacheKey];
          } else {
            translatedFirstParagraph = await translateToJapanese(firstParagraph);
            translationCache[paragraphCacheKey] = translatedFirstParagraph;
          }
          
          // 記事本文は必要になった時に翻訳するため、最初は翻訳しない
          // translatedContent = await translateLongContent(content);
          
          // 記事のカテゴリを取得または生成
          let categories = [...feedInfo.defaultCategories];
          
          // 記事の内容から追加のカテゴリを推測（キーワードベース）
          const inferredCategories = inferCategoriesFromContent(translatedTitle, content);
          
          // 重複を除去して統合
          categories = Array.from(new Set([...categories, ...inferredCategories]));
          
          newsItems.push({
            id,
            title: translatedTitle,
            link: item.link || '',
            content: translatedContent,
            summary: translatedSummary,
            firstParagraph: translatedFirstParagraph,
            publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            sourceName: feedInfo.name,
            sourceLanguage: feedInfo.language,
            categories,
            originalTitle: item.title,
            originalContent: content,
            originalSummary: summary,
            originalFirstParagraph: firstParagraph
          });
        } catch (error) {
          console.error(`翻訳エラー (${feedInfo.name}):`, error);
        }
      } else {
        // 日本語の場合はそのまま追加
        // 記事のカテゴリを取得または生成
        let categories = [...feedInfo.defaultCategories];
        
        // 記事の内容から追加のカテゴリを推測
        const inferredCategories = inferCategoriesFromContent(translatedTitle, content);
        
        // 重複を除去して統合
        categories = Array.from(new Set([...categories, ...inferredCategories]));
        
        newsItems.push({
          id,
          title: translatedTitle,
          link: item.link || '',
          content: translatedContent,
          summary: translatedSummary,
          firstParagraph: translatedFirstParagraph,
          publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          sourceName: feedInfo.name,
          sourceLanguage: feedInfo.language,
          categories
        });
      }
    }
    
    return newsItems;
  } catch (error) {
    console.error(`RSSフィード取得エラー (${feedInfo.url}):`, error);
    return [];
  }
}

// キャッシュする時間（ミリ秒）- 5分
const CACHE_TTL = 5 * 60 * 1000;

// キャッシュを保持する変数
let cachedNewsItems: AINewsItem[] = [];
let lastCacheTime = 0;

/**
 * すべてのRSSフィードから記事を取得して結合する
 * タイムアウト機能付き並列処理
 * キャッシュ機能追加
 */
export async function fetchAllFeeds(): Promise<AINewsItem[]> {
  const now = Date.now();
  
  // キャッシュが有効であれば、キャッシュを返す
  if (cachedNewsItems.length > 0 && (now - lastCacheTime) < CACHE_TTL) {
    console.log('キャッシュからニュースを提供');
    return cachedNewsItems;
  }
  
  const allNewsItems: AINewsItem[] = [];
  
  // 並列でフィードを取得（各フィードに8秒のタイムアウトを設定）
  const fetchPromises = AI_RSS_FEEDS.map(async (feedInfo) => {
    try {
      // タイムアウト付きでフィードを取得（8秒に短縮）
      const timeoutPromise = new Promise<AINewsItem[]>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout fetching ${feedInfo.name}`)), 8000);
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
  
  // 結果が揃い次第、処理を継続
  const results = await Promise.allSettled(fetchPromises);
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allNewsItems.push(...result.value);
    }
  });
  
  // 公開日の新しい順にソート
  const sortedItems = allNewsItems.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  
  // キャッシュを更新
  cachedNewsItems = sortedItems;
  lastCacheTime = now;
  
  return sortedItems;
}