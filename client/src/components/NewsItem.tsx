import { useState } from 'react';

interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  publishDate: string;
  sourceName: string;
  sourceLanguage: string;
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
}

interface NewsItemProps {
  item: AINewsItem;
}

export function NewsItem({ item }: NewsItemProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-800/80 transition-colors">
      <div className="flex items-start p-4">
        <div className="flex-1">
          <div className="flex items-center text-sm text-slate-400 mb-1">
            <span className="font-medium text-blue-400">{item.sourceName}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(item.publishDate)}</span>
          </div>
          
          <h3 className="text-lg font-bold mb-2">
            {showOriginal && item.originalTitle ? item.originalTitle : item.title}
          </h3>
          
          <div className="prose prose-sm prose-invert max-w-none">
            {expanded ? (
              <p>{showOriginal && item.originalContent ? item.originalContent : item.content}</p>
            ) : (
              <p>{showOriginal && item.originalSummary ? item.originalSummary : item.summary}</p>
            )}
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              続きを読む →
            </a>
            
            {item.sourceLanguage === 'en' && (
              <button 
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                {showOriginal ? '翻訳を表示' : '原文を表示'}
              </button>
            )}
            
            {item.content && item.content.length > item.summary.length && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                {expanded ? '要約を表示' : 'もっと見る'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}