import Parser from 'rss-parser';
import { translateToJapanese, summarizeText, translateLongContent, stripHtmlTags, removeImageTags } from './translation-api';

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
  categories: string[];
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
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

/**
 * 特定のRSSフィードから記事を取得する
 */
export async function fetchFeed(feedInfo: { url: string, name: string, language: string, defaultCategories: string[] }): Promise<AINewsItem[]> {
  try {
    const feed = await parser.parseURL(feedInfo.url);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`${feedInfo.name}からの記事はありませんでした`);
      return [];
    }
    
    const newsItems: AINewsItem[] = [];
    
    for (const item of feed.items.slice(0, 10)) { // 最新10件に制限
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
      
      // 要約作成（最大140文字）
      const summary = summarizeText(content);
      
      let translatedTitle = item.title || '';
      let translatedContent = content;
      let translatedSummary = summary;
      
      // 英語の場合は翻訳する
      if (feedInfo.language === 'en') {
        try {
          // タイトルと要約を翻訳
          translatedTitle = await translateToJapanese(item.title || '');
          translatedSummary = await translateToJapanese(summary);
          
          // 記事の全文を翻訳（画像タグを保持）
          try {
            console.log(`長文翻訳処理開始 (${feedInfo.name}): ${item.title?.substring(0, 30)}...`);
            
            // 処理すべきコンテンツ量が十分にあるか確認
            if (content.length > 100) {
              // 長文翻訳を試みる（画像を保持）
              translatedContent = await translateLongContent(content, false);
              console.log(`長文翻訳完了 (${feedInfo.name}): ${translatedContent.substring(0, 50)}...`);
              
              // 翻訳結果が短すぎる場合は別の方法を試す
              if (translatedContent.length < 200) {
                console.log(`翻訳結果が短いため別の手法を試行: ${translatedContent.length} 文字`);
                
                // HTMLを解析して各テキストノードを翻訳
                const matches = content.match(/>([^<]+)</g);
                if (matches && matches.length > 0) {
                  const textNodes = matches.map(match => 
                    match.substring(1, match.length - 1).trim()
                  ).filter(text => text.length > 0);
                  
                  if (textNodes.length > 0) {
                    try {
                      // テキストノードを翻訳
                      const translatedNodes = await Promise.all(
                        textNodes.map(async (text) => {
                          if (text.length > 5) { // 短すぎるテキストは翻訳しない
                            return await translateToJapanese(text);
                          }
                          return text;
                        })
                      );
                      
                      // 翻訳されたテキストノードで元のテキストを置換
                      let modifiedContent = content;
                      for (let i = 0; i < textNodes.length; i++) {
                        if (textNodes[i].length > 5) { // 短すぎるテキストは置換しない
                          modifiedContent = modifiedContent.replace(
                            new RegExp(`>${textNodes[i]}<`, 'g'), 
                            `>${translatedNodes[i]}<`
                          );
                        }
                      }
                      
                      translatedContent = modifiedContent;
                      console.log(`テキストノード翻訳完了: 合計${textNodes.length}個のノードを処理`);
                    } catch (e) {
                      console.error('テキストノード翻訳エラー:', e);
                    }
                  }
                }
              }
            } else {
              // コンテンツが短い場合
              const plainText = stripHtmlTags(content);
              const translatedText = await translateToJapanese(plainText);
              translatedContent = content.replace(plainText, translatedText);
            }
          } catch (translationError) {
            console.error(`コンテンツ翻訳エラー (${feedInfo.name}):`, translationError);
            
            // エラーの場合は単純なアプローチを試みる
            try {
              // 元のHTMLから段落を抽出（簡易版）
              const paragraphs = content.split(/<\/p>/).filter(p => p.includes('<p')).map(p => p + '</p>');
              if (paragraphs && paragraphs.length > 0) {
                // 最初の数段落（最大5つ）のみを処理
                const firstParagraphs = paragraphs.slice(0, 5);
                
                // 各段落のテキスト部分を抽出して翻訳
                const translatedParagraphs = await Promise.all(
                  firstParagraphs.map(async (p) => {
                    const text = stripHtmlTags(p);
                    if (text.length > 10) {
                      const translatedText = await translateToJapanese(text);
                      return p.replace(text, translatedText);
                    }
                    return p;
                  })
                );
                
                // 翻訳された段落を結合
                translatedContent = translatedParagraphs.join('\n');
                console.log('フォールバック翻訳完了（一部の段落のみ）');
              } else {
                // 段落が抽出できない場合は元のコンテンツを使用
                translatedContent = content;
              }
            } catch (fallbackError) {
              console.error('フォールバック翻訳にも失敗:', fallbackError);
              translatedContent = content; // すべて失敗した場合は元のコンテンツを使用
            }
          }
          
          // 記事URLからユニークIDを生成
          const id = item.guid || item.link || `${feedInfo.name}-${Date.now()}-${Math.random()}`;
          
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
            publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            sourceName: feedInfo.name,
            sourceLanguage: feedInfo.language,
            categories,
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