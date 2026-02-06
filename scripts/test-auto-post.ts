/**
 * ローカルテスト用スクリプト
 * lib/auto-post.ts の機能をテスト
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import * as path from "path";
import { fetchAllFeeds } from "../lib/rss-feed.js";
import { autoPostArticles } from "../lib/auto-post.js";

// ES Module で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env ファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// テスト用の設定（少ない件数・短い間隔）
const TEST_MAX_POSTS = 2; // テストは2件まで
const TEST_DELAY = 5; // テストは5秒間隔

async function main() {
  console.log("========================================");
  console.log("🧪 Auto-post Local Test");
  console.log("========================================");
  console.log(`Max posts: ${TEST_MAX_POSTS}`);
  console.log(`Delay: ${TEST_DELAY} seconds`);
  console.log("========================================\n");

  try {
    // 1. 記事を取得
    console.log("📡 Fetching articles from RSS feeds...");
    const articles = await fetchAllFeeds();
    console.log(`✅ Fetched ${articles.length} articles\n`);

    if (articles.length === 0) {
      console.log("❌ No articles found");
      return;
    }

    // 2. 最初の5件を表示
    console.log("📋 Sample articles:");
    articles.slice(0, 5).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article.title}`);
      console.log(`     Source: ${article.sourceName}`);
      console.log(`     ID: ${article.id}\n`);
    });

    // 3. 自動投稿を実行
    console.log("========================================");
    console.log("🚀 Starting auto-post test...");
    console.log("========================================\n");

    const results = await autoPostArticles(
      articles,
      TEST_MAX_POSTS,
      TEST_DELAY
    );

    // 4. 結果を表示
    console.log("\n========================================");
    console.log("📊 Test Results");
    console.log("========================================");

    const successCount = results.filter((r) => r.success).length;
    console.log(`Total: ${results.length} posts`);
    console.log(`Success: ${successCount} posts`);
    console.log(`Failed: ${results.length - successCount} posts\n`);

    results.forEach((result, i) => {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} [${i + 1}] ${result.articleTitle}`);
      if (result.success && result.tweetId) {
        console.log(`   Tweet ID: ${result.tweetId}`);
        console.log(
          `   URL: https://x.com/i/web/status/${result.tweetId}`
        );
      }
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log();
    });

    console.log("========================================");
    console.log("✅ Test completed successfully!");
    console.log("========================================");
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ Test failed with error:");
    console.error("========================================");
    console.error(error);
    process.exit(1);
  }
}

main();
