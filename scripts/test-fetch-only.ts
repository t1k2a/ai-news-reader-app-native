/**
 * 記事取得のみのテスト（投稿なし）
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import * as path from "path";
import { fetchAllFeeds } from "../lib/rss-feed.js";
import { getPostedArticleIds } from "../lib/cache.js";
import { formatTweetText, createXClient } from "../lib/auto-post.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("========================================");
  console.log("🧪 Fetch & Format Test (No Posting)");
  console.log("========================================\n");

  try {
    // 1. X API認証確認
    console.log("🔑 Checking X API credentials...");
    const client = createXClient();
    if (client) {
      console.log("✅ X API client created successfully\n");
    } else {
      console.log("❌ X API credentials not configured\n");
    }

    // 2. 記事を取得
    console.log("📡 Fetching articles...");
    const articles = await fetchAllFeeds();
    console.log(`✅ Fetched ${articles.length} articles\n`);

    if (articles.length === 0) {
      console.log("❌ No articles found");
      return;
    }

    // 3. 投稿済みIDを確認
    console.log("🔍 Checking posted article IDs...");
    const postedIds = await getPostedArticleIds();
    console.log(`✅ Found ${postedIds.size} previously posted articles\n`);

    // 4. 未投稿記事をフィルタリング
    const unpostedArticles = articles.filter((a) => !postedIds.has(a.id));
    console.log(`📝 Unposted articles: ${unpostedArticles.length}\n`);

    // 5. 最初の3件のツイートフォーマットをプレビュー
    console.log("========================================");
    console.log("📋 Tweet Preview (First 3 unposted)");
    console.log("========================================\n");

    unpostedArticles.slice(0, 3).forEach((article, i) => {
      console.log(`[${i + 1}] Article:`);
      console.log(`    Title: ${article.title}`);
      console.log(`    Source: ${article.sourceName}`);
      console.log(`    ID: ${article.id}`);
      console.log(`    Link: ${article.link}`);
      console.log(`\n    Tweet text:`);
      console.log("    " + "-".repeat(50));
      const tweetText = formatTweetText(article);
      console.log(`    ${tweetText.split("\n").join("\n    ")}`);
      console.log("    " + "-".repeat(50));
      console.log(`    Length: ${tweetText.length} characters\n`);
    });

    console.log("========================================");
    console.log("✅ Test completed!");
    console.log("========================================");
    console.log(
      `\n💡 Ready to post ${Math.min(unpostedArticles.length, 10)} articles`
    );
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
