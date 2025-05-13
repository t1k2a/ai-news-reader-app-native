import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export function ArticleDetailView({ article, onClose }: ArticleDetailViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  
  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // 記事が開かれたら本文までスクロールする
  useEffect(() => {
    if (article) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // スクロールを固定
      document.body.style.overflow = 'hidden';
      
      return () => {
        // スクロールを戻す
        document.body.style.overflow = 'auto';
      };
    }
  }, [article]);
  
  if (!article) return null;
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <AnimatePresence>
      {article && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 背景オーバーレイ */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          
          {/* 記事コンテナ */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-slate-900 shadow-xl overflow-y-auto border-l border-slate-700 flex flex-col"
          >
            <div className="p-6 md:p-8 flex-1">
              {/* ヘッダー */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-sm text-blue-400 font-medium">
                    {article.sourceName}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {formatDate(article.publishDate)}
                  </div>
                </div>
                
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 記事タイトル */}
              <h1 className="text-2xl font-bold text-white mb-4">
                {showOriginal && article.originalTitle ? article.originalTitle : article.title}
              </h1>
              
              {/* カテゴリタグ */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.categories.map(category => (
                    <span 
                      key={category} 
                      className="inline-block px-3 py-1 bg-slate-700/80 text-sm text-slate-300 rounded-full border border-slate-600/50 hover:bg-slate-600/80 transition-colors"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
              
              {/* 記事コンテンツ */}
              <div className="prose prose-lg prose-invert max-w-none mb-8 bg-slate-800/30 p-5 rounded-lg">
                <div 
                  className="whitespace-pre-line leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: showOriginal && article.originalContent 
                      ? article.originalContent 
                      : article.content 
                  }}
                />
                
                {/* 記事のメタ情報 */}
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <div className="text-sm text-slate-400 flex items-center">
                    <span className="inline-block w-4 h-4 mr-2 bg-blue-500 rounded-full"></span>
                    <span>{article.sourceName}</span>
                    <span className="mx-2">•</span>
                    <time dateTime={article.publishDate}>{formatDate(article.publishDate)}</time>
                  </div>
                </div>
              </div>
              
              {/* フッター */}
              <div className="border-t border-slate-700 pt-6 mt-8">
                {/* アクションボタン */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {article.sourceLanguage === 'en' && (
                    <button 
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
                    >
                      {showOriginal ? '日本語に切り替え' : '原文に切り替え (English)'}
                    </button>
                  )}
                  
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center"
                  >
                    元の記事を読む
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
                      className="ml-2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
                
                {/* 共有ボタン */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </button>
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </button>
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 flex items-center">
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
                    className="mr-2 text-blue-400"
                  >
                    <path d="m3 11 18-5v12L3 14v-3z"></path>
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                  </svg>
                  出典: <span className="font-medium text-slate-300 ml-1">{article.sourceName}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}