import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { NewsTimeline } from "./components/NewsTimeline";
import { NewsHeader } from "./components/NewsHeader";
import { BookmarksPanel } from "./components/BookmarksPanel";
import "@fontsource/inter";
import PrivacyPage from "./pages/privacy";
import { APP_TITLE } from "./lib/constants";

function App() {
  const selectedSource: string | null = null;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white flex flex-col">
          <NewsHeader />

          <Routes>
            <Route path="/" element={
              <main className="flex-1 container mx-auto p-4">
                <NewsTimeline selectedSource={selectedSource} />
              </main>
            } />

            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="bg-slate-800 p-3 text-center text-sm text-slate-400">
            <span>{APP_TITLE}</span>
            <span className="mx-2">•</span>
            <Link to="/privacy" className="underline hover:text-slate-300">プライバシーポリシー</Link>
          </footer>
          <BookmarksPanel />
          <Toaster position="top-right" />
          <Analytics />
          <SpeedInsights />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
