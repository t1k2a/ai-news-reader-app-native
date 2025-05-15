import { useState } from 'react';
import { stripHtmlTags } from '../lib/utils';
import { BookmarkButton } from './BookmarkButton';
import { ArticleDetailView } from './ArticleDetailView';

interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  publishDate: string;
  sourceName: string;
  sourceLanguage: string;
  categories: string[];
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
}

interface NewsItemProps {
  item: AINewsItem;
}

export function NewsItem({ item }: NewsItemProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const handleOpenDetail = () => {
    setIsDetailOpen(true);
    document.body.style.overflow = 'hidden';
  };
  
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    document.body.style.overflow = '';
  };
  
  const handleToggleOriginal = () => {
    setShowOriginal(!showOriginal);
  };
  
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
  
  return (
    <>
      {isDetailOpen && (
        <ArticleDetailView 
          article={item} 
          onClose={handleCloseDetail} 
          showOriginal={showOriginal} 
          onToggleOriginal={handleToggleOriginal} 
        />
      )}
      
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700/50 shadow-md cursor-pointer"
        onClick={handleOpenDetail}
      >
        <div className="flex items-start p-4">
          <div className="flex-1">
            <div className="flex items-center text-sm text-gray-600 dark:text-slate-400 mb-1">
              <span className="font-medium text-blue-600 dark:text-blue-400">{item.sourceName}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(item.publishDate)} JST</span>
            </div>
            
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.categories.map(category => (
                  <span 
                    key={category} 
                    className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-slate-700/80 text-xs text-blue-800 dark:text-slate-200 rounded-full border border-blue-200 dark:border-slate-600/50"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              {showOriginal && item.originalTitle ? item.originalTitle : item.title}
            </h3>
            
            <div className="prose prose-sm dark:prose-invert max-w-none bg-blue-50 dark:bg-slate-800/50 p-3 rounded-md text-gray-800 dark:text-gray-200">
              <p>{stripHtmlTags(showOriginal && item.originalSummary ? item.originalSummary : item.summary)}</p>
            </div>
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.sourceLanguage === 'en' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOriginal(!showOriginal);
                  }}
                  className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-full transition-colors"
                >
                  {showOriginal ? '翻訳を表示' : '原文を表示'}
                </button>
              )}
              <BookmarkButton article={item} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}