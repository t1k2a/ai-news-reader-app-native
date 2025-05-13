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
            className="relative w-full max-w-2xl h-full bg-slate-900 shadow-xl overflow-y-auto"
          >
            <div className="p-6 md:p-8">
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
              <h1 className="text-2xl font-bold text-white mb-6">
                {showOriginal && article.originalTitle ? article.originalTitle : article.title}
              </h1>
              
              {/* 記事コンテンツ */}
              <div className="prose prose-lg prose-invert max-w-none mb-8">
                <p className="whitespace-pre-line">
                  {showOriginal && article.originalContent 
                    ? article.originalContent 
                    : article.content}
                </p>
              </div>
              
              {/* フッター */}
              <div className="border-t border-slate-700 pt-6 mt-10">
                <div className="flex flex-wrap gap-3 mb-6">
                  {article.sourceLanguage === 'en' && (
                    <button 
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                    >
                      {showOriginal ? '日本語に切り替え' : '原文に切り替え (English)'}
                    </button>
                  )}
                  
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
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
                
                <div className="text-sm text-slate-400">
                  出典: <span className="font-medium text-slate-300">{article.sourceName}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}