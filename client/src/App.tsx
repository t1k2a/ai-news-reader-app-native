import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { NewsTimeline } from "./components/NewsTimeline";
import { Sidebar } from "./components/Sidebar";
import { NewsHeader } from "./components/NewsHeader";
import { BookmarksPanel } from "./components/BookmarksPanel";
import { SocialPostingPanel } from "./components/social/SocialPostingPanel";
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
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white flex flex-col">
          <NewsHeader />
          
          <Routes>
            {/* メインニュース画面 */}
            <Route path="/" element={
              <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4">
                <Sidebar 
                  selectedSource={selectedSource} 
                  onSourceSelect={setSelectedSource} 
                />
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain max-h-[calc(100vh-13rem)] w-full md:w-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-200">エラー</h3>
                      <p className="text-red-700 dark:text-red-100">{error}</p>
                    </div>
                  ) : (
                    <NewsTimeline selectedSource={selectedSource} />
                  )}
                </div>
              </main>
            } />
            
            {/* SNS連携設定画面 */}
            <Route path="/social" element={
              <main className="flex-1 container mx-auto p-4">
                <div className="mb-4">
                  <a 
                    href="/"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center w-fit"
                  >
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
                      className="mr-1"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    ニュース一覧に戻る
                  </a>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">SNS連携設定</h2>
                  <SocialPostingPanel />
                </div>
              </main>
            } />
            
            {/* 404ページ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <footer className="bg-slate-800 p-3 text-center text-sm text-slate-400">
            <span>AI News Reader - 最新のAI関連ニュースをシンプルに</span>
            <span className="mx-2">•</span>
            <a
              href="/privacy.html"
              className="underline hover:text-slate-300"
            >
              プライバシーポリシー
            </a>
          </footer>
          <BookmarksPanel />
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
