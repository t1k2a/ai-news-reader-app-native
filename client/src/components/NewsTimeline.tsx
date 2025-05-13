import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { NewsItem } from './NewsItem';
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
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
}

interface NewsTimelineProps {
  selectedSource: string | null;
}

// ニュースを取得する関数
const fetchNews = async (sourceName: string | null): Promise<AINewsItem[]> => {
  let url = '/api/news';
  if (sourceName) {
    url = `/api/news/source/${encodeURIComponent(sourceName)}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('ニュースの取得に失敗しました');
  }
  return response.json();
};

// ページネーション用コンポーネント
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  // ページ数が1以下の場合は表示しない
  if (totalPages <= 1) return null;
  
  // 表示するページ番号の範囲を計算
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 最大表示ページ数
    
    // 表示するページのスタート位置を計算
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // スタート位置を調整（表示数を一定に保つため）
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
    
    // ページ番号を配列に追加
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex justify-center items-center mt-8 space-x-2">
      {/* 前へボタン */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
        }`}
      >
        ←
      </button>
      
      {/* 最初のページボタン (1ページ目が表示されていない場合) */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-md"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="text-slate-500">...</span>
          )}
        </>
      )}
      
      {/* ページ番号ボタン */}
      {pageNumbers.map(pageNum => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`px-3 py-1 rounded-md ${
            pageNum === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {pageNum}
        </button>
      ))}
      
      {/* 最後のページボタン (最終ページが表示されていない場合) */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="text-slate-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-md"
          >
            {totalPages}
          </button>
        </>
      )}
      
      {/* 次へボタン */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
        }`}
      >
        →
      </button>
    </div>
  );
}

export function NewsTimeline({ selectedSource }: NewsTimelineProps) {
  // 1ページあたりの表示件数
  const PAGE_SIZE = 5;
  
  // 現在のページ状態
  const [currentPage, setCurrentPage] = useState(1);
  // 選択した記事
  const [selectedArticle, setSelectedArticle] = useState<AINewsItem | null>(null);
  
  // 記事を選択する関数
  const handleArticleSelect = (article: AINewsItem) => {
    setSelectedArticle(article);
  };
  
  // 記事の詳細ビューを閉じる関数
  const handleCloseArticleView = () => {
    setSelectedArticle(null);
  };
  
  // ソースが変更されたら1ページ目に戻す
  useEffect(() => {
    setCurrentPage(1);
    // ソースが変更されたらディテールビューも閉じる
    setSelectedArticle(null);
  }, [selectedSource]);
  
  // React Queryを使用したキャッシュ対応データフェッチ
  const { data: news, isLoading, error } = useQuery<AINewsItem[], Error>({
    queryKey: ['news', selectedSource],
    queryFn: () => fetchNews(selectedSource),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
    retry: 1, // エラー時に1回だけリトライ
  });
  
  // スクロール位置をリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);
  
  if (isLoading) {
    return (
      <div className="w-full py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-red-200">エラー</h3>
        <p className="text-red-100">ニュースを読み込めませんでした。時間をおいて再試行してください。</p>
        <p className="text-sm text-red-200/70 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg text-center">
        <p className="text-lg text-slate-300">
          {selectedSource 
            ? `「${selectedSource}」からのニュースはありません` 
            : 'ニュースはありません'}
        </p>
      </div>
    );
  }
  
  // 総ページ数を計算
  const totalPages = Math.ceil(news.length / PAGE_SIZE);
  
  // 現在のページに表示する記事を取得
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentPageItems = news.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold pl-2 border-l-4 border-blue-500">
          {selectedSource ? `${selectedSource}のニュース` : '最新AI関連ニュース'}
        </h2>
        
        <div className="text-sm text-slate-400">
          {news.length}件の記事 ({currentPage}/{totalPages}ページ)
        </div>
      </div>
      
      <div className="space-y-4 overflow-y-auto">
        {currentPageItems.map(item => (
          <div key={item.id} onClick={() => handleArticleSelect(item)} className="cursor-pointer">
            <NewsItem item={item} />
          </div>
        ))}
      </div>
      
      {/* ページネーション */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
      
      {/* 記事詳細ビュー */}
      <ArticleDetailView 
        article={selectedArticle} 
        onClose={handleCloseArticleView}
      />
    </div>
  );
}