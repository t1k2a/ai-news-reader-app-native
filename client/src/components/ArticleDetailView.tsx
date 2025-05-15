import { useEffect, useRef } from 'react';
import { stripHtmlTags } from '../lib/utils';
import { BookmarkButton } from './BookmarkButton';

interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  firstParagraph?: string;
  publishDate: string;
  sourceName: string;
  sourceLanguage: string;
  categories: string[];
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
  originalFirstParagraph?: string;
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
  
  // 本文コンテンツの取得とフォールバック（HTMLタグを除去）
  const getSummary = () => {
    if (showOriginal && article.originalSummary) {
      return stripHtmlTags(article.originalSummary);
    } else {
      return stripHtmlTags(article.summary);
    }
  };
  

  
  // 最初の段落を取得
  const getFirstParagraph = () => {
    if (showOriginal && article.originalFirstParagraph) {
      return stripHtmlTags(article.originalFirstParagraph);
    } else {
      return stripHtmlTags(article.firstParagraph || '');
    }
  };
  
  const summary = getSummary();
  const firstParagraph = getFirstParagraph();
  
  // 要約と最初の段落の長さをログに出力（デバッグ用）
  console.log('記事詳細 - コンテンツサイズ:', {
    summaryLength: article.summary?.length || 0,
    originalSummaryLength: article.originalSummary?.length || 0,
    firstParagraphLength: article.firstParagraph?.length || 0,
    originalFirstParagraphLength: article.originalFirstParagraph?.length || 0
  });
  
  return (
    <div className="article-detail-overlay active" onClick={onClose}>
      <div
        ref={detailRef}
        className="article-detail-container bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{article.sourceName}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(article.publishDate)} JST</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">{displayTitle}</h2>
              
              {/* カテゴリタグ */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.categories.map(category => (
                    <span 
                      key={category} 
                      className="inline-block px-3 py-1 bg-blue-100 dark:bg-slate-700/80 text-xs font-medium text-blue-800 dark:text-slate-200 rounded-full border border-blue-200 dark:border-slate-600/50"
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
                  className="text-sm font-medium px-4 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-full transition-colors shadow-sm"
                >
                  {showOriginal ? '翻訳を表示' : '原文を表示'}
                </button>
              )}
              
              <BookmarkButton article={article} />
              
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300 p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
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
            <div className="prose prose-gray dark:prose-invert prose-base sm:prose-lg max-w-none px-6 py-4">
              {/* 最初の段落 */}
              {firstParagraph && firstParagraph.trim() && (
                <div className="mt-4 max-w-5xl mx-auto">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">記事の導入</h3>
                  <div className="leading-relaxed bg-amber-50 dark:bg-amber-900/20 p-5 rounded-md border-l-4 border-amber-400 text-gray-800 dark:text-gray-200 text-lg font-medium">
                    <p>{firstParagraph}</p>
                  </div>
                </div>
              )}
              
              {/* 記事要約 */}
              <div className="mt-6 max-w-5xl mx-auto">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">記事の要約</h3>
                <div className="leading-relaxed bg-blue-50 dark:bg-slate-800/50 p-5 rounded-md border-l-4 border-blue-500 text-gray-800 dark:text-gray-200 text-base">
                  {summary.split('\n').map((paragraph: string, index: number) => (
                    paragraph.trim() ? <p key={index} className="mb-4">{paragraph}</p> : null
                  ))}
                </div>
              </div>
              
              {/* 記事リンク */}
              <div className="mt-6 text-center">
                <button 
                  onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')} 
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-base font-medium shadow-md"
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