import { useQuery } from '@tanstack/react-query';
import { NewsItem } from './NewsItem';

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

export function NewsTimeline({ selectedSource }: NewsTimelineProps) {
  // React Queryを使用したキャッシュ対応データフェッチ
  const { data: news, isLoading, error } = useQuery<AINewsItem[], Error>({
    queryKey: ['news', selectedSource],
    queryFn: () => fetchNews(selectedSource),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
    retry: 1, // エラー時に1回だけリトライ
  });

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

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold pl-2 border-l-4 border-blue-500">
          {selectedSource ? `${selectedSource}のニュース` : '最新AI関連ニュース'}
        </h2>
        
        <div className="text-sm text-slate-400">
          {news.length}件の記事
        </div>
      </div>
      
      <div className="space-y-4">
        {news.map(item => (
          <NewsItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}