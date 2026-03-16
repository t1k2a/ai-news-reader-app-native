// Xの文字数制限: 全角140文字（半角280文字）
export const MAX_X_POST_LENGTH = 280;

export interface BuildXShareTextOptions {
  title: string;
  url: string;
  categories?: string[];
  summary?: string;
  sourceName?: string;
}

/**
 * フック（Hook）のテンプレート
 * lib/auto-post-enhanced.ts と同等のロジック
 */
const HOOK_TEMPLATES = [
  "{emoji} {topic}が変わった理由",
  "【速報】{source}、{topic}で新展開",
  "知らないとマズい：{topic}の最新動向",
  "💡 {topic}で知っておくべき3つのこと",
  "【保存版】{topic}の重要アップデート",
  "今週のAIニュース：{topic}",
  "また{source}がやってくれた。",
  "これは見逃せない：{source}の{topic}",
  "🤔 {topic}、あなたはどう思う？",
  "知ってた？{topic}が今アツい理由",
  "{topic}の影響、もう感じてる？",
  "{emoji} {source}の{topic}、次に来るのは？",
];

/**
 * ソース名から絵文字を取得するマッピング
 */
const SOURCE_EMOJI_MAP: Record<string, string> = {
  "OpenAI Blog": "🧠",
  "Google AI Blog": "🔍",
  "Google DeepMind Blog": "🔬",
  "Anthropic News": "🤖",
  "NVIDIA Technical Blog": "💚",
  "Meta AI Blog": "🌐",
  "Microsoft Research Blog": "💻",
  "Hugging Face Blog": "🤗",
  "Mistral AI News": "🌬️",
  "xAI Blog": "⚡",
  "Stability AI Blog": "🎨",
  "VentureBeat AI": "📰",
  "TechCrunch AI": "📱",
  "AI News": "🗞️",
  "arXiv cs.AI": "📄",
  "arXiv cs.LG": "📄",
  "Papers with Code": "📊",
  "Databricks Blog": "⚙️",
  "Cohere Blog": "💬",
};

const getSourceEmoji = (sourceName: string): string => {
  return SOURCE_EMOJI_MAP[sourceName] || "🚨";
};

const extractTopic = (title: string): string => {
  const maxLength = 30;
  if (Array.from(title).length <= maxLength) {
    return title;
  }
  return Array.from(title).slice(0, maxLength).join('') + "...";
};

const selectRandomHook = (): string => {
  return HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)];
};

const truncateToLength = (text: string, maxLength: number): string => {
  const characters = Array.from(text);
  if (characters.length <= maxLength) {
    return text;
  }

  if (maxLength <= 3) {
    return characters.slice(0, maxLength).join('');
  }

  const truncated = characters.slice(0, maxLength - 3).join('').trimEnd();
  return `${truncated}...`;
};

/**
 * Xの文字数カウントロジック
 * 半角文字（ASCII）: 0.5文字としてカウント
 * 全角文字（日本語など）: 1文字としてカウント
 * 合計で280（半角換算）= 全角140文字相当
 */
const getCharacterLength = (text: string): number => {
  let count = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    // ASCII範囲（半角）は0.5、それ以外（全角）は1としてカウント
    if (code <= 0x7F) {
      count += 0.5;
    } else {
      count += 1;
    }
  }
  return count;
};

/**
 * Enhanced版のXシェアテキスト生成
 *
 * フォーマット:
 * ```
 * {絵文字} {フック}
 *
 * {要約（80-100文字）}
 *
 * 詳細👇
 * {URL}
 *
 * #AI #GlotNexus
 * ```
 */
export function buildXShareText({
  title,
  url,
  summary,
  sourceName = ''
}: BuildXShareTextOptions): string {
  const normalizedUrl = url.trim();

  // フック生成
  const emoji = getSourceEmoji(sourceName);
  const topic = extractTopic(title.trim());
  const source = sourceName.replace(" Blog", "").replace(" News", "");
  const hookTemplate = selectRandomHook();
  const hook = hookTemplate
    .replace("{topic}", topic)
    .replace("{source}", source || "AI企業")
    .replace("{emoji}", emoji);

  // 要約（80-100文字に切り詰め）
  const valueProposition = (() => {
    if (summary && summary.trim()) {
      return truncateToLength(summary.trim(), 100);
    }
    return truncateToLength(title.trim(), 100);
  })();

  // 固定ハッシュタグ（2個）
  const hashtags = "#AI #GlotNexus";

  // CTA
  const ctaLine = "詳細👇";

  // 組み立て
  const fullText = [hook, "", valueProposition, "", ctaLine, normalizedUrl, "", hashtags].join("\n");

  // 文字数チェック（URLは t.co 短縮で23文字固定として計算）
  const T_CO_LENGTH = 23;
  const textWithoutUrl = fullText.replace(normalizedUrl, '');
  const effectiveLength = getCharacterLength(textWithoutUrl) + T_CO_LENGTH;

  if (effectiveLength <= MAX_X_POST_LENGTH) {
    return fullText;
  }

  // 長すぎる場合は要約を短縮
  // 固定部分の長さを計算（フック + CTA + URL(23) + ハッシュタグ + 改行）
  const hookLength = getCharacterLength(hook);
  const ctaLength = getCharacterLength(ctaLine);
  const hashtagsLength = getCharacterLength(hashtags);
  // 改行: hook\n\n + value\n\n + cta\n + url\n\n + hashtags = 8改行 = 4文字分
  const newlineOverhead = 4;
  const fixedLength = hookLength + ctaLength + T_CO_LENGTH + hashtagsLength + newlineOverhead;
  const availableForValue = MAX_X_POST_LENGTH - fixedLength;

  if (availableForValue > 10) {
    const shortValue = truncateToLength(valueProposition, Math.floor(availableForValue));
    return [hook, "", shortValue, "", ctaLine, normalizedUrl, "", hashtags].join("\n");
  }

  // 極端に長い場合はフックとURL + ハッシュタグのみ
  return [hook, "", ctaLine, normalizedUrl, "", hashtags].join("\n");
}
