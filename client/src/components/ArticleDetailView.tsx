import { useEffect, useRef } from 'react';
import { stripHtmlTags } from '../lib/utils';
import { BookmarkButton } from './BookmarkButton';
import { TwitterShareWidget } from './TwitterShareWidget';
import { buildXShareText } from '../lib/share';

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
  // 詳細ビューのDOM参照
  const detailRef = useRef<HTMLDivElement>(null);
  
  // ビューが開いた時に現在のスクロール位置を記憶
  useEffect(() => {
    // スクロール禁止
    document.body.style.overflow = 'hidden';
    
    // クリーンアップ
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
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
  const shareSummary = summary || firstParagraph;
  const shareSnippet = (() => {
    const normalized = (shareSummary ?? '')
      .replace(/\s+/gu, ' ')
      .trim();
    return Array.from(normalized).slice(0, 100).join('').trim();
  })();
  const detailUrl = (() => {
    const publicBaseUrl = import.meta.env.VITE_PUBLIC_URL;
    const fallbackUrl = typeof window === 'undefined'
      ? article.link
      : window.location.href;

    try {
      const base = (() => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return window.location.origin;
          }
        }

        return publicBaseUrl?.trim()
          ? publicBaseUrl.trim().replace(/\/+$/u, '')
          : fallbackUrl;
      })();

      const url = new URL(base);
      url.searchParams.set('article', article.id);
      return url.toString();
    } catch (_error) {
      return article.link;
    }
  })();
  const widgetShareText = buildXShareText({
    title: displayTitle,
    url: detailUrl,
    categories: article.categories,
    summary: shareSnippet
  });
  
  // 要約と最初の段落の長さをログに出力（デバッグ用）
  console.log('記事詳細 - コンテンツサイズ:', {
    summaryLength: article.summary?.length || 0,
    originalSummaryLength: article.originalSummary?.length || 0,
    firstParagraphLength: article.firstParagraph?.length || 0,
    originalFirstParagraphLength: article.originalFirstParagraph?.length || 0
  });
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={detailRef}
        className="w-full h-full md:w-11/12 md:max-w-4xl md:h-auto md:max-h-[90vh] mx-auto md:my-10 bg-white dark:bg-slate-900 rounded-none md:rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（固定） */}
        <header className="p-3 md:p-4 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{article.sourceName}</span>
              {article.sourceLanguage === 'en' && (
                <button 
                  onClick={onToggleOriginal}
                  className="text-xs font-medium px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-full transition-colors"
                >
                  {showOriginal ? '翻訳' : '原文'}
                </button>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400 md:ml-2">{formatDate(article.publishDate)} JST</span>
          </div>
          
          <div className="flex items-center gap-2">
            <BookmarkButton article={article} />
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300 p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full"
              aria-label="閉じる"
            >
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>
        
        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          <article className="p-4 md:p-6">
            {/* タイトル */}
            <h1 className="text-xl md:text-2xl font-bold mb-3 text-gray-900 dark:text-white leading-tight">
              {displayTitle}
            </h1>
            
            {/* カテゴリタグ */}
            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {article.categories.map(category => (
                  <span 
                    key={category} 
                    className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-slate-700/60 dark:text-slate-300 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
            
            {/* 最初の段落 */}
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200">記事の要約</h2>
              <div className="bg-blue-50 dark:bg-slate-800/50 p-4 rounded-lg border-l-4 border-blue-500 text-gray-800 dark:text-gray-200">
                {summary.split('\n').map((paragraph: string, index: number) => (
                  paragraph.trim() ? <p key={index} className="mb-3 text-sm leading-relaxed">{paragraph}</p> : null
                ))}
              </div>
            </div>
          </article>
        </div>
        
        {/* フッター（固定） */}
        <footer className="p-3 md:p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row gap-2">
            <TwitterShareWidget
              text={widgetShareText}
            />
            <button
              onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')}
              className="w-full md:w-auto flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
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
        </footer>
      </div>
    </div>
  );
}
