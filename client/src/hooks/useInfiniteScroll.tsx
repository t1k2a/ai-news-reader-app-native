import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // スクロールのしきい値（0から1の間、デフォルトは0.8）
  initialPage?: number; // 初期ページ番号
}

/**
 * 無限スクロールを実装するカスタムフック
 * @param targetRef スクロール監視対象のDOM要素への参照
 * @param hasMore 追加のコンテンツが存在するかどうか
 * @param loadMore 追加コンテンツを読み込む関数
 * @param options オプション設定
 */
export function useInfiniteScroll(
  targetRef: RefObject<HTMLElement>, 
  hasMore: boolean, 
  loadMore: () => void,
  options?: UseInfiniteScrollOptions
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const threshold = options?.threshold || 0.8;
  const [page, setPage] = useState(options?.initialPage || 1);
  
  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);
      
      if (entry.isIntersecting && hasMore) {
        loadMore();
        setPage(prev => prev + 1);
      }
    },
    [hasMore, loadMore]
  );
  
  useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, {
      root: null, // ビューポートを使用
      rootMargin: '0px',
      threshold, // 要素がどのくらい見えたらコールバックを実行するか
    });
    
    const currentTarget = targetRef.current;
    
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [targetRef, onIntersect, threshold]);
  
  return { isIntersecting, page };
}