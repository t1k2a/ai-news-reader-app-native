import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HTML文字列を安全に処理し、よりよく表示するためのヘルパー関数
 */
function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // HTML内容がほとんどない場合はデバッグ情報を表示
  if (html.length < 100) {
    console.log('Warning: Very short HTML content to sanitize:', html);
  }
  
  try {
    // 基本的な処理 - スクリプトタグを削除
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '') // onClick等のイベントハンドラを削除
      
      // <hr>タグをより見やすい区切りに置き換え
      .replace(/<hr\s*\/?>|<hr\s+[^>]*>/gi, '<div class="border-t border-slate-600 my-6"></div>')
      
      // __HTML_TAG_や__IMG_PLACEHOLDER_などの置換文字列を削除（翻訳プロセスの残骸）
      .replace(/__HTML_TAG_\d+__|__IMG_PLACEHOLDER_\d+__/g, '')
      
      // 画像のレスポンシブ対応
      .replace(/<img(.*?)>/gi, (match, attributes) => {
        // width/heightの固定値を削除し、classを追加
        const cleanedAttributes = attributes
          .replace(/width=["'](\d+)["']/g, '')
          .replace(/height=["'](\d+)["']/g, '');
        
        return `<img${cleanedAttributes} class="max-w-full h-auto rounded-md my-4 mx-auto" loading="lazy">`;
      })
      
      // リンクを安全に開く
      .replace(/<a(.*?)>/gi, '<a$1 target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">')
      
      // 不足している閉じタグを修正
      .replace(/<p([^>]*)>([^<]*)/gi, (match, attributes, content) => {
        // 段落内容と閉じタグの追加を確認
        if (!match.includes('</p>')) {
          return `<p${attributes}>${content}</p>`;
        }
        return match;
      });

    // HTML内容が不足している場合はタグを追加
    if (!cleaned.includes('<p') && !cleaned.includes('<div') && !cleaned.includes('<h')) {
      // 空白行で分割して段落にする
      const paragraphs = cleaned.split(/\n\s*\n|\r\n\s*\r\n/);
      if (paragraphs.length > 1) {
        cleaned = paragraphs.map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('\n');
      } else {
        cleaned = `<p>${cleaned}</p>`;
      }
    }
    
    // 文字実体参照の修正
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
      
    return cleaned;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // エラーが発生した場合でも何らかのコンテンツを返す
    return `<p>${html.replace(/<\/?[^>]+(>|$)/g, "")}</p>`;
  }
}

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
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [fullTranslationLoaded, setFullTranslationLoaded] = useState(true);
  
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
      
      // 翻訳コンテンツの品質チェック
      if (article.originalContent && article.content) {
        const contentRatio = article.content.length / article.originalContent.length;
        setFullTranslationLoaded(contentRatio > 0.7);
      }
      
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
            className="relative w-full max-w-2xl h-full bg-slate-900 shadow-xl overflow-y-auto overscroll-contain border-l border-slate-700 flex flex-col"
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
                {/* 並べて表示モード */}
                {showSideBySide && article.originalContent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-r border-slate-700/50 pr-4">
                      <h3 className="text-lg text-blue-400 font-semibold mb-2">日本語</h3>
                      <div 
                        className="leading-relaxed article-content"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeHtml(article.content)
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg text-amber-400 font-semibold mb-2">原文</h3>
                      <div 
                        className="leading-relaxed article-content"
                        dangerouslySetInnerHTML={{ 
                          __html: sanitizeHtml(article.originalContent)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // 通常の表示モード
                  <div 
                    className="leading-relaxed article-content"
                    dangerouslySetInnerHTML={{ 
                      __html: showOriginal && article.originalContent 
                        ? sanitizeHtml(article.originalContent) 
                        : sanitizeHtml(article.content) 
                    }}
                  />
                )}
                
                {/* 全文表示ボタン - 常に表示（デフォルトで両言語表示を優先） */}
                {article.originalContent && !showSideBySide && (
                  <div className="mt-6 p-3 bg-green-900/30 rounded border border-green-800/50 text-sm">
                    <p className="font-medium text-green-300">表示オプション:</p>
                    <p className="text-green-200">
                      この記事は{article.sourceLanguage === 'en' ? '英語から日本語に翻訳' : '日本語'}の記事です。
                      {!fullTranslationLoaded && article.sourceLanguage === 'en' && ' 記事の全文表示が必要な場合は以下のオプションをお試しください。'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          setShowSideBySide(true);
                          setShowOriginal(false);
                        }}
                        className="px-3 py-1 bg-green-700/50 text-green-200 rounded hover:bg-green-700 transition-colors"
                      >
                        両言語を並べて表示
                      </button>
                      <button 
                        onClick={() => {
                          setShowOriginal(true);
                          setShowSideBySide(false);
                        }}
                        className="px-3 py-1 bg-blue-700/50 text-blue-200 rounded hover:bg-blue-700 transition-colors"
                      >
                        {article.sourceLanguage === 'en' ? '原文のみ表示 (English)' : '元の表示に戻す'}
                      </button>
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-amber-700/50 text-amber-200 rounded hover:bg-amber-700 transition-colors"
                      >
                        元サイトで読む
                      </a>
                    </div>
                  </div>
                )}
                
                {/* オリジナルコンテンツがあり、翻訳コンテンツが不完全または短すぎる場合のメッセージ */}
                {!showOriginal && !showSideBySide && 
                  article.originalContent && 
                  article.content && 
                  (article.content.length < article.originalContent.length * 0.7 || 
                   article.content.length < 300) && (
                  <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-800/50 text-sm">
                    <p className="font-medium text-blue-300">翻訳情報:</p>
                    <p className="text-blue-200">
                      この記事は全文翻訳が不完全または一部しか翻訳されていない可能性があります。
                      {article.content.length < 300 && ' 翻訳されたコンテンツが短すぎます。'}
                    </p>
                    <div className="mt-1 text-xs text-blue-200 opacity-75">
                      翻訳テキスト長: {article.content.length} 文字
                      {article.originalContent && ` / 元テキスト長: ${article.originalContent.length} 文字`}
                      {article.originalContent && ` (${Math.round(article.content.length / article.originalContent.length * 100)}%)`}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          setShowOriginal(true);
                          setShowSideBySide(false);
                        }}
                        className="px-3 py-1 bg-blue-700/50 text-blue-200 rounded hover:bg-blue-700 transition-colors"
                      >
                        原文を表示する
                      </button>
                      <button 
                        onClick={() => {
                          setShowSideBySide(true);
                          setShowOriginal(false);
                        }}
                        className="px-3 py-1 bg-green-700/50 text-green-200 rounded hover:bg-green-700 transition-colors"
                      >
                        両言語を並べて表示
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 記事のコンテンツがない場合のメッセージ */}
                {article.content && 
                 article.content.trim().length < 50 && (
                  <div className="mt-6 p-4 bg-amber-900/30 rounded border border-amber-800/50 text-sm">
                    <p className="font-medium text-amber-300">コンテンツ情報:</p>
                    <p className="text-amber-200">
                      この記事のコンテンツが取得できませんでした。原文を表示するか、元記事のリンクから直接閲覧してください。
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {article.originalContent && (
                        <button 
                          onClick={() => {
                            setShowOriginal(true);
                            setShowSideBySide(false);
                          }}
                          className="px-3 py-1 bg-blue-700/50 text-blue-200 rounded hover:bg-blue-700 transition-colors"
                        >
                          原文を表示する
                        </button>
                      )}
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-amber-700/50 text-amber-200 rounded hover:bg-amber-700 transition-colors"
                      >
                        元の記事を読む
                      </a>
                    </div>
                  </div>
                )}
                
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
                    <>
                      {showSideBySide ? (
                        <button 
                          onClick={() => {
                            setShowSideBySide(false);
                            setShowOriginal(false);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
                        >
                          日本語のみに切り替え
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setShowOriginal(!showOriginal);
                              setShowSideBySide(false);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full transition-colors"
                          >
                            {showOriginal ? '日本語に切り替え' : '原文に切り替え (English)'}
                          </button>
                          
                          <button 
                            onClick={() => {
                              setShowSideBySide(true);
                              setShowOriginal(false);
                            }}
                            className="px-4 py-2 bg-green-800 hover:bg-green-700 text-slate-200 rounded-full transition-colors"
                          >
                            両言語を並べて表示
                          </button>
                        </>
                      )}
                    </>
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