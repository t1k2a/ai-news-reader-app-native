/**
 * ブランドカード画像生成テスト
 * 各ソースのカラーテーマでPNG画像を生成し、tmp/に保存する
 */
import { saveBrandCardToFile } from "../lib/brand-card.js";
import type { AINewsItem } from "../lib/types.js";
import * as fs from "fs";
import * as path from "path";

const articles: AINewsItem[] = [
  {
    id: "test-openai",
    title: "GPT-5 Achieves Human-Level Reasoning in Complex Tasks",
    link: "https://openai.com/blog/gpt5",
    summary: "OpenAI announces GPT-5 with breakthrough reasoning capabilities that match human experts across multiple domains.",
    content: "",
    publishDate: new Date(),
    sourceName: "OpenAI Blog",
    sourceUrl: "https://openai.com",
    sourceLanguage: "en",
    categories: ["AI"],
  },
  {
    id: "test-nvidia",
    title: "3 Ways NVF4 Accelerates AI Training and Inference",
    link: "https://nvidia.com/blog/nvfp4",
    summary: "NVIDIA's new FP4 precision format dramatically reduces memory usage while maintaining model accuracy, enabling larger models on existing hardware.",
    content: "",
    publishDate: new Date(),
    sourceName: "NVIDIA Technical Blog",
    sourceUrl: "https://nvidia.com",
    sourceLanguage: "en",
    categories: ["AI"],
  },
  {
    id: "test-anthropic",
    title: "Claude's New Agentic Capabilities for Enterprise Users",
    link: "https://anthropic.com/news/claude4",
    summary: "Anthropic launches new agentic features for Claude, enabling autonomous task completion with improved safety guardrails.",
    content: "",
    publishDate: new Date(),
    sourceName: "Anthropic News",
    sourceUrl: "https://anthropic.com",
    sourceLanguage: "en",
    categories: ["AI"],
  },
];

async function main() {
  const outputDir = path.resolve("tmp");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🖼️ ブランドカード画像生成テスト");
  console.log("=".repeat(60));

  for (const article of articles) {
    const safeName = article.sourceName.replace(/ /g, "_");
    const outputPath = path.join(outputDir, `brand_card_${safeName}.png`);
    await saveBrandCardToFile(article, outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`  ✅ ${article.sourceName}: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  console.log("\n✨ 全カード生成完了！tmp/ ディレクトリを確認してください。");
}

main().catch(console.error);
