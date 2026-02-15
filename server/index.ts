import { createServer } from "http";
import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { fetchAllFeeds } from "../lib/rss-feed";

// 未処理のPromise rejectionをキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // クラッシュを防ぐために継続（開発環境のみ推奨）
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

(async () => {
  try {
    const app = await createApp();
    const server = createServer(app);

    // Pre-warm news cache shortly after startup to reduce first-hit latency
    setTimeout(async () => {
      try {
        const items = await fetchAllFeeds();
        log(`prewarmed news cache: ${items.length} items`, "prewarm");
      } catch (err: any) {
        log(`prewarm failed: ${err?.message ?? String(err)}`, "prewarm");
      }
    }, 0);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Bind to the port provided by the hosting env (e.g., Render)
    // Fallback to 5000 for local/dev usage
    const port = Number(process.env.PORT) || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
