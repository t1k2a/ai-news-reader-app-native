/**
 * RSS フィード自動投稿スクリプト
 *
 * RSS フィードから新着記事を取得し、
 * 未投稿の記事を X に自動投稿します。
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import { fetchAllFeeds } from "../../lib/rss-feed.js";
import {
  getPostedArticleIds,
  addPostedArticleId,
} from "../../lib/cache.js";
import { formatTweetTextAsync } from "../../lib/auto-post.js";
import { formatTweetWithReplyAsync } from "../../lib/auto-post-enhanced.js";
import { generateBrandCard, saveBrandCardToFile } from "../../lib/brand-card.js";
import type { AINewsItem } from "../../lib/types.js";

// ES Module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";

// コマンドライン引数を解析
const isDryRun = process.argv.includes("--dry-run");

// .env ファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// X API 認証情報
const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

// X の文字数制限
const X_MAX_CHARS = 280;

// 1回の実行で投稿する最大件数
const MAX_POSTS_PER_RUN = 3;

// スレッド形式（URL-in-Reply）の有効化
const USE_THREAD_FORMAT = process.env.USE_THREAD_FORMAT === "true";

// ブランドカード画像の有効化
const USE_BRAND_CARD = process.env.USE_BRAND_CARD === "true";

// ローカルの投稿済みIDファイル（Redis が使えない場合のフォールバック）
const LOCAL_POSTED_IDS_FILE = path.resolve(__dirname, "posted_ids.json");

/**
 * ログ出力ヘルパー
 */
function log(
  level: "INFO" | "ERROR" | "SUCCESS" | "WARN",
  message: string
): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: "\u{1F4CB}",
    ERROR: "\u274C",
    SUCCESS: "\u2705",
    WARN: "\u26A0\uFE0F",
  }[level];
  console.log(`[${timestamp}] ${prefix} [${level}] ${message}`);
}

/**
 * 設定のバリデーション
 */
function validateConfig(): void {
  const missing: string[] = [];

  if (!X_API_KEY) missing.push("X_API_KEY");
  if (!X_API_SECRET) missing.push("X_API_SECRET");
  if (!X_ACCESS_TOKEN) missing.push("X_ACCESS_TOKEN");
  if (!X_ACCESS_TOKEN_SECRET) missing.push("X_ACCESS_TOKEN_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `以下の環境変数が設定されていません: ${missing.join(", ")}\n.env ファイルを確認してください。`
    );
  }

  log("SUCCESS", "設定のバリデーション完了");
}

/**
 * X API クライアントを初期化
 */
function createXClient(): TwitterApi {
  log("INFO", "X API クライアントを初期化中...");

  const client = new TwitterApi({
    appKey: X_API_KEY!,
    appSecret: X_API_SECRET!,
    accessToken: X_ACCESS_TOKEN!,
    accessSecret: X_ACCESS_TOKEN_SECRET!,
  });

  log("SUCCESS", "X API クライアント初期化完了");
  return client;
}

/**
 * 認証情報のテスト
 */
async function verifyCredentials(client: TwitterApi): Promise<void> {
  log("INFO", "認証情報を確認中...");

  try {
    const me = await client.v2.me();
    log("SUCCESS", `認証成功! ログイン中のアカウント: @${me.data.username}`);
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    if (err.data) {
      log("ERROR", `認証エラー詳細: ${JSON.stringify(err.data)}`);
    }
    throw new Error(`認証に失敗しました: ${err.message || String(error)}`);
  }
}

/**
 * ローカルの投稿済みIDを読み込み
 */
function loadLocalPostedIds(): Set<string> {
  try {
    if (fs.existsSync(LOCAL_POSTED_IDS_FILE)) {
      const content = fs.readFileSync(LOCAL_POSTED_IDS_FILE, "utf-8");
      const ids = JSON.parse(content) as string[];
      return new Set(ids);
    }
  } catch (error) {
    log("WARN", `ローカル投稿済みIDの読み込みに失敗: ${error}`);
  }
  return new Set();
}

/**
 * ローカルの投稿済みIDを保存
 */
function saveLocalPostedIds(ids: Set<string>): void {
  try {
    const idsArray = Array.from(ids).slice(-1000); // 最新1000件のみ保持
    fs.writeFileSync(LOCAL_POSTED_IDS_FILE, JSON.stringify(idsArray, null, 2));
    log("INFO", `ローカル投稿済みID保存完了 (${idsArray.length}件)`);
  } catch (error) {
    log("WARN", `ローカル投稿済みIDの保存に失敗: ${error}`);
  }
}

/**
 * 投稿済みIDを取得（Redis + ローカルのマージ）
 */
async function getAllPostedIds(): Promise<Set<string>> {
  // Redis から取得
  const redisIds = await getPostedArticleIds();
  // ローカルから取得
  const localIds = loadLocalPostedIds();
  // マージ
  return new Set([...redisIds, ...localIds]);
}

/**
 * 投稿済みIDを保存（Redis + ローカル両方）
 */
async function savePostedId(articleId: string, localIds: Set<string>): Promise<void> {
  // Redis に保存
  await addPostedArticleId(articleId);
  // ローカルにも保存
  localIds.add(articleId);
  saveLocalPostedIds(localIds);
}

// ハッシュタグ生成・ツイートフォーマットは lib/auto-post.ts の共通ロジックを使用
// （formatTweetTextAsync をインポート済み）

/**
 * X に投稿（スレッド形式対応）
 */
async function postToX(
  client: TwitterApi,
  item: AINewsItem
): Promise<string | null> {
  log("INFO", `X に投稿中: ${item.title}`);

  try {
    // ブランドカード画像を生成・アップロード
    let mediaId: string | undefined;
    if (USE_BRAND_CARD) {
      try {
        const imageBuffer = await generateBrandCard(item);
        mediaId = await client.v2.uploadMedia(imageBuffer, {
          media_type: "image/png",
          media_category: "tweet_image",
        });
        log("SUCCESS", `ブランドカードアップロード成功: ${mediaId} (${imageBuffer.length} bytes)`);
      } catch (imgError) {
        log("WARN", `ブランドカード生成/アップロード失敗、テキストのみで投稿`);
        console.error(imgError);
      }
    }

    const mediaPayload = mediaId ? { media: { media_ids: [mediaId] as [string] } } : {};

    if (USE_THREAD_FORMAT) {
      // スレッド形式: メインツイート + リプライ
      const { main, reply } = await formatTweetWithReplyAsync(item);
      const mainResult = await client.v2.tweet(main, mediaPayload);
      const mainTweetId = mainResult.data.id;

      log("SUCCESS", `メイン投稿成功! Tweet ID: ${mainTweetId} [スレッド形式]`);

      // リプライを投稿
      try {
        const replyResult = await client.v2.reply(reply, mainTweetId);
        log("SUCCESS", `リプライ投稿成功! Tweet ID: ${replyResult.data.id}`);
      } catch (replyError) {
        log("WARN", `リプライ投稿失敗（メインツイートは投稿済み）`);
        console.error(replyError);
      }

      log("INFO", `投稿URL: https://x.com/i/status/${mainTweetId}`);
      return mainTweetId;
    } else {
      // 従来形式: 1ツイート
      const { text, variant } = await formatTweetTextAsync(item);
      const result = await client.v2.tweet(text, mediaPayload);
      const tweetId = result.data.id;

      log("SUCCESS", `投稿成功! Tweet ID: ${tweetId} [variant: ${variant}]`);
      log("INFO", `投稿URL: https://x.com/i/status/${tweetId}`);

      return tweetId;
    }
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    if (err.data) {
      log("ERROR", `X API エラー: ${JSON.stringify(err.data)}`);
    }
    log("ERROR", `投稿ステップで失敗: ${err.message || String(error)}`);
    return null;
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log("\n========================================");
  console.log("  RSS フィード自動投稿スクリプト");
  if (isDryRun) {
    console.log("  [DRY RUN モード] X API への投稿はスキップされます");
  }
  console.log("========================================\n");

  try {
    // 1. 設定のバリデーション（dry-run 時はスキップ）
    if (!isDryRun) {
      validateConfig();
    }

    // 2. X API クライアントを初期化（dry-run 時はスキップ）
    let client: ReturnType<typeof createXClient> | null = null;
    if (!isDryRun) {
      client = createXClient();
      // 3. 認証情報を確認
      await verifyCredentials(client);
    }

    // 4. RSS フィードから記事を取得
    log("INFO", "RSS フィードから記事を取得中...");
    const articles = await fetchAllFeeds();
    log("INFO", `${articles.length} 件の記事を取得しました`);

    if (articles.length === 0) {
      log("INFO", "記事がありません。終了します。");
      return;
    }

    // 5. 投稿済みIDを取得
    const postedIds = await getAllPostedIds();
    log("INFO", `投稿済み記事: ${postedIds.size} 件`);

    // 6. 未投稿の記事をフィルタリング
    const unpostedArticles = articles
      .filter((article) => !postedIds.has(article.id))
      .slice(0, MAX_POSTS_PER_RUN);

    if (unpostedArticles.length === 0) {
      log("INFO", "新着記事はありません。終了します。");
      return;
    }

    log("INFO", `${unpostedArticles.length} 件の新着記事を投稿します`);

    // 7. 記事を投稿（または dry-run 時はテキストを出力）
    let successCount = 0;
    const localIds = loadLocalPostedIds();

    for (const article of unpostedArticles) {
      if (isDryRun) {
        // dry-run: ツイートテキストを生成してコンソールに出力
        // ブランドカード画像も生成してローカルに保存
        if (USE_BRAND_CARD) {
          try {
            const outputDir = path.resolve(__dirname, "../../tmp");
            const fs = await import("fs");
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            const safeTitle = article.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
            const outputPath = path.resolve(outputDir, `brand_card_${safeTitle}.png`);
            await saveBrandCardToFile(article, outputPath);
            console.log(`  🖼️ ブランドカード保存: ${outputPath}`);
          } catch (imgError) {
            console.log(`  ⚠️ ブランドカード生成失敗: ${imgError}`);
          }
        }

        if (USE_THREAD_FORMAT) {
          const { main, reply } = await formatTweetWithReplyAsync(article);
          console.log("\n--- [DRY RUN] スレッド形式ツイート ---");
          console.log(`タイトル: ${article.title}`);
          console.log(`\n【メインツイート】 (${main.length} 文字):`);
          console.log(main);
          console.log(`\n【リプライ】 (${reply.length} 文字):`);
          console.log(reply);
          console.log("-----------------------------------");
        } else {
          const { text, variant } = await formatTweetTextAsync(article);
          console.log("\n--- [DRY RUN] 生成されたツイート ---");
          console.log(`タイトル: ${article.title}`);
          console.log(`バリアント: ${variant}`);
          console.log(`テキスト (${text.length} 文字):\n${text}`);
          console.log("-----------------------------------");
        }
        successCount++;
      } else {
        const tweetId = await postToX(client!, article);

        if (tweetId) {
          await savePostedId(article.id, localIds);
          successCount++;
        }

        // レート制限対策: 投稿間に少し待機
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("\n========================================");
    if (isDryRun) {
      log(
        "SUCCESS",
        `[DRY RUN] ${successCount}/${unpostedArticles.length} 件のツイートテキストを生成しました`
      );
    } else {
      log(
        "SUCCESS",
        `処理が完了しました: ${successCount}/${unpostedArticles.length} 件投稿成功`
      );
    }
    console.log("========================================\n");
  } catch (error) {
    console.log("\n========================================");
    log(
      "ERROR",
      `致命的なエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    );
    console.log("========================================\n");
    process.exit(1);
  }
}

// スクリプト実行
main();
