import { useEffect, useMemo, useRef } from 'react';

interface TwitterShareWidgetProps {
  text: string;
  size?: 'default' | 'large';
  className?: string;
}

const TWITTER_WIDGET_SRC = 'https://platform.twitter.com/widgets.js';

const loadTwitterWidgets = (container?: HTMLElement | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const maybeTwitter = (window as unknown as {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }).twttr;

  const invokeLoad = () => {
    maybeTwitter?.widgets?.load(container ?? undefined);
  };

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TWITTER_WIDGET_SRC}"]`);
  if (existingScript) {
    if (maybeTwitter?.widgets) {
      invokeLoad();
    } else {
      existingScript.addEventListener('load', invokeLoad, { once: true });
    }
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = TWITTER_WIDGET_SRC;
  script.charset = 'utf-8';
  script.addEventListener('load', invokeLoad, { once: true });
  document.body.appendChild(script);
};

export function TwitterShareWidget({ text, size = 'default', className }: TwitterShareWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const normalizedText = useMemo(() => text.trim(), [text]);

  useEffect(() => {
    if (!anchorRef.current) {
      return;
    }

    const anchor = anchorRef.current;
    anchor.textContent = 'Tweet';
    if (normalizedText) {
      anchor.setAttribute('data-text', normalizedText);
    } else {
      anchor.removeAttribute('data-text');
    }

    anchor.setAttribute('data-show-count', 'false');

    if (size === 'large') {
      anchor.setAttribute('data-size', 'large');
    } else {
      anchor.removeAttribute('data-size');
    }

    loadTwitterWidgets(containerRef.current);
  }, [normalizedText, size]);

  return (
    <div ref={containerRef} className={className}>
      <a
        ref={anchorRef}
        href="https://twitter.com/share?ref_src=twsrc%5Etfw"
        className="twitter-share-button"
        data-show-count="false"
      >
        Tweet
      </a>
    </div>
  );
}
