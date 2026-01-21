// Xの文字数制限: 全角140文字（半角280文字）
export const MAX_X_POST_LENGTH = 280;

export interface BuildXShareTextOptions {
  title: string;
  url: string;
  categories?: string[];
  summary?: string;
}

const sanitizeCategoryForHashtag = (category: string): string => {
  return category
    .normalize('NFKC')
    .replace(/[\s\u3000]+/gu, '')
    .replace(/[^0-9A-Za-z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf\u3005\u303b]+/gu, '');
};

const createHashtags = (categories: string[] = []): string[] => {
  const uniqueTags: string[] = [];

  for (const category of categories) {
    const sanitized = sanitizeCategoryForHashtag(category);
    if (!sanitized) continue;

    const hashtag = `#${sanitized}`;
    if (!uniqueTags.includes(hashtag)) {
      uniqueTags.push(hashtag);
    }

    if (uniqueTags.length >= 3) {
      break;
    }
  }

  return uniqueTags;
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

const sliceCharacters = (text: string, maxLength: number): string => {
  if (maxLength < 0) {
    return '';
  }

  return Array.from(text).slice(0, maxLength).join('');
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

const composeShareText = (
  title: string,
  url: string,
  hashtags: string[],
  summary?: string
): string => {
  const parts: string[] = [];
  if (title.trim()) {
    parts.push(title.trim());
  }
  if (summary && summary.trim()) {
    parts.push(summary.trim());
  }
  if (url.trim()) {
    parts.push(url.trim());
  }
  if (hashtags.length > 0) {
    parts.push(hashtags.join(' '));
  }
  return parts.join('\n\n');
};

export function buildXShareText({
  title,
  url,
  categories = [],
  summary
}: BuildXShareTextOptions): string {
  const hashtags = createHashtags(categories);
  const serviceName = "GlotNexus";
  const tagline = "世界最先端のAIトレンド、日本語見出しで。";
  const marketingLine = `${serviceName} - ${tagline}`;

  const normalizedTitle = title.trim();
  const normalizedUrl = url.trim();
  const normalizedMarketing = marketingLine.trim();
  const hashtagsText = hashtags.length > 0 ? hashtags.join(" ") : "";

  // 優先度: タイトル > URL > サービス名・キャッチコピー > ハッシュタグ
  // 最低限タイトルとURLは確保する
  const SEPARATOR = "\n\n";
  const SEPARATOR_LENGTH = getCharacterLength(SEPARATOR);
  const MIN_TITLE_LENGTH = 20; // タイトルの最低保証文字数

  // レベル4: 全部入り（理想形）
  let parts = [normalizedTitle, normalizedUrl, normalizedMarketing, hashtagsText].filter(Boolean);
  let text = parts.join(SEPARATOR);
  
  if (getCharacterLength(text) <= MAX_X_POST_LENGTH) {
    return text;
  }

  // レベル3: ハッシュタグを削除
  parts = [normalizedTitle, normalizedUrl, normalizedMarketing].filter(Boolean);
  text = parts.join(SEPARATOR);
  
  if (getCharacterLength(text) <= MAX_X_POST_LENGTH) {
    return text;
  }

  // レベル2: サービス名・キャッチコピーも削除
  parts = [normalizedTitle, normalizedUrl].filter(Boolean);
  text = parts.join(SEPARATOR);
  
  if (getCharacterLength(text) <= MAX_X_POST_LENGTH) {
    return text;
  }

  // レベル1: タイトルとURLを両方短縮
  // タイトルに最低限の文字数を確保
  const urlLength = getCharacterLength(normalizedUrl);
  const availableSpace = MAX_X_POST_LENGTH - SEPARATOR_LENGTH;
  
  // タイトルに優先的にスペースを割り当て
  let titleSpace = Math.max(MIN_TITLE_LENGTH, availableSpace - urlLength);
  let urlSpace = availableSpace - titleSpace;
  
  // URLが短すぎる場合は調整
  if (urlSpace < 30 && urlLength > 30) {
    urlSpace = 30;
    titleSpace = availableSpace - urlSpace;
  }
  
  const truncatedTitle = truncateToLength(normalizedTitle, titleSpace).trimEnd();
  const truncatedUrl = urlSpace < urlLength 
    ? sliceCharacters(normalizedUrl, urlSpace - 3) + "..."
    : normalizedUrl;
  
  parts = [truncatedTitle, truncatedUrl].filter(Boolean);
  return sliceCharacters(parts.join(SEPARATOR), MAX_X_POST_LENGTH);
}
