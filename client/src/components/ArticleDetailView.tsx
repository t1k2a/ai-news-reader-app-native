import { useEffect, useRef } from 'react';
import { stripHtmlTags } from '../lib/utils';
import { BookmarkButton } from './BookmarkButton';

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

interface ArticleDetailViewProps {
  article: AINewsItem | null;
  onClose: () => void;
  showOriginal: boolean;
  onToggleOriginal: () => void;
}

export function ArticleDetailView({ 
  article, 
  onClose, 
  showOriginal, 
  onToggleOriginal 
}: ArticleDetailViewProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  
  // 記事が変更されたらスクロール位置をリセット
  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  // 詳細ビューが表示されてないときはnullを返す
  if (!article) return null;
  
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

  // 現在表示する言語のコンテンツを取得
  const displayTitle = showOriginal && article.originalTitle ? article.originalTitle : article.title;
  
  // 本文コンテンツの取得とフォールバック
  let displayContent = '';
  if (showOriginal && article.originalContent) {
    displayContent = article.originalContent;
  } else if (article.content) {
    displayContent = article.content;
  } else {
    // コンテンツがない場合は要約を表示
    displayContent = `<p>${article.summary}</p>`;
  }
  
  console.log('記事詳細 - コンテンツ:', {
    content: article.content?.substring(0, 100) + '...',
    originalContent: article.originalContent?.substring(0, 100) + '...',
    displaying: displayContent.substring(0, 100) + '...'
  });
  
  return (
    <div className="article-detail-overlay active" onClick={onClose}>
      <div
        ref={detailRef}
        className="article-detail-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1">
                <span className="font-medium text-blue-400">{article.sourceName}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(article.publishDate)} JST</span>
              </div>
              
              <h2 className="text-2xl font-bold mb-3">{displayTitle}</h2>
              
              {/* カテゴリタグ */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.categories.map(category => (
                    <span 
                      key={category} 
                      className="inline-block px-2 py-0.5 bg-slate-700/80 text-xs text-slate-300 rounded-full border border-slate-600/50"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {article.sourceLanguage === 'en' && (
                <button 
                  onClick={onToggleOriginal}
                  className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full transition-colors"
                >
                  {showOriginal ? '翻訳を表示' : '原文を表示'}
                </button>
              )}
              
              <BookmarkButton article={article} />
              
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-300 p-1"
                aria-label="閉じる"
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
          
          {/* 本文 */}
          <div className="flex-1 overflow-y-auto">
            <div className="prose prose-invert prose-sm sm:prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: displayContent }} />
            </div>
          </div>
          
          {/* フッター */}
          <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                window.open(article.link, '_blank', 'noopener,noreferrer');
              }}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <span>元の記事を読む</span>
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            
            <div className="text-sm text-slate-400">
              AI News Reader
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}