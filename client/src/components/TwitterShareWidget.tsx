import { useCallback } from 'react';

interface TwitterShareWidgetProps {
  text: string;
  className?: string;
}

const TWITTER_INTENT_URL = 'https://twitter.com/intent/tweet';
const SHARE_WINDOW_WIDTH = 600;
const SHARE_WINDOW_HEIGHT = 420;

const buildShareUrl = (rawText: string) => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return TWITTER_INTENT_URL;
  }
  return `${TWITTER_INTENT_URL}?text=${encodeURIComponent(trimmed)}`;
};

export function TwitterShareWidget({ text, className }: TwitterShareWidgetProps) {
  const handleShare = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareUrl = buildShareUrl(text);
    const viewportWidth = window.outerWidth || window.innerWidth || SHARE_WINDOW_WIDTH;
    const viewportHeight = window.outerHeight || window.innerHeight || SHARE_WINDOW_HEIGHT;
    const left = window.screenX + Math.max(0, (viewportWidth - SHARE_WINDOW_WIDTH) / 2);
    const top = window.screenY + Math.max(0, (viewportHeight - SHARE_WINDOW_HEIGHT) / 2);
    const features = [
      `width=${SHARE_WINDOW_WIDTH}`,
      `height=${SHARE_WINDOW_HEIGHT}`,
      `left=${left}`,
      `top=${top}`,
      'noopener',
      'noreferrer'
    ].join(',');

    window.open(shareUrl, '_blank', features);
  }, [text]);

  const baseClassName =
    'w-full md:w-auto flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-black hover:bg-neutral-900 text-white rounded-lg transition-colors text-sm font-medium shadow-sm';

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      aria-label="Xで共有"
    >
      <span>Xでシェア</span>
    </button>
  );
}
