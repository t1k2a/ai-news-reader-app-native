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
      className={`text-sm p-2 rounded-full transition-colors ${
        bookmarked 
          ? 'text-yellow-400 hover:text-yellow-300' 
          : 'text-slate-400 hover:text-slate-300'
      } ${className}`}
      title={bookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
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