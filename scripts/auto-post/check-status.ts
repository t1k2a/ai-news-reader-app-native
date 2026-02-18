/**
 * X アカウント状態確認スクリプト
 *
 * X API v2 を使ってアカウントの現在状態を表示します：
 * - フォロワー数
 * - 投稿数（累計ツイート数）
 * - ローカル投稿済み記事数
 * - 月間投稿ペースの推定値
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createXClient } from "../../lib/auto-post.js";

// ES Module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env ファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const LOCAL_POSTED_IDS_FILE = path.resolve(__dirname, "posted_ids.json");

/**
 * ローカルの投稿済みIDを読み込み
 */
function loadLocalPostedIds(): string[] {
  try {
    if (fs.existsSync(LOCAL_POSTED_IDS_FILE)) {
      const content = fs.readFileSync(LOCAL_POSTED_IDS_FILE, "utf-8");
      return JSON.parse(content) as string[];
    }
  } catch {
    // ファイルが存在しない or 読み込みエラーは無視
  }
  return [];
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log("\n========================================");
  console.log("  X アカウント状態確認");
  console.log("========================================\n");

  // X API クライアントを初期化
  const client = createXClient();

  if (!client) {
    console.error(
      "X API 認証情報が設定されていません。\n" +
        ".env ファイルに X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET を設定してください。"
    );
    process.exit(1);
  }

  try {
    // アカウント情報を取得（public_metrics を含む）
    const me = await client.v2.me({
      "user.fields": ["public_metrics", "created_at"],
    });

    const user = me.data;
    const metrics = user.public_metrics;

    console.log(`アカウント     : @${user.username}`);
    console.log(`表示名         : ${user.name}`);

    if (metrics) {
      console.log(
        `フォロワー数   : ${metrics.followers_count?.toLocaleString() ?? "N/A"}`
      );
      console.log(
        `フォロー数     : ${metrics.following_count?.toLocaleString() ?? "N/A"}`
      );
      console.log(
        `累計ツイート数 : ${metrics.tweet_count?.toLocaleString() ?? "N/A"}`
      );
    }
  } catch (error: unknown) {
    const err = error as { data?: unknown; message?: string };
    if (err.data) {
      console.error(`X API エラー詳細: ${JSON.stringify(err.data)}`);
    }
    console.error(
      `X API 呼び出しに失敗しました: ${err.message || String(error)}`
    );
    process.exit(1);
  }

  // ローカル投稿済み記事の統計
  const postedIds = loadLocalPostedIds();
  console.log(`\n投稿済み記事 (ローカル): ${postedIds.length} 件`);

  // 月間ペースの推定（GitHub Actions: 1日3回 × 最大3件 = 最大9件/日）
  const maxPerDay = 9;
  const estimatedMonthly = maxPerDay * 30;
  console.log(
    `月間投稿ペース (推定): 最大 ${estimatedMonthly} 件/月 (1日3回 × 最大3件)`
  );

  console.log("\n========================================\n");
}

main();
