import { MouseEvent } from 'react';
import { cn } from '../lib/utils';
import { shareArticleToX, ShareArticleToXOptions } from '../lib/share';

interface ShareButtonProps extends ShareArticleToXOptions {
  label?: string;
  className?: string;
}

export function ShareButton({
  title,
  url,
  categories,
  summary,
  label = 'Xでシェア',
  className
}: ShareButtonProps) {
  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await shareArticleToX({ title, url, categories, summary });
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700',
        className
      )}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M4.5 4h4.2l3.18 4.68L15.9 4H20l-6.3 7.23L20 20h-4.2l-3.44-4.95L8.1 20H4l6.39-7.35L4.5 4Z" />
      </svg>
      {label && <span>{label}</span>}
    </button>
  );
}
