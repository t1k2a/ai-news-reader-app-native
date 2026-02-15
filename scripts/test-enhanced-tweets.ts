/**
 * 強化版ツイートフォーマットのテスト
 * 現行版と比較してエンゲージメント向上を検証
 */

import { formatTweetText } from "../lib/auto-post.js";
import {
  formatTweetTextEnhanced,
  generateTweetVariations,
} from "../lib/auto-post-enhanced.js";
import type { AINewsItem } from "../lib/types.js";

// テスト用のサンプル記事
const sampleArticles: AINewsItem[] = [
  {
    id: "https://openai.com/index/navigating-health-questions",
    title: "Navigating Health Questions with AI Assistance",
    link: "https://openai.com/index/navigating-health-questions",
    summary:
      "OpenAI introduces new approaches to help users navigate health-related questions with AI, emphasizing accuracy and safety in medical information.",
    content: "",
    pubDate: new Date("2024-02-10"),
    sourceName: "OpenAI Blog",
    sourceUrl: "https://openai.com/blog",
  },
  {
    id: "https://blog.google/technology/ai/gemini-multimodal-update",
    title: "Gemini 1.5 Pro: Breakthrough in Multimodal AI",
    link: "https://blog.google/technology/ai/gemini-multimodal-update",
    summary:
      "Google announces Gemini 1.5 Pro with enhanced multimodal capabilities, processing up to 1 million tokens and understanding complex video content.",
    content: "",
    pubDate: new Date("2024-02-12"),
    sourceName: "Google AI Blog",
    sourceUrl: "https://blog.google/technology/ai/",
  },
  {
    id: "https://developer.nvidia.com/blog/nvfp4-ai-training",
    title: "3 Ways NVF4 Accelerates AI Training and Inference",
    link: "https://developer.nvidia.com/blog/nvfp4-ai-training",
    summary:
      "NVIDIA's new FP4 precision format dramatically reduces memory usage while maintaining model accuracy, enabling larger models on existing hardware.",
    content: "",
    pubDate: new Date("2024-02-13"),
    sourceName: "NVIDIA Developer Blog",
    sourceUrl: "https://developer.nvidia.com/blog",
  },
];

console.log("=".repeat(80));
console.log("📊 ツイートフォーマット比較テスト");
console.log("=".repeat(80));
console.log();

for (const article of sampleArticles) {
  console.log("📰 記事:", article.title);
  console.log("📅 ソース:", article.sourceName);
  console.log("-".repeat(80));

  // 現行版
  const currentFormat = formatTweetText(article);
  console.log("❌ 【現行版】（インプレッション: 0）");
  console.log(currentFormat);
  console.log(`文字数: ${currentFormat.length}/280`);
  console.log();

  // 強化版
  const enhancedFormat = formatTweetTextEnhanced(article);
  console.log("✅ 【強化版】（エンゲージメント最適化）");
  console.log(enhancedFormat);
  console.log(`文字数: ${enhancedFormat.length}/280`);
  console.log();

  // 全バリエーション
  const variations = generateTweetVariations(article);
  console.log("🧪 【スレッド版】（複数ツイート）");
  variations.thread.forEach((tweet, index) => {
    console.log(`--- ツイート ${index + 1}/${variations.thread.length} ---`);
    console.log(tweet);
    console.log(`文字数: ${tweet.length}/280`);
    console.log();
  });

  console.log("=".repeat(80));
  console.log();
}

// 改善ポイントの説明
console.log("📈 改善ポイント:");
console.log();
console.log("1. ✅ フック（Hook）追加 → スクロール停止率向上");
console.log("   - 🚨 絵文字で視覚的注目");
console.log("   - 好奇心を刺激する最初の1行");
console.log();
console.log("2. ✅ 価値提案の明確化 → クリック率向上");
console.log("   - 記事の要約を表示");
console.log("   - 「なぜ読むべきか」を提示");
console.log();
console.log("3. ✅ CTA（Call-to-Action）追加 → エンゲージメント向上");
console.log("   - 「詳細👇」で行動を促す");
console.log("   - URLを別行に分離");
console.log();
console.log("4. ✅ ハッシュタグ最適化 → リーチ拡大");
console.log("   - 日本語タグ追加（#人工知能）");
console.log("   - ソース別タグで発見性向上");
console.log();
console.log("5. ✅ フォーマット改善 → 可読性向上");
console.log("   - 適切な改行と空行");
console.log("   - 視覚的階層構造");
console.log();
console.log("=".repeat(80));
console.log("🎯 次のステップ:");
console.log("1. このスクリプトを実行して出力を確認");
console.log("2. 気に入ったフォーマットを選択");
console.log("3. lib/auto-post.ts の formatTweetText を置き換え");
console.log("4. テスト投稿で効果測定");
console.log("=".repeat(80));
