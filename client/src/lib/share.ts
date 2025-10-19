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
  const uniqueTags = new Set<string>();
  categories.forEach(category => {
    const sanitized = sanitizeCategoryForHashtag(category);
    if (sanitized) {
      uniqueTags.add(`#${sanitized}`);
    }
  });
  return Array.from(uniqueTags);
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

  const withSummary = composeShareText(title, url, hashtags, normalizedSummary);
  if (withSummary.length <= MAX_X_POST_LENGTH) {
    return withSummary;
  }

  const withoutSummary = composeShareText(title, url, hashtags);
  if (withoutSummary.length <= MAX_X_POST_LENGTH) {
    return withoutSummary;
  }

  return withoutSummary.slice(0, MAX_X_POST_LENGTH);
}

export interface ShareArticleToXOptions extends BuildXShareTextOptions {}

export async function shareArticleToX(options: ShareArticleToXOptions): Promise<void> {
  const text = buildXShareText(options);

  if (typeof navigator !== 'undefined') {
    const nav = navigator as Navigator & {
      share?: (data?: ShareData) => Promise<void>;
    };

    if (typeof nav.share === 'function') {
      try {
        await nav.share({ text, url: options.url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.warn('Navigator share failed, falling back to intent URL.', error);
      }
    }
  }

  if (typeof window !== 'undefined') {
    const shareIntentUrl = new URL('https://twitter.com/intent/tweet');
    shareIntentUrl.searchParams.set('text', text);
    shareIntentUrl.searchParams.set('url', options.url);
    window.open(shareIntentUrl.toString(), '_blank', 'noopener,noreferrer');
  }
}
