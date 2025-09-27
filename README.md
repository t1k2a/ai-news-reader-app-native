# AI News Reader

AIに関する最新ニュースを自動収集し、日本語に翻訳して提供するウェブアプリケーションです。

## 主な機能

- **AIニュースの自動収集**: 複数のソースからAI関連のニュースを収集
- **自動翻訳**: 英語記事を日本語に自動翻訳
- **コンパクトな要約**: 長い記事を300文字程度に要約
- **PWA対応**: スマートフォンのホーム画面に追加可能
- **オフライン機能**: Service Workerによるオフラインサポート

## 技術スタック

- フロントエンド: React, TypeScript, Tailwind CSS
- バックエンド: Node.js, Express
- データベース: PostgreSQL
- その他: Service Worker (PWA)

## 開発方法

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## PWA機能

このアプリはPWA (Progressive Web App) に対応しています：

- ホーム画面に追加可能
- オフラインでも動作
- アプリのような体験

## 環境変数

```
DATABASE_URL=postgresql://...
```

## ライセンス

MIT
