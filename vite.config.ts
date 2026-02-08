import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";
import { createHtmlPlugin } from "vite-plugin-html";

// App constants for HTML injection
const APP_NAME = "GlotNexus";
const APP_TAGLINE = "海外AIメディアを翻訳・要約。見出しで掴む世界の最先端";
const APP_TITLE = `${APP_NAME} - ${APP_TAGLINE}`;
const APP_DESCRIPTION = `${APP_NAME}は、最新のAI関連ニュースを自動収集し、日本語に翻訳して表示するサービスです。機械学習、自然言語処理、コンピュータビジョンなど様々な分野のAI情報を簡単に入手できます。`;
const APP_SHORT_DESCRIPTION = `${APP_NAME}は、最新のAI関連ニュースを自動収集し、日本語に翻訳して表示するサービスです。`;
const APP_BASE_URL = "https://glotnexus.jp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    glsl(), // Add GLSL shader support (v1.3.1)
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          APP_NAME,
          APP_TAGLINE,
          APP_TITLE,
          APP_DESCRIPTION,
          APP_SHORT_DESCRIPTION,
          APP_BASE_URL,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
  // メモリ最適化設定
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["react-refresh"],
  },
  server: {
    hmr: {
      overlay: false, // エラーオーバーレイを無効化してメモリ節約
    },
  },
});
