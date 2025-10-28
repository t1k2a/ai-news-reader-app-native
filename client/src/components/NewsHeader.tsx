import { useState } from 'react';

export function NewsHeader() {
  const [currentTime, setCurrentTime] = useState(() => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    }).format(new Date());
  });
  
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-2 sm:mb-0">
          <svg 
            viewBox="0 0 24 24" 
            width="28" 
            height="28" 
            className="text-blue-500 mr-2"
          >
            <path 
              fill="currentColor" 
              d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A2,2 0 0,0 10,6A2,2 0 0,0 12,8A2,2 0 0,0 14,6A2,2 0 0,0 12,4M10,10A2,2 0 0,0 8,12A2,2 0 0,0 10,14A2,2 0 0,0 12,12A2,2 0 0,0 10,10M16,10A2,2 0 0,0 14,12A2,2 0 0,0 16,14A2,2 0 0,0 18,12A2,2 0 0,0 16,10M12,16A2,2 0 0,0 10,18A2,2 0 0,0 12,20A2,2 0 0,0 14,18A2,2 0 0,0 12,16Z" 
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI News Reader</h1>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
          最終更新: {currentTime} JST
          <button
            onClick={() => {
              setCurrentTime(new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tokyo'
              }).format(new Date()));
              window.location.reload();
            }}
            className="group ml-3 inline-flex items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 p-1.5 text-blue-500 shadow-[0_8px_16px_-12px_rgba(59,130,246,0.75)] transition-all duration-200 hover:border-blue-400/70 hover:bg-blue-500/20 hover:text-blue-300 dark:hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            title="ニュースを更新"
            aria-label="ニュースを更新"
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
              className="transition-transform duration-200 group-hover:rotate-180 group-focus-visible:rotate-180"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
