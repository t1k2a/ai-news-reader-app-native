/**
 * X (Twitter) 自動投稿スクリプト
 * 
 * posts_queue.json から未投稿の記事を読み取り、
 * X API v2 を使用して自動投稿します。
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

// ES Module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env ファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 定数定義
const POSTS_FILE = path.resolve(__dirname, 'posts_queue.json');

// X API 認証情報
const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

// X の文字数制限
const X_MAX_CHARS = 280;

// 投稿データの型定義
interface PostItem {
  id: number;
  title: string;
  content: string;
  url?: string;
  hashtags?: string[];
  status: 'pending' | 'published' | 'failed';
  published_at?: string;
  tweet_id?: string;
  error_message?: string;
}

/**
 * ログ出力ヘルパー
 */
function log(level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN', message: string): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '📋',
    ERROR: '❌',
    SUCCESS: '✅',
    WARN: '⚠️'
  }[level];
  console.log(`[${timestamp}] ${prefix} [${level}] ${message}`);
}

/**
 * 設定のバリデーション
 */
function validateConfig(): void {
  const missing: string[] = [];
  
  if (!X_API_KEY) missing.push('X_API_KEY');
  if (!X_API_SECRET) missing.push('X_API_SECRET');
  if (!X_ACCESS_TOKEN) missing.push('X_ACCESS_TOKEN');
  if (!X_ACCESS_TOKEN_SECRET) missing.push('X_ACCESS_TOKEN_SECRET');
  
  if (missing.length > 0) {
    throw new Error(`以下の環境変数が設定されていません: ${missing.join(', ')}\n.env ファイルを確認してください。`);
  }
  
  log('SUCCESS', '設定のバリデーション完了');
}

/**
 * X API クライアントを初期化
 */
function createXClient(): TwitterApi {
  log('INFO', 'X API クライアントを初期化中...');
  
  const client = new TwitterApi({
    appKey: X_API_KEY!,
    appSecret: X_API_SECRET!,
    accessToken: X_ACCESS_TOKEN!,
    accessSecret: X_ACCESS_TOKEN_SECRET!,
  });
  
  log('SUCCESS', 'X API クライアント初期化完了');
  return client;
}

/**
 * posts_queue.json から投稿データを読み込み
 */
function loadPosts(): PostItem[] {
  log('INFO', `投稿データを読み込み中: ${POSTS_FILE}`);
  
  try {
    if (!fs.existsSync(POSTS_FILE)) {
      throw new Error(`ファイルが見つかりません: ${POSTS_FILE}`);
    }
    
    const content = fs.readFileSync(POSTS_FILE, 'utf-8');
    const posts = JSON.parse(content) as PostItem[];
    log('INFO', `${posts.length} 件の投稿データを読み込みました`);
    return posts;
  } catch (error) {
    log('ERROR', `データ読み込みステップで失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * posts_queue.json を保存
 */
function savePosts(posts: PostItem[]): void {
  log('INFO', '投稿データを保存中...');
  
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    log('SUCCESS', '投稿データを保存しました');
  } catch (error) {
    log('ERROR', `データ保存ステップで失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 未投稿の記事を1件取得
 */
function getNextPendingPost(posts: PostItem[]): PostItem | null {
  const pending = posts.find(p => p.status === 'pending');
  if (pending) {
    log('INFO', `未投稿の記事を発見: ID=${pending.id}, タイトル="${pending.title}"`);
  } else {
    log('INFO', '未投稿の記事はありません');
  }
  return pending || null;
}

/**
 * ツイート用のテキストを生成（文字数制限対応）
 */
function formatTweetText(post: PostItem): string {
  // ハッシュタグを生成
  const hashtags = post.hashtags?.map(tag => `#${tag}`).join(' ') || '#AI #Tech';
  
  // URL の長さ（X では t.co 短縮で 23 文字固定）
  const urlLength = post.url ? 23 : 0;
  
  // 使用可能な文字数を計算
  const separator = '\n\n';
  const availableChars = X_MAX_CHARS - urlLength - hashtags.length - separator.length - 2;
  
  // タイトルを切り詰め
  let title = post.title;
  if (title.length > availableChars) {
    title = title.slice(0, availableChars - 3) + '...';
    log('WARN', `タイトルが長いため切り詰めました: ${title.length}文字`);
  }
  
  // ツイートテキストを構成
  let tweetText = title;
  
  if (post.url) {
    tweetText += `${separator}${post.url}`;
  }
  
  tweetText += `${separator}${hashtags}`;
  
  log('INFO', `ツイートテキスト生成完了 (${tweetText.length}文字)`);
  return tweetText;
}

/**
 * X に投稿
 */
async function postToX(client: TwitterApi, post: PostItem): Promise<string> {
  log('INFO', `X に投稿中: ID=${post.id}`);
  
  try {
    const tweetText = formatTweetText(post);
    
    // ツイートを投稿
    const result = await client.v2.tweet(tweetText);
    
    const tweetId = result.data.id;
    log('SUCCESS', `投稿成功! Tweet ID: ${tweetId}`);
    log('INFO', `投稿URL: https://x.com/i/status/${tweetId}`);
    
    return tweetId;
  } catch (error: any) {
    // X API エラーの詳細を取得
    if (error.data) {
      log('ERROR', `X API エラー: ${JSON.stringify(error.data)}`);
    }
    log('ERROR', `投稿ステップで失敗: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * 投稿ステータスを更新
 */
function updatePostStatus(
  posts: PostItem[], 
  postId: number, 
  status: 'published' | 'failed',
  tweetId?: string,
  errorMessage?: string
): void {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.status = status;
    if (status === 'published') {
      post.published_at = new Date().toISOString();
      post.tweet_id = tweetId;
      log('SUCCESS', `ステータスを 'published' に更新: ID=${postId}`);
    } else {
      post.error_message = errorMessage;
      log('ERROR', `ステータスを 'failed' に更新: ID=${postId}`);
    }
  }
}

/**
 * 認証情報のテスト（ユーザー情報を取得）
 */
async function verifyCredentials(client: TwitterApi): Promise<void> {
  log('INFO', '認証情報を確認中...');
  
  try {
    const me = await client.v2.me();
    log('SUCCESS', `認証成功! ログイン中のアカウント: @${me.data.username}`);
  } catch (error: any) {
    if (error.data) {
      log('ERROR', `認証エラー詳細: ${JSON.stringify(error.data)}`);
    }
    throw new Error(`認証に失敗しました: ${error.message}`);
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  X (Twitter) 自動投稿スクリプト');
  console.log('========================================\n');

  try {
    // 1. 設定のバリデーション
    validateConfig();

    // 2. X API クライアントを初期化
    const client = createXClient();

    // 3. 認証情報を確認
    await verifyCredentials(client);

    // 4. 投稿データの読み込み
    const posts = loadPosts();

    // 5. 未投稿の記事を取得
    const pendingPost = getNextPendingPost(posts);
    if (!pendingPost) {
      log('INFO', '処理する記事がありません。終了します。');
      return;
    }

    // 6. X に投稿
    try {
      const tweetId = await postToX(client, pendingPost);
      updatePostStatus(posts, pendingPost.id, 'published', tweetId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updatePostStatus(posts, pendingPost.id, 'failed', undefined, errorMessage);
    }

    // 7. 投稿データを保存
    savePosts(posts);

    console.log('\n========================================');
    log('SUCCESS', '処理が完了しました');
    console.log('========================================\n');

  } catch (error) {
    console.log('\n========================================');
    log('ERROR', `致命的なエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    console.log('========================================\n');
    process.exit(1);
  }
}

// スクリプト実行
main();
