/**
 * 週次AIニュースまとめスレッド投稿スクリプト
 *
 * 過去7日間のトップ5記事をXスレッドとして投稿します。
 * --dry-run フラグで投稿せずにプレビュー可能。
 */

import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { fetchAllFeeds } from "../../lib/rss-feed.js";
import {
  selectTopArticles,
  formatWeeklySummaryThread,
  postWeeklySummaryThread,
} from "../../lib/weekly-summary.js";

// ES Module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// コマンドライン引数を解析
const isDryRun = process.argv.includes("--dry-run");

// .env ファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main(): Promise<void> {
  console.log("\n========================================");
  console.log("  週次AIまとめスレッド");
  if (isDryRun) {
    console.log("  [DRY RUN] X API への投稿はスキップされます");
  }
  console.log("========================================\n");

  // RSS フィードから記事を取得
  console.log("📋 RSS フィードを取得中...");
  const articles = await fetchAllFeeds();
  console.log(`📋 ${articles.length} 件の記事を取得しました`);

  // トップ記事を選定
  const topArticles = selectTopArticles(articles);
  if (topArticles.length === 0) {
    console.log("⚠️ 過去7日間の記事がありません");
    return;
  }

  console.log(`\n🏆 TOP ${topArticles.length} 記事を選択:`);
  topArticles.forEach((a, i) => {
    const date = new Date(a.publishDate).toLocaleDateString("ja-JP");
    console.log(`  ${i + 1}. [${a.sourceName}] ${a.title} (${date})`);
  });

  // スレッドテキスト生成
  const threadTexts = formatWeeklySummaryThread(topArticles);
  console.log(`\n📝 スレッド (${threadTexts.length} ツイート):`);
  threadTexts.forEach((text, i) => {
    console.log(`\n--- ツイート ${i + 1} (${text.length} 文字) ---`);
    console.log(text);
  });

  if (isDryRun) {
    console.log("\n✅ [DRY RUN] プレビュー完了");
    return;
  }

  // 実際に投稿
  console.log("\n🚀 スレッドを投稿中...");
  const result = await postWeeklySummaryThread(articles);

  if (result.success) {
    console.log(
      `\n✅ 投稿成功! ${result.threadTweetIds.length} ツイートのスレッド`
    );
    console.log(`Thread IDs: ${result.threadTweetIds.join(", ")}`);
  } else {
    console.log(`\n❌ 投稿失敗: ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ スクリプトエラー:", error);
  process.exit(1);
});
