import { useState, useEffect } from 'react';
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

export function NewsTimeline({ selectedSource }: NewsTimelineProps) {
  const [news, setNews] = useState<AINewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    let url = '/api/news';
    if (selectedSource) {
      url = `/api/news/source/${encodeURIComponent(selectedSource)}`;
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('ニュースの取得に失敗しました');
        }
        return response.json();
      })
      .then(data => {
        setNews(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('ニュース取得エラー:', err);
        setError('ニュースを読み込めませんでした。時間をおいて再試行してください。');
        setIsLoading(false);
      });
  }, [selectedSource]);

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
        <p className="text-red-100">{error}</p>
      </div>
    );
  }

  if (news.length === 0) {
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
      <h2 className="text-xl font-bold pl-2 border-l-4 border-blue-500">
        {selectedSource ? `${selectedSource}のニュース` : '最新AI関連ニュース'}
      </h2>
      
      <div className="space-y-4">
        {news.map(item => (
          <NewsItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}