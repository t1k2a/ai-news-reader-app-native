import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

// Twitter APIの設定
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
});

// 著名なAI関連アカウントのID一覧
const AI_ACCOUNTS = [
  '1720554292386328576', // OpenAI
  '1413364086704599040', // Sam Altman
  '1580566210651418624', // Anthropic
  '1724518030105108480', // Google DeepMind
  '1551706489370759168', // Claude AI
  '1270138231899594752', // Stability AI
  '44196397',            // Elon Musk
  '60642052',            // Andrew Ng
  '33836629',            // Yann LeCun
  '319950936',           // Geoffrey Hinton
];

/**
 * 特定のユーザーの最新ツイートを取得する
 */
export async function getUserTweets(userId: string, count: number = 5) {
  try {
    const timeline = await twitterClient.v2.userTimeline(userId, {
      max_results: count,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['name', 'username', 'profile_image_url']
    });
    
    return timeline.data;
  } catch (error) {
    console.error(`ツイート取得エラー (ユーザーID: ${userId}):`, error);
    return null;
  }
}

/**
 * すべてのAIアカウントの最新ツイートを取得する
 */
export async function getAllAITweets() {
  const allTweets = [];
  
  for (const userId of AI_ACCOUNTS) {
    const tweets = await getUserTweets(userId, 3); // 各アカウントから3件ずつ
    if (tweets) {
      allTweets.push(...tweets.data);
    }
  }
  
  // 日付の新しい順にソート
  return allTweets.sort((a, b) => {
    const dateA = new Date(a.created_at || '');
    const dateB = new Date(b.created_at || '');
    return dateB.getTime() - dateA.getTime();
  });
}