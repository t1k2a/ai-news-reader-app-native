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
  const getSummary = () => {
    if (showOriginal && article.originalSummary) {
      return article.originalSummary;
    } else {
      return article.summary;
    }
  };
  
  const getFullContent = () => {
    if (showOriginal && article.originalContent) {
      return article.originalContent;
    } else {
      return article.content;
    }
  };
  
  const summary = getSummary();
  const fullContent = getFullContent();
  
  // コンテンツの長さをログに出力（デバッグ用）
  console.log('記事詳細 - コンテンツサイズ:', {
    summaryLength: article.summary?.length || 0,
    contentLength: article.content?.length || 0,
    originalSummaryLength: article.originalSummary?.length || 0,
    originalContentLength: article.originalContent?.length || 0
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
            <div className="prose prose-invert prose-sm sm:prose max-w-none px-4 py-2">
              {/* 記事要約 */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-4">記事の要約</h3>
                <div className="leading-relaxed bg-slate-800/50 p-4 rounded-md border-l-4 border-blue-500">
                  {summary.split('\n').map((paragraph: string, index: number) => (
                    paragraph.trim() ? <p key={index} className="mb-4">{paragraph}</p> : null
                  ))}
                </div>
              </div>
              
              {/* 記事の本文 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">記事の本文</h3>
                <div className="leading-relaxed">
                  {fullContent.split('\n').map((paragraph: string, index: number) => (
                    paragraph.trim() ? <p key={index} className="mb-4">{paragraph}</p> : null
                  ))}
                </div>
              </div>
              
              {/* 記事リンク */}
              <div className="mt-6">
                <button 
                  onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')} 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <span>続きを元の記事で読む</span>
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
                </button>
              </div>
            </div>
          </div>
          
          {/* フッター */}
          <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">            
            <div className="text-sm text-slate-400">
              AI News Reader © 2025
            </div>
            
            <BookmarkButton article={article} />
          </div>
        </div>
      </div>
    </div>
  );
}