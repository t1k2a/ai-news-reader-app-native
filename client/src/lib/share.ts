export const MAX_X_POST_LENGTH = 140;

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

const getCharacterLength = (text: string): number => {
  return Array.from(text).length;
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
  const normalizedSummary = summary
    ?.replace(/\s+/gu, ' ')
    .trim();

  const withoutSummary = composeShareText(title, url, hashtags);
  const withoutSummaryLength = getCharacterLength(withoutSummary);
  if (!normalizedSummary) {
    return sliceCharacters(withoutSummary, MAX_X_POST_LENGTH);
  }

  const withSummary = composeShareText(title, url, hashtags, normalizedSummary);
  if (getCharacterLength(withSummary) <= MAX_X_POST_LENGTH) {
    return withSummary;
  }

  const separatorLength = withoutSummaryLength > 0 ? 2 : 0;
  const availableForSummary = MAX_X_POST_LENGTH - withoutSummaryLength - separatorLength;
  if (availableForSummary <= 0) {
    return sliceCharacters(withoutSummary, MAX_X_POST_LENGTH);
  }

  const truncatedSummary = truncateToLength(normalizedSummary, availableForSummary).trimEnd();
  if (!truncatedSummary) {
    return sliceCharacters(withoutSummary, MAX_X_POST_LENGTH);
  }

  const truncatedShareText = composeShareText(title, url, hashtags, truncatedSummary);
  if (getCharacterLength(truncatedShareText) <= MAX_X_POST_LENGTH) {
    return truncatedShareText;
  }

  return sliceCharacters(withoutSummary, MAX_X_POST_LENGTH);
}
