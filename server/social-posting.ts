import { TwitterApi } from 'twitter-api-v2';
import { AINewsItem } from './rss-feed';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// 必要なAPI KeyとTokenの取得
const twitterClient = process.env.TWITTER_API_KEY && 
                      process.env.TWITTER_API_SECRET && 
                      process.env.TWITTER_ACCESS_TOKEN && 
                      process.env.TWITTER_ACCESS_SECRET ? 
  new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  }) : null;

// 読み込み専用クライアント
const readOnlyClient = twitterClient ? twitterClient.readOnly : null;

// 読み書きクライアント
const rwClient = twitterClient ? twitterClient.readWrite : null;

/**
 * 最新のAIニュースをXに投稿する
 * @param newsItem 投稿するニュースアイテム
 * @returns 投稿の成功/失敗とステータス
 */
export async function postNewsToTwitter(newsItem: AINewsItem): Promise<{ success: boolean, message: string }> {
  try {
    // API Keyが設定されていない場合はエラー
    if (!rwClient) {
      console.error('Twitter API credentials are not configured');
      return { 
        success: false, 
        message: 'Twitter API認証情報が設定されていません。' 
      };
    }

    // 投稿内容の作成
    // タイトル、カテゴリ、リンクを含めて280文字以内に収める
    const categories = newsItem.categories.join(', ');
    
    // 投稿テキスト生成（280文字制限を考慮）
    const tweetText = createTweetText(newsItem.title, categories, newsItem.link);
    
    // 投稿を実行
    const tweet = await rwClient.v2.tweet(tweetText);
    
    console.log(`ニュースをXに投稿しました: ${tweet.data.id}`);
    return { 
      success: true, 
      message: `投稿ID: ${tweet.data.id}` 
    };
  } catch (error) {
    console.error('Twitter投稿エラー:', error);
    return { 
      success: false, 
      message: `Twitter投稿エラー: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * 投稿テキストを生成する（280文字制限に対応）
 */
function createTweetText(title: string, categories: string, link: string): string {
  // 基本形式
  let text = `${title}\n\n#AI #${categories.replace(/、|,/g, ' #').replace(/\s+/g, ' ').trim()}\n\n${link}`;
  
  // 280文字を超える場合は調整
  if (text.length > 280) {
    // リンクとカテゴリは残し、タイトルを短縮
    const linkAndCategories = `\n\n#AI #${categories.replace(/、|,/g, ' #').replace(/\s+/g, ' ').trim()}\n\n${link}`;
    const maxTitleLength = 280 - linkAndCategories.length - 3; // "..." の分も考慮
    
    // タイトルを短縮
    const shortenedTitle = title.substring(0, maxTitleLength) + '...';
    text = `${shortenedTitle}${linkAndCategories}`;
  }
  
  return text;
}

// 過去の投稿をチェックして、同じニュースを再投稿しないようにする
// 実際のアプリでは、投稿済みのニュースIDをデータベースに保存するなどの対応が必要
let postedNewsIds: Set<string> = new Set();

/**
 * ニュースが投稿済みかどうかをチェックし、新規なら投稿する
 * @param newsItem 投稿候補のニュースアイテム
 * @returns 投稿結果
 */
export async function postIfNew(newsItem: AINewsItem): Promise<{ success: boolean, message: string, wasNew: boolean }> {
  // すでに投稿済みの場合はスキップ
  if (postedNewsIds.has(newsItem.id)) {
    return {
      success: true,
      message: '既に投稿済みのニュースです',
      wasNew: false
    };
  }
  
  // 新規ニュースを投稿
  const result = await postNewsToTwitter(newsItem);
  
  // 投稿成功したら投稿済みリストに追加
  if (result.success) {
    postedNewsIds.add(newsItem.id);
  }
  
  return {
    ...result,
    wasNew: true
  };
}

/**
 * 新しいニュースアイテムのみをXに投稿
 * @param newsItems 最新のニュースアイテム配列
 * @returns 投稿結果
 */
export async function postNewItems(newsItems: AINewsItem[]): Promise<{ 
  totalProcessed: number,
  newItemsPosted: number,
  errors: number,
  details: string[]
}> {
  const details: string[] = [];
  let newItemsPosted = 0;
  let errors = 0;
  
  // 投稿間隔を空けるため、非同期処理を直列化
  for (const item of newsItems) {
    const result = await postIfNew(item);
    
    if (result.wasNew) {
      if (result.success) {
        newItemsPosted++;
        details.push(`投稿成功: ${item.title}`);
      } else {
        errors++;
        details.push(`投稿エラー: ${item.title} - ${result.message}`);
      }
    } else {
      details.push(`スキップ: ${item.title} (既投稿)`);
    }
    
    // APIレート制限対策に少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return {
    totalProcessed: newsItems.length,
    newItemsPosted,
    errors,
    details
  };
}