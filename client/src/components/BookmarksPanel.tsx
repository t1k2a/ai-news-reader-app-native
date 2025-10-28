import { useState } from 'react';
import { useBookmarks } from '../lib/stores/useBookmarks';
import { stripHtmlTags } from '../lib/utils';

export function BookmarksPanel() {
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarks();
  const [isOpen, setIsOpen] = useState(false);
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    }).format(date);
  };
  
  if (bookmarks.length === 0 && !isOpen) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-20">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(79,70,229,0.9)] transition-all duration-200 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:scale-110"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>{bookmarks.length}</span>
        </button>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl w-80 sm:w-96 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-slate-700">
            <h2 className="text-lg font-bold">ブックマーク ({bookmarks.length})</h2>
            <div className="flex gap-2">
              {bookmarks.length > 0 && (
                <button
                  onClick={clearAllBookmarks}
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-200 transition-all duration-200 hover:border-red-400/70 hover:bg-red-500/20 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                >
                  すべて削除
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-700/40 p-1 text-slate-300 transition-all duration-200 hover:border-slate-500 hover:bg-slate-600/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                aria-label="ブックマークパネルを閉じる"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto p-2 space-y-3 flex-grow">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                ブックマークはありません
              </div>
            ) : (
              bookmarks.map(bookmark => (
                <div 
                  key={bookmark.id} 
                  className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <a 
                      href={bookmark.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-grow"
                    >
                      <h3 className="font-bold text-blue-400 hover:underline">{bookmark.title}</h3>
                    </a>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 p-1 text-red-300 transition-all duration-200 hover:border-red-400/70 hover:bg-red-500/20 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                      title="削除"
                      aria-label="ブックマークから削除"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-400 mt-1">
                    <span className="font-medium">{bookmark.sourceName}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(bookmark.publishDate)} JST</span>
                  </div>
                  
                  <p className="text-sm mt-2 text-slate-300 line-clamp-2">
                    {stripHtmlTags(bookmark.summary)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}