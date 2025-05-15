import { useState, useEffect } from 'react';

// RSSフィードのソース名一覧（サーバーに合わせたリスト）
const NEWS_SOURCES = [
  { name: 'VentureBeat AI', language: 'en' },
  { name: 'AI News', language: 'en' },
  { name: 'AI-TREND', language: 'ja' },
  { name: 'AINow', language: 'ja' }
];

interface SidebarProps {
  selectedSource: string | null;
  onSourceSelect: (source: string | null) => void;
}

export function Sidebar({ selectedSource, onSourceSelect }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // モバイルビューでサイドバーを閉じる（ソース選択後）
  useEffect(() => {
    if (selectedSource) {
      setIsOpen(false);
    }
  }, [selectedSource]);
  
  return (
    <>
      {/* モバイルトグルボタン */}
      <button 
        className="md:hidden w-full py-2 px-4 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-lg text-left flex justify-between items-center border border-gray-200 dark:border-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedSource || 'すべてのソース'}</span>
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
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {/* サイドバー本体 */}
      <div className={`
        bg-slate-800 rounded-lg overflow-hidden
        md:w-60 md:block ${isOpen ? 'block' : 'hidden'}
      `}>
        <div className="p-4">
          <h2 className="font-bold text-xl mb-3">ニュースソース</h2>
          
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onSourceSelect(null)}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  selectedSource === null
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'hover:bg-slate-700/50'
                }`}
              >
                すべて表示
              </button>
            </li>
            
            <li className="border-t border-slate-700 my-2 pt-2">
              <h3 className="px-3 text-sm font-medium text-slate-400">日本語ソース</h3>
            </li>
            
            {NEWS_SOURCES
              .filter(source => source.language === 'ja')
              .map(source => (
                <li key={source.name}>
                  <button
                    onClick={() => onSourceSelect(source.name)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      selectedSource === source.name
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    {source.name}
                  </button>
                </li>
              ))
            }
            
            <li className="border-t border-slate-700 my-2 pt-2">
              <h3 className="px-3 text-sm font-medium text-slate-400">英語ソース（翻訳）</h3>
            </li>
            
            {NEWS_SOURCES
              .filter(source => source.language === 'en')
              .map(source => (
                <li key={source.name}>
                  <button
                    onClick={() => onSourceSelect(source.name)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      selectedSource === source.name
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    {source.name}
                  </button>
                </li>
              ))
            }
          </ul>
        </div>
      </div>
    </>
  );
}