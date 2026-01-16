import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { NewsTimeline } from "./components/NewsTimeline";
import { NewsHeader } from "./components/NewsHeader";
import { BookmarksPanel } from "./components/BookmarksPanel";
import "@fontsource/inter";
import PrivacyPage from "./pages/privacy";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedSource: string | null = null;
  
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
            <Route path="/" element={
              <main className="flex-1 container mx-auto p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
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
              </main>
            } />

            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <footer className="bg-slate-800 p-3 text-center text-sm text-slate-400">
            <span>SynapseFeed - 最新のAI関連ニュースをシンプルに</span>
            <span className="mx-2">•</span>
            <Link to="/privacy" className="underline hover:text-slate-300">プライバシーポリシー</Link>
          </footer>
          <BookmarksPanel />
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
