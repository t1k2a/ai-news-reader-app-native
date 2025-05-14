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
  // 記事詳細表示の状態管理
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // 詳細を開く関数
  const handleOpenDetail = () => {
    setIsDetailOpen(true);
    // ボディのスクロールを無効化
    document.body.style.overflow = 'hidden';
  };
  
  // 詳細を閉じる関数
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // ボディのスクロールを有効化
    document.body.style.overflow = '';
  };
  
  // 原文/翻訳を切り替える関数（詳細ビュー用）
  const handleToggleOriginal = () => {
    setShowOriginal(!showOriginal);
  };
  
  // 日付のフォーマット（JSTに調整）
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
      {/* 記事詳細表示 */}
      {isDetailOpen && (
        <ArticleDetailView 
          article={item} 
          onClose={handleCloseDetail} 
          showOriginal={showOriginal} 
          onToggleOriginal={handleToggleOriginal} 
        />
      )}
      
      {/* 記事カードビュー */}
      <div 
        className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-800/80 transition-colors border border-slate-700/50 shadow-md cursor-pointer"
        onClick={handleOpenDetail}
      >
        <div className="flex items-start p-4">
          <div className="flex-1">
            <div className="flex items-center text-sm text-slate-400 mb-1">
              <span className="font-medium text-blue-400">{item.sourceName}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(item.publishDate)} JST</span>
            </div>
            
            {/* カテゴリタグ */}
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.categories.map(category => (
                  <span 
                    key={category} 
                    className="inline-block px-2 py-0.5 bg-slate-700/80 text-xs text-slate-300 rounded-full border border-slate-600/50"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            <h3 className="text-lg font-bold mb-2 text-white">
              {showOriginal && item.originalTitle ? item.originalTitle : item.title}
            </h3>
            
            <div className="prose prose-sm prose-invert max-w-none bg-slate-800/50 p-3 rounded-md">
              <p>{stripHtmlTags(showOriginal && item.originalSummary ? item.originalSummary : item.summary)}</p>
            </div>
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.sourceLanguage === 'en' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOriginal(!showOriginal);
                  }}
                  className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full transition-colors"
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