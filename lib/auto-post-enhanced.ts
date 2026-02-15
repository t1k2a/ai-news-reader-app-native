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
 * カテゴリからハッシュタグを生成（改善版）
 */
function generateHashtags(item: AINewsItem): string[] {
  const tags: string[] = [];

  // ソース名から主要タグを生成
  const sourceMap: Record<string, string> = {
    "OpenAI Blog": "OpenAI",
    "Google AI Blog": "GoogleAI",
    "Anthropic News": "Anthropic",
    "Hugging Face Blog": "HuggingFace",
    "Meta AI Blog": "MetaAI",
    "Microsoft Research": "Microsoft",
    "NVIDIA Developer Blog": "NVIDIA",
  };

  if (sourceMap[item.sourceName]) {
    tags.push(sourceMap[item.sourceName]);
  }

  // AI関連のジェネリックタグ
  tags.push("AI");
  tags.push("人工知能");

  // ブランドタグ
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
