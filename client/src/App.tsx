import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { NewsTimeline } from "./components/NewsTimeline";
import { Sidebar } from "./components/Sidebar";
import { NewsHeader } from "./components/NewsHeader";
import "@fontsource/inter";

function App() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // ページ読み込み時に健全性チェック
    fetch('/api/health')
      .then(response => {
        if (!response.ok) {
          throw new Error('サーバー接続エラー');
        }
        return response.json();
      })
      .then(() => {
        setIsLoading(false);
      })
      .catch(err => {
        setError('サーバーに接続できませんでした。数分後に再試行してください。');
        setIsLoading(false);
        console.error('健全性チェックエラー:', err);
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <NewsHeader />
        
        <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4">
          <Sidebar 
            selectedSource={selectedSource} 
            onSourceSelect={setSelectedSource} 
          />
          
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-200">エラー</h3>
                <p className="text-red-100">{error}</p>
              </div>
            ) : (
              <NewsTimeline selectedSource={selectedSource} />
            )}
          </div>
        </main>
        
        <footer className="bg-slate-800 p-3 text-center text-sm text-slate-400">
          AI News Reader - 最新のAI関連ニュースをシンプルに
        </footer>
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
}

export default App;
