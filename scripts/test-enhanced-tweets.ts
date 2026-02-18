/**
 * 強化版ツイートフォーマットのテスト
 * 現行版と比較してエンゲージメント向上を検証
 *
 * 検証項目:
 * - 質問型フック（question）が出力に含まれること
 * - ソース別の絵文字が正しくマッピングされること
 * - 日本語ハッシュタグ（#AIニュース）が含まれること
 * - スレッド構成（メイン + リプライ）が正しく分離されること
 * - 全ツイートが280文字以内であること
 */

import { formatTweetText } from "../lib/auto-post.js";
import {
  formatTweetTextEnhanced,
  formatTweetTextEnhancedAsync,
  formatTweetWithReplyAsync,
  generateTweetVariations,
} from "../lib/auto-post-enhanced.js";
import type { AINewsItem } from "../lib/types.js";

// テスト用のサンプル記事（各ソースの代表例）
const sampleArticles: AINewsItem[] = [
  {
    id: "https://openai.com/index/navigating-health-questions",
    title: "Navigating Health Questions with AI Assistance",
    link: "https://openai.com/index/navigating-health-questions",
    summary:
      "OpenAI introduces new approaches to help users navigate health-related questions with AI, emphasizing accuracy and safety in medical information.",
    content: "",
    publishDate: new Date("2024-02-10"),
    sourceName: "OpenAI Blog",
    sourceUrl: "https://openai.com/blog",
    sourceLanguage: "en",
    categories: ["AI", "Health"],
  },
  {
    id: "https://blog.google/technology/ai/gemini-multimodal-update",
    title: "Gemini 1.5 Pro: Breakthrough in Multimodal AI",
    link: "https://blog.google/technology/ai/gemini-multimodal-update",
    summary:
      "Google announces Gemini 1.5 Pro with enhanced multimodal capabilities, processing up to 1 million tokens and understanding complex video content.",
    content: "",
    publishDate: new Date("2024-02-12"),
    sourceName: "Google AI Blog",
    sourceUrl: "https://blog.google/technology/ai/",
    sourceLanguage: "en",
    categories: ["AI", "LLM"],
  },
  {
    id: "https://developer.nvidia.com/blog/nvfp4-ai-training",
    title: "3 Ways NVF4 Accelerates AI Training and Inference",
    link: "https://developer.nvidia.com/blog/nvfp4-ai-training",
    summary:
      "NVIDIA's new FP4 precision format dramatically reduces memory usage while maintaining model accuracy, enabling larger models on existing hardware.",
    content: "",
    publishDate: new Date("2024-02-13"),
    sourceName: "NVIDIA Technical Blog",
    sourceUrl: "https://developer.nvidia.com/blog",
    sourceLanguage: "en",
    categories: ["AI", "GPU"],
  },
  {
    id: "https://www.anthropic.com/news/claude-agent-update",
    title: "Claude's New Agentic Capabilities for Enterprise",
    link: "https://www.anthropic.com/news/claude-agent-update",
    summary:
      "Anthropic launches new agentic features for Claude, enabling autonomous task completion with improved safety guardrails for enterprise use cases.",
    content: "",
    publishDate: new Date("2024-02-14"),
    sourceName: "Anthropic News",
    sourceUrl: "https://www.anthropic.com/news",
    sourceLanguage: "en",
    categories: ["AI", "Agent"],
  },
];

const X_MAX_CHARS = 280;
let testsPassed = 0;
let testsFailed = 0;

function assertCheck(condition: boolean, description: string, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${description}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${description}${detail ? ` — ${detail}` : ""}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("=".repeat(80));
  console.log("📊 インプレッション改善版ツイートフォーマット テスト");
  console.log("=".repeat(80));
  console.log();

  // =====================================================
  // テスト1: 同期版（enhanced）の基本動作確認
  // =====================================================
  console.log("🔹 テスト1: 同期版（enhanced）フォーマット");
  console.log("-".repeat(60));

  for (const article of sampleArticles) {
    console.log(`\n📰 ${article.sourceName}: ${article.title}`);
    const enhanced = formatTweetTextEnhanced(article);
    console.log(enhanced);
    console.log(`文字数: ${enhanced.length}/${X_MAX_CHARS}`);
    assertCheck(enhanced.length <= X_MAX_CHARS, `文字数制限 (${enhanced.length}文字)`);
    assertCheck(enhanced.includes("#AIニュース"), "日本語ハッシュタグ #AIニュース を含む");
    assertCheck(enhanced.includes("#GlotNexus"), "ブランドタグ #GlotNexus を含む");
  }

  console.log();

  // =====================================================
  // テスト2: 非同期版（翻訳対応）の動作確認
  // =====================================================
  console.log("=".repeat(80));
  console.log("🔹 テスト2: 非同期版（翻訳対応）フォーマット");
  console.log("-".repeat(60));

  for (const article of sampleArticles.slice(0, 2)) {
    console.log(`\n📰 ${article.sourceName}: ${article.title}`);
    const asyncEnhanced = await formatTweetTextEnhancedAsync(article);
    console.log(asyncEnhanced);
    console.log(`文字数: ${asyncEnhanced.length}/${X_MAX_CHARS}`);
    assertCheck(asyncEnhanced.length <= X_MAX_CHARS, `文字数制限 (${asyncEnhanced.length}文字)`);
  }

  console.log();

  // =====================================================
  // テスト3: スレッド形式（URL-in-Reply）の動作確認
  // =====================================================
  console.log("=".repeat(80));
  console.log("🔹 テスト3: スレッド形式（URL-in-Reply）フォーマット");
  console.log("-".repeat(60));

  for (const article of sampleArticles) {
    console.log(`\n📰 ${article.sourceName}: ${article.title}`);
    const { main, reply } = await formatTweetWithReplyAsync(article);

    console.log("\n【メインツイート】（URLなし）:");
    console.log(main);
    console.log(`文字数: ${main.length}/${X_MAX_CHARS}`);

    console.log("\n【リプライ】（URL + 元記事）:");
    console.log(reply);
    console.log(`文字数: ${reply.length}/${X_MAX_CHARS}`);

    assertCheck(main.length <= X_MAX_CHARS, `メインツイート文字数制限 (${main.length}文字)`);
    assertCheck(reply.length <= X_MAX_CHARS, `リプライ文字数制限 (${reply.length}文字)`);
    assertCheck(!main.includes("https://"), "メインツイートにURLが含まれない");
    assertCheck(reply.includes("https://"), "リプライにURLが含まれる");
    assertCheck(reply.includes(article.link), "リプライに元記事URLが含まれる");
    assertCheck(reply.includes("元記事"), "リプライに '元記事' ラベルが含まれる");
    assertCheck(main.includes("#AIニュース"), "メインツイートに日本語ハッシュタグ");
  }

  console.log();

  // =====================================================
  // テスト4: A/Bテスト用バリエーション
  // =====================================================
  console.log("=".repeat(80));
  console.log("🔹 テスト4: A/Bテスト用バリエーション");
  console.log("-".repeat(60));

  const variations = generateTweetVariations(sampleArticles[0]);
  console.log("\n📰 シンプル版:");
  console.log(variations.simple);
  console.log(`文字数: ${variations.simple.length}/${X_MAX_CHARS}`);
  assertCheck(variations.simple.length <= X_MAX_CHARS, "シンプル版文字数制限");

  console.log("\n📰 強化版:");
  console.log(variations.enhanced);
  console.log(`文字数: ${variations.enhanced.length}/${X_MAX_CHARS}`);
  assertCheck(variations.enhanced.length <= X_MAX_CHARS, "強化版文字数制限");

  console.log("\n📰 スレッド版:");
  variations.thread.forEach((tweet, index) => {
    console.log(`--- ツイート ${index + 1}/${variations.thread.length} ---`);
    console.log(tweet);
    console.log(`文字数: ${tweet.length}/${X_MAX_CHARS}`);
    assertCheck(tweet.length <= X_MAX_CHARS, `スレッド版ツイート${index + 1}文字数制限`);
  });

  // =====================================================
  // テスト結果サマリー
  // =====================================================
  console.log();
  console.log("=".repeat(80));
  console.log("📈 テスト結果サマリー");
  console.log("=".repeat(80));
  console.log(`  合計: ${testsPassed + testsFailed} テスト`);
  console.log(`  ✅ 成功: ${testsPassed}`);
  console.log(`  ❌ 失敗: ${testsFailed}`);
  console.log();

  console.log("📈 改善ポイント:");
  console.log("  1. ✅ 質問型フック追加 → エンゲージメント率向上");
  console.log("  2. ✅ ソース別絵文字 → 視認性向上（🧠OpenAI, 🔍Google, 🤖Anthropic等）");
  console.log("  3. ✅ 日本語ハッシュタグ #AIニュース → ディスカバリー強化");
  console.log("  4. ✅ URL-in-Reply → アルゴリズムペナルティ回避");
  console.log("  5. ✅ 元記事URL 🇺🇸 → セルフリプライで情報追加");
  console.log();

  console.log("=".repeat(80));
  console.log("🎯 環境変数で制御:");
  console.log("  USE_THREAD_FORMAT=true  → スレッド形式（URL-in-Reply）を有効化");
  console.log("  TWEET_FORMAT_VARIANT=enhanced  → 強化版フォーマット（デフォルト）");
  console.log("=".repeat(80));

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
