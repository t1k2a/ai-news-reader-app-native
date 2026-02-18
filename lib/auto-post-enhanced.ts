/**
 * X (Twitter) 自動投稿の強化版
 * social-content スキルのベストプラクティスを適用
 */

import { summarizeForTweet, translateToJapanese } from "./translation-api.js";
import type { AINewsItem } from "./types.js";

const X_MAX_CHARS = 280;
const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";

/**
 * フック（Hook）のテンプレート
 * social-content スキルより
 */
const HOOK_TEMPLATES = {
  curiosity: [
    "🚨 {topic}が変わった理由",
    "【速報】{source}、{topic}で新展開",
    "知らないとマズい：{topic}の最新動向",
  ],
  value: [
    "💡 {topic}で知っておくべき3つのこと",
    "【保存版】{topic}の重要アップデート",
    "今週のAIニュース：{topic}",
  ],
  story: [
    "また{source}がやってくれた。",
    "これは見逃せない：{source}の{topic}",
  ],
  contrarian: [
    "みんな気づいてない：{topic}の真実",
    "【意外】{topic}、実は...",
  ],
};

/**
 * ソース名からハッシュタグを取得するマッピング
 * 全19 RSSフィードソースに対応
 */
const SOURCE_HASHTAG_MAP: Record<string, string> = {
  "VentureBeat AI": "VentureBeat",
  "AI News": "AINews",
  "Google AI Blog": "GoogleAI",
  "TechCrunch AI": "TechCrunch",
  "OpenAI Blog": "OpenAI",
  "Hugging Face Blog": "HuggingFace",
  "arXiv cs.AI": "arXiv",
  "arXiv cs.LG": "arXiv",
  "Papers with Code": "PapersWithCode",
  "Anthropic News": "Anthropic",
  "Meta AI Blog": "MetaAI",
  "Google DeepMind Blog": "DeepMind",
  "Microsoft Research Blog": "Microsoft",
  "NVIDIA Technical Blog": "NVIDIA",
  "Stability AI Blog": "StabilityAI",
  "Mistral AI News": "MistralAI",
  "xAI Blog": "xAI",
  "Databricks Blog": "Databricks",
  "Cohere Blog": "Cohere",
};

/**
 * コンテンツベースのトピックハッシュタグ検出ルール
 * タイトルとサマリーからAIトピックを検出してタグを付与
 */
const TOPIC_HASHTAG_RULES: { keywords: string[]; tag: string }[] = [
  { keywords: ["llm", "large language model", "言語モデル", "大規模言語"], tag: "LLM" },
  { keywords: ["gpt", "chatgpt", "gpt-4", "gpt-5"], tag: "GPT" },
  { keywords: ["claude", "anthropic claude"], tag: "Claude" },
  { keywords: ["gemini", "bard"], tag: "Gemini" },
  { keywords: ["diffusion", "stable diffusion", "画像生成", "image generation", "text-to-image", "dall-e", "midjourney"], tag: "生成AI" },
  { keywords: ["computer vision", "コンピュータビジョン", "画像認識", "object detection", "物体検出"], tag: "ComputerVision" },
  { keywords: ["robot", "ロボット", "robotics", "ロボティクス"], tag: "ロボティクス" },
  { keywords: ["autonomous", "自動運転", "self-driving", "自律"], tag: "自動運転" },
  { keywords: ["nlp", "natural language processing", "自然言語処理"], tag: "NLP" },
  { keywords: ["rag", "retrieval augmented", "検索拡張"], tag: "RAG" },
  { keywords: ["agent", "エージェント", "ai agent", "agentic"], tag: "AIエージェント" },
  { keywords: ["open source", "オープンソース", "oss"], tag: "オープンソース" },
  { keywords: ["fine-tuning", "fine tuning", "ファインチューニング"], tag: "FineTuning" },
  { keywords: ["multimodal", "マルチモーダル", "vision-language"], tag: "マルチモーダル" },
  { keywords: ["transformer", "attention mechanism"], tag: "Transformer" },
  { keywords: ["ethics", "倫理", "bias", "バイアス", "safety", "alignment", "安全性"], tag: "AI安全性" },
  { keywords: ["reinforcement learning", "強化学習", "rlhf", "rl"], tag: "強化学習" },
  { keywords: ["speech", "音声", "voice", "tts", "text-to-speech", "whisper"], tag: "音声AI" },
];

/**
 * コンテンツからトピックハッシュタグを検出
 */
function detectTopicHashtags(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const detected: string[] = [];

  for (const rule of TOPIC_HASHTAG_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      detected.push(rule.tag);
    }
  }

  return detected;
}

/**
 * カテゴリからハッシュタグを生成（改善版）
 * ソース名 + コンテンツベースのトピック検出 + ブランドタグ
 */
function generateHashtags(item: AINewsItem): string[] {
  const tags: string[] = [];

  // 1. ソース名から主要タグを生成
  const sourceTag = SOURCE_HASHTAG_MAP[item.sourceName];
  if (sourceTag) {
    tags.push(sourceTag);
  }

  // 2. コンテンツベースのトピックタグを検出（タイトル + サマリーを使用）
  const searchTitle = item.originalTitle || item.title;
  const searchSummary = item.originalSummary || item.summary;
  const topicTags = detectTopicHashtags(searchTitle, searchSummary);
  // トピックタグは最大2個まで（スパム防止）
  for (const tag of topicTags.slice(0, 2)) {
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // 3. AI関連のベースタグ（必ず含める）
  if (!tags.includes("AI")) {
    tags.push("AI");
  }

  // 4. ブランドタグ
  tags.push("GlotNexus");

  // 最大5個まで
  return tags.slice(0, 5);
}

/**
 * タイトルからトピックを抽出
 */
function extractTopic(title: string): string {
  // タイトルを短縮してトピック化
  const maxLength = 30;
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength) + "...";
}

/**
 * ランダムなフックテンプレートを選択
 */
function selectRandomHook(): string {
  const allHooks = [
    ...HOOK_TEMPLATES.curiosity,
    ...HOOK_TEMPLATES.value,
    ...HOOK_TEMPLATES.story,
  ];
  return allHooks[Math.floor(Math.random() * allHooks.length)];
}

/**
 * エンゲージメント向上型のツイートテキストを生成（非同期版）
 *
 * フォーマット例：
 * ```
 * 🚨 {hook}
 *
 * {value_proposition}
 *
 * 詳細👇
 * {url}
 *
 * #{tags}
 * ```
 */
export async function formatTweetTextEnhancedAsync(
  item: AINewsItem
): Promise<string> {
  const hashtags = generateHashtags(item)
    .map((tag) => `#${tag}`)
    .join(" ");

  // アプリ内のアーティクルページURLを生成
  const encodedId = encodeURIComponent(item.id);
  const url = `${APP_BASE_URL}/?article=${encodedId}`;

  // URL の長さ（X では t.co 短縮で 23 文字固定）
  const urlLength = 23;

  // フックテンプレートを選択
  const hookTemplate = selectRandomHook();
  const topic = extractTopic(item.title);
  const source = item.sourceName.replace(" Blog", "").replace(" News", "");

  const hook = hookTemplate
    .replace("{topic}", topic)
    .replace("{source}", source);

  // 価値提案（記事の要約があれば翻訳して使う、なければタイトル）
  let valueProposition: string;
  if (item.summary) {
    // 要約を日本語に翻訳（80文字以内に要約）
    try {
      valueProposition = await translateToJapanese(item.summary, 80);
      // 翻訳後も長すぎる場合は切り詰め
      if (valueProposition.length > 80) {
        valueProposition = summarizeForTweet(valueProposition);
      }
    } catch (error) {
      console.error("翻訳エラー:", error);
      // 翻訳失敗時は英語の要約をそのまま使用
      valueProposition = summarizeForTweet(item.summary);
    }
  } else {
    // 要約がない場合はタイトルを使用
    valueProposition = item.title.length > 80 ? item.title.slice(0, 77) + "..." : item.title;
  }

  // CTAとURL
  const ctaLine = "詳細👇";

  // 組み立て
  const parts = [hook, "", valueProposition, "", ctaLine, url, "", hashtags];

  const fullText = parts.join("\n");

  // 文字数チェック（280文字制限）
  if (fullText.length <= X_MAX_CHARS) {
    return fullText;
  }

  // 長すぎる場合は価値提案を短縮
  const overhead = hook.length + ctaLine.length + urlLength + hashtags.length + 10; // 改行等
  const availableForValue = X_MAX_CHARS - overhead;

  const shortValue =
    availableForValue > 30
      ? valueProposition.slice(0, availableForValue - 3) + "..."
      : "";

  return [hook, "", shortValue, "", ctaLine, url, "", hashtags].join("\n");
}

/**
 * エンゲージメント向上型のツイートテキストを生成（同期版、互換性維持用）
 *
 * 注意: 翻訳機能は使用されません。非同期版（formatTweetTextEnhancedAsync）を推奨。
 */
export function formatTweetTextEnhanced(item: AINewsItem): string {
  const hashtags = generateHashtags(item)
    .map((tag) => `#${tag}`)
    .join(" ");

  // アプリ内のアーティクルページURLを生成
  const encodedId = encodeURIComponent(item.id);
  const url = `${APP_BASE_URL}/?article=${encodedId}`;

  // URL の長さ（X では t.co 短縮で 23 文字固定）
  const urlLength = 23;

  // フックテンプレートを選択
  const hookTemplate = selectRandomHook();
  const topic = extractTopic(item.title);
  const source = item.sourceName.replace(" Blog", "").replace(" News", "");

  const hook = hookTemplate
    .replace("{topic}", topic)
    .replace("{source}", source);

  // 価値提案（記事の要約があれば使う、なければタイトル）
  // 注意: この同期版では翻訳は行われません
  const valueProposition = item.summary
    ? summarizeForTweet(item.summary)
    : item.title;

  // CTAとURL
  const ctaLine = "詳細👇";

  // 組み立て
  const parts = [hook, "", valueProposition, "", ctaLine, url, "", hashtags];

  const fullText = parts.join("\n");

  // 文字数チェック（280文字制限）
  if (fullText.length <= X_MAX_CHARS) {
    return fullText;
  }

  // 長すぎる場合は価値提案を短縮
  const overhead = hook.length + ctaLine.length + urlLength + hashtags.length + 10; // 改行等
  const availableForValue = X_MAX_CHARS - overhead;

  const shortValue =
    availableForValue > 30
      ? valueProposition.slice(0, availableForValue - 3) + "..."
      : "";

  return [hook, "", shortValue, "", ctaLine, url, "", hashtags].join("\n");
}

/**
 * スレッド型投稿を生成（将来的な拡張用）
 *
 * 長い記事の場合、2-3ツイートのスレッドにする
 */
export function formatTweetThread(item: AINewsItem): string[] {
  const tweets: string[] = [];

  // 1st tweet: Hook + 概要
  const firstTweet = formatTweetTextEnhanced(item);
  tweets.push(firstTweet);

  // 2nd tweet: 詳細（summary があれば）
  if (item.summary && item.summary.length > 100) {
    const hashtags = generateHashtags(item)
      .map((tag) => `#${tag}`)
      .join(" ");

    const detailTweet = `📊 詳細：\n\n${item.summary.slice(0, 200)}...\n\n${hashtags}`;

    if (detailTweet.length <= X_MAX_CHARS) {
      tweets.push(detailTweet);
    }
  }

  return tweets;
}

/**
 * A/Bテスト用：複数バリエーション生成
 */
export function generateTweetVariations(item: AINewsItem): {
  simple: string;
  enhanced: string;
  thread: string[];
} {
  // シンプル版（現行）
  const hashtags = generateHashtags(item)
    .map((tag) => `#${tag}`)
    .join(" ");
  const encodedId = encodeURIComponent(item.id);
  const url = `${APP_BASE_URL}/?article=${encodedId}`;
  const simple = `${item.title}\n\n${url}\n\n${hashtags}`;

  // 強化版
  const enhanced = formatTweetTextEnhanced(item);

  // スレッド版
  const thread = formatTweetThread(item);

  return { simple, enhanced, thread };
}
