import { useState, useEffect } from 'react';

interface NewContentBannerProps {
  newContentCount: number;
  onRefresh: () => void;
}

export function NewContentBanner({ newContentCount, onRefresh }: NewContentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // 新しいコンテンツがあるときにバナーを表示
  useEffect(() => {
    if (newContentCount > 0) {
      setIsVisible(true);
    }
  }, [newContentCount]);
  
  // クリックイベントハンドラ
  const handleClick = () => {
    onRefresh();
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-16 left-0 right-0 z-30 flex justify-center px-4 py-2 pointer-events-none">
      <button
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2 pointer-events-auto animate-bounce"
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
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        {newContentCount}件の新着記事があります
      </button>
    </div>
  );
}