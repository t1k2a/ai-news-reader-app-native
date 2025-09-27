import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NewsItem } from './NewsItem';
import { LoadingSpinner } from './LoadingSpinner';
import { NewContentBanner } from './NewContentBanner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { AI_CATEGORIES } from '../lib/constants';
import { getCachedData, setCachedData } from '../lib/utils';

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

interface NewsTimelineProps {
  selectedSource: string | null;
}

// カテゴリボタンコンポーネント
function CategoryButton({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap border ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-500'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600/50'
      }`}
    >
      {category === null ? 'すべて' : category}
    </button>
  );
}

export function NewsTimeline({ selectedSource }: NewsTimelineProps) {
  // 1ページあたりの表示件数
  const PAGE_SIZE = 10;
  
  // 無限スクロール用の要素参照
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // 表示アイテム数の状態
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // 選択したカテゴリ
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 前回取得時のデータを保持
  const [previousNewsCount, setPreviousNewsCount] = useState(0);
  // 新着記事の数
  const [newContentCount, setNewContentCount] = useState(0);
  
  // カテゴリを選択する関数
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setVisibleCount(PAGE_SIZE); // カテゴリが変わったら初期表示数に戻す
  };
  
  // ソースが変更されたら表示数リセット
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedSource]);
  
  // 定期的な更新間隔（ミリ秒）
  const AUTO_REFRESH_INTERVAL = 60000; // 1分
  
  // キャッシュキー（ソース・カテゴリ別）
  const cacheKey = `news:${selectedSource ?? 'all'}:${selectedCategory ?? 'all'}`;

  // React Queryを使用したキャッシュ対応データフェッチ
  const { data: news, isLoading, error, refetch } = useQuery<AINewsItem[], Error>({
    queryKey: ['news', selectedSource, selectedCategory],
    queryFn: async () => {
      const url = selectedSource
        ? `/api/news/source/${encodeURIComponent(selectedSource)}`
        : '/api/news';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('ニュースの取得に失敗しました');
      }
      
      let data = await response.json();
      
      // カテゴリでフィルタリング
      if (selectedCategory) {
        data = data.filter((item: AINewsItem) => 
          item.categories && item.categories.includes(selectedCategory)
        );
      }
      
      return data;
    },
    staleTime: 60000, // 1分間はキャッシュを新鮮とみなす
    refetchOnWindowFocus: false, // ウィンドウフォーカス時に再取得しない
    initialData: () =>
      getCachedData<AINewsItem[]>(cacheKey, 5 * 60 * 1000) ?? undefined,
    onSuccess: data => {
      setCachedData(cacheKey, data);
    },
  });
  
  // 追加のアイテムを読み込む関数
  const loadMoreItems = useCallback(() => {
    if (news && visibleCount < news.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, news.length));
    }
  }, [news, visibleCount]);
  
  // 新着コンテンツを確認
  useEffect(() => {
    if (news) {
      // 前回のデータがある場合、新着記事数を計算
      if (previousNewsCount > 0 && news.length > previousNewsCount) {
        setNewContentCount(news.length - previousNewsCount);
      }
      // 現在のニュース数を保存
      setPreviousNewsCount(news.length);
    }
  }, [news, previousNewsCount]);
  
  // 定期的な自動更新
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  // 新着通知をクリックした時の処理
  const handleRefresh = useCallback(() => {
    refetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNewContentCount(0);
  }, [refetch]);
  
  // 無限スクロールの設定
  const hasMore = news ? visibleCount < news.length : false;
  useInfiniteScroll(loaderRef, hasMore, loadMoreItems);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-red-200">エラー</h3>
        <p className="text-red-100">{error.message}</p>
      </div>
    );
  }

  
  // 表示するアイテムを取得
  const visibleItems = news.slice(0, visibleCount);
  
  return (
    <div className="space-y-4 pb-8">
      {/* 新着通知バナー */}
      <NewContentBanner newContentCount={newContentCount} onRefresh={handleRefresh} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold pl-2 border-l-4 border-blue-500">
          {selectedSource ? `${selectedSource}のニュース` : '最新AI関連ニュース'}
          {selectedCategory && ` - ${selectedCategory}`}
        </h2>
        
        <div className="text-sm text-slate-400">
          {news.length}件の記事 ({visibleCount < news.length ? `${visibleCount}/${news.length}表示` : '全て表示'})
        </div>
      </div>
      
      {/* カテゴリ選択UI */}
      <div className="flex flex-wrap gap-2 pb-3 pt-1 overflow-x-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pb-2 -mx-2 px-2">
        <CategoryButton 
          category={null} 
          isSelected={selectedCategory === null} 
          onClick={() => handleCategorySelect(null)} 
        />
        
        {Object.values(AI_CATEGORIES).map(category => (
          <CategoryButton 
            key={category} 
            category={category} 
            isSelected={selectedCategory === category} 
            onClick={() => handleCategorySelect(category)} 
          />
        ))}
      </div>

        {!news || news.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-lg text-center">
            <p className="text-lg text-slate-300">記事が見つかりませんでした</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain">
            {/* 表示アイテム */}
            {visibleItems.map((item) => (
              <div key={item.id}>
                <NewsItem item={item} />
              </div>
            ))}
            
            {/* 無限スクロール用のローディング要素 */}
            {hasMore && (
              <div ref={loaderRef} className="py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {/* すべて表示したメッセージ */}
            {!hasMore && news.length > 0 && (
              <div className="text-center py-4 text-slate-400 text-sm">
                すべての記事を表示しました
              </div>
            )}
          </div>
        </>
        )}
      

    </div>
  );
}