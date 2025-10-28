import { useBookmarks, BookmarkedArticle } from '../lib/stores/useBookmarks';

interface BookmarkButtonProps {
  article: {
    id: string;
    title: string;
    link: string;
    summary: string;
    publishDate: string;
    sourceName: string;
  };
  className?: string;
}

export function BookmarkButton({ article, className = '' }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.id);
  
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (bookmarked) {
      removeBookmark(article.id);
    } else {
      const bookmarkArticle: BookmarkedArticle = {
        id: article.id,
        title: article.title,
        link: article.link,
        summary: article.summary,
        publishDate: article.publishDate,
        sourceName: article.sourceName,
        bookmarkedAt: new Date().toISOString()
      };
      addBookmark(bookmarkArticle);
    }
  };
  
  return (
    <button
      onClick={handleBookmarkToggle}
      className={`inline-flex items-center justify-center rounded-full border p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
        bookmarked
          ? 'border-amber-400/60 bg-amber-400/10 text-amber-300 shadow-[0_12px_28px_-20px_rgba(251,191,36,0.8)] hover:border-amber-300/80 hover:bg-amber-400/20 hover:text-amber-200 focus-visible:ring-amber-300'
          : 'border-slate-600/60 bg-slate-700/40 text-slate-300 hover:border-slate-500 hover:bg-slate-600/60 hover:text-slate-200 focus-visible:ring-slate-300'
      } ${className}`}
      title={bookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
      aria-label={bookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
    >
      {bookmarked ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      )}
    </button>
  );
}