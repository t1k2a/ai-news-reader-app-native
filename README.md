# 🌐 GlotNexus - AI News Reader

最新AIニュースを日本語で。18+のAI RSSフィードを集約し、自動翻訳してX (Twitter) に投稿するニュースアグリゲーターアプリ。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## 📋 概要

GlotNexusは、AI業界の最新情報を日本語でキャッチアップできるニュースリーダーです。

### 主な機能
- ✅ **18+ RSS フィード対応**: OpenAI, Google AI, Anthropic, NVIDIA, Meta, Microsoft など
- ✅ **自動日本語翻訳**: 記事タイトル・要約を日本語化
- ✅ **X (Twitter) 自動投稿**: Vercel Cron で1日3回自動投稿
- ✅ **Webアプリ**: React + Vite のモダンなフロントエンド
- ✅ **ハイブリッド構成**: Express サーバー + Vercel Serverless Functions

---

## 🚀 クイックスタート

### 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して API キーを設定

# 開発サーバー起動
npm run dev

# ブラウザで開く
open http://localhost:5173
```

### 環境変数

```bash
# X (Twitter) API v2 認証情報
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret

# Upstash Redis（オプション、サーバーレス対応）
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# アプリケーション設定
APP_BASE_URL=https://glotnexus.jp
AUTO_POST_MAX_PER_RUN=10
AUTO_POST_DELAY_SECONDS=10

# Cron ジョブ認証
CRON_SECRET=your_secret_key
```

---

## 📂 プロジェクト構成

```
.
├── api/                    # Vercel Serverless Functions
│   ├── index.ts           # メインAPIハンドラー
│   └── cron/
│       └── auto-post.ts   # X自動投稿Cronジョブ
├── client/                 # React フロントエンド
│   └── src/
│       ├── App.tsx
│       ├── components/
│       └── pages/
├── lib/                    # 共通ビジネスロジック
│   ├── rss-feed.ts        # RSSフィード取得・処理
│   ├── auto-post.ts       # X投稿ロジック
│   ├── auto-post-enhanced.ts  # 強化版投稿フォーマット
│   ├── cache.ts           # Redis/メモリキャッシュ
│   ├── translation-api.ts # 翻訳API
│   └── types.ts           # 型定義
├── server/                 # Express サーバー（開発用）
│   ├── index.ts
│   ├── app.ts
│   └── routes.ts
├── scripts/                # ユーティリティスクリプト
│   ├── auto-post/
│   │   ├── rss-auto-post.ts  # RSS自動投稿
│   │   └── posted_ids.json   # 投稿済みID管理
│   └── test-enhanced-tweets.ts  # ツイートフォーマットテスト
└── docs/                   # ドキュメント
    ├── marketing-implementation-plan.md  # マーケティング実装計画
    └── QUICK_START.md      # クイックスタートガイド
```

---

## 🛠️ 利用可能なコマンド

```bash
# 開発
npm run dev              # 開発サーバー起動（8GB メモリ）
npm run dev:light        # 開発サーバー起動（4GB メモリ）

# ビルド
npm run build            # 本番ビルド（クライアント + サーバー）

# 本番環境
npm start                # 本番サーバー起動

# 型チェック
npm run check            # TypeScript 型チェック

# データベース
npm run db:push          # Drizzle ORM スキーマ適用

# X (Twitter) 自動投稿
npm run auto-post        # キューベース投稿（posts_queue.json）
npm run auto-post:rss    # RSSベース投稿（最新記事を投稿）
```

---

## 📈 マーケティング・集客戦略

**現状の課題**: Xのインプレッション数0、集客力不足

**解決策**: 3段階の実装計画で集客力を劇的に向上

### 📍 フェーズ1: 投稿の質を改善（1-2週間）
- 強化版投稿フォーマット（フック、CTA、価値提案）
- 日本語要約の自動翻訳
- 投稿タイミングの最適化

**期待される成果**:
- インプレッション: 0 → 100+/投稿
- エンゲージメント率: 0% → 2-5%
- 初フォロワー獲得: +5-15人

### 📍 フェーズ2: マーケティング戦略を構築（3-4週間）
- `/marketing-ideas` スキルで戦略立案
- `/free-tool-strategy` で集客ツール化
- コンテンツカレンダー作成
- エンゲージメント活動の仕組み化

**期待される成果**:
- 月間インプレッション: 8,000-12,000
- フォロワー: +50-100人
- サイト訪問: 200-350/月

### 📍 フェーズ3: SEO基盤を強化（1-3ヶ月）
- `/seo-audit` でサイト診断
- 構造化データ（Schema Markup）実装
- `/programmatic-seo` で記事ページ大量生成
- コンテンツSEO強化

**期待される成果**:
- オーガニック検索流入: 300-700/月
- 主要キーワードでGoogle 1ページ目
- 月間サイト訪問: 800-1,500

### 📚 詳細ドキュメント

- **[実装計画（詳細）](docs/marketing-implementation-plan.md)** - 全タスク、KPI、タイムライン
- **[クイックスタート](docs/QUICK_START.md)** - 30分で始める集客改善

---

## 🎯 成果のタイムライン

| 期間 | インプレッション | フォロワー | サイト訪問 |
|---|---|---|---|
| 24時間後 | 50-100/投稿 | - | - |
| 1週間後 | 1,500-2,500（週） | +5-15 | 30-60 |
| 1ヶ月後 | 8,000-12,000（月） | +50-100 | 200-350 |
| 3ヶ月後 | 25,000-40,000（月） | +200-350 | 800-1,500 |

詳細は [実装計画ドキュメント](docs/marketing-implementation-plan.md#-期待される成果詳細タイムライン) を参照。

---

## 🧰 使用技術

### フロントエンド
- **React 18** - UI ライブラリ
- **Vite** - ビルドツール
- **TypeScript** - 型安全性

### バックエンド
- **Express** - Node.js サーバー（開発環境）
- **Vercel Functions** - サーバーレス（本番環境）
- **Upstash Redis** - サーバーレス対応キャッシュ

### 外部API
- **Twitter API v2** - X (Twitter) 投稿
- **RSS Parser** - フィード取得
- **Translation API** - 日本語翻訳

### インフラ
- **Vercel** - ホスティング + Cron
- **GitHub Actions** - CI/CD（オプション）

---

## 📊 対応RSSフィード（18+）

- OpenAI Blog
- Google AI Blog
- Anthropic News
- NVIDIA Developer Blog
- Meta AI Blog
- Microsoft Research Blog
- Hugging Face Blog
- DeepMind Blog
- AI News (artificialintelligence-news.com)
- VentureBeat AI
- The Verge AI
- TechCrunch AI
- その他6+フィード

---

## 🤝 コントリビューション

プルリクエスト歓迎！以下の手順でコントリビュートできます：

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

## 🙏 謝辞

- Claude Code Marketing Skills Pack
- Anthropic Claude API
- OpenAI, Google, NVIDIA 等のRSSフィード提供元
- すべてのコントリビューター

---

## 📞 お問い合わせ

- **Website**: https://glotnexus.jp
- **X (Twitter)**: [@GlotNexus](https://x.com/GlotNexus)
- **Issues**: [GitHub Issues](https://github.com/your-username/ai-news-reader-app-native/issues)

---

**Made with ❤️ by the GlotNexus Team**

🚀 Let's make AI news accessible in Japanese!
