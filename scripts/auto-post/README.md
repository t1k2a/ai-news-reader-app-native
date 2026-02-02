# X (Twitter) 自動投稿スクリプト

X API v2 を使用して、ローカルの JSON ファイルから記事データを読み取り、自動で X (Twitter) に投稿するスクリプトです。

## 📁 ファイル構成

```
scripts/auto-post/
├── index.ts           # メイン実行スクリプト
├── posts_queue.json   # 投稿データ（未投稿/投稿済み）
└── README.md          # このファイル
```

## 🔑 事前準備：X Developer Portal での設定

### 1. Developer アカウントの取得

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) にアクセス
2. Developer アカウントを申請（無料プランでOK）

### 2. App の作成と認証情報の取得

1. **Project と App を作成**
2. **User authentication settings** で以下を設定:
   - **App permissions**: `Read and Write` を選択
   - **Type of App**: `Web App, Automated App or Bot`
   - **Callback URL**: `https://glotnexus.jp/` (または任意のURL)
   - **Website URL**: `https://glotnexus.jp/`

3. **Keys and tokens** タブで以下を取得:
   - API Key
   - API Key Secret
   - Access Token（Generate ボタンをクリック）
   - Access Token Secret

⚠️ **重要**: Access Token は `Read and Write` 権限で生成してください！

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install twitter-api-v2
```

### 2. 環境変数の設定

`.env` ファイルに認証情報を追加：

```env
X_API_KEY=あなたのAPI Key
X_API_SECRET=あなたのAPI Key Secret
X_ACCESS_TOKEN=あなたのAccess Token
X_ACCESS_TOKEN_SECRET=あなたのAccess Token Secret
```

### 3. 投稿データの準備

`posts_queue.json` を編集：

```json
[
  {
    "id": 1,
    "title": "投稿したいテキスト",
    "url": "https://glotnexus.jp",
    "hashtags": ["AI", "Tech", "GlotNexus"],
    "status": "pending"
  }
]
```

## ▶️ 実行方法

```bash
# 実行
npm run auto-post

# または直接実行
npx tsx scripts/auto-post/index.ts
```

## 📊 実行結果の例

```
========================================
  X (Twitter) 自動投稿スクリプト
========================================

[2026-02-02T10:46:25.000Z] ✅ [SUCCESS] 設定のバリデーション完了
[2026-02-02T10:46:25.001Z] 📋 [INFO] X API クライアントを初期化中...
[2026-02-02T10:46:25.002Z] ✅ [SUCCESS] X API クライアント初期化完了
[2026-02-02T10:46:25.003Z] 📋 [INFO] 認証情報を確認中...
[2026-02-02T10:46:25.500Z] ✅ [SUCCESS] 認証成功! ログイン中のアカウント: @your_username
[2026-02-02T10:46:25.501Z] 📋 [INFO] 投稿データを読み込み中...
[2026-02-02T10:46:25.502Z] 📋 [INFO] 3 件の投稿データを読み込みました
[2026-02-02T10:46:25.503Z] 📋 [INFO] 未投稿の記事を発見: ID=1
[2026-02-02T10:46:25.504Z] 📋 [INFO] X に投稿中: ID=1
[2026-02-02T10:46:25.505Z] 📋 [INFO] ツイートテキスト生成完了 (142文字)
[2026-02-02T10:46:26.000Z] ✅ [SUCCESS] 投稿成功! Tweet ID: 1234567890123456789
[2026-02-02T10:46:26.001Z] 📋 [INFO] 投稿URL: https://x.com/i/status/1234567890123456789

========================================
✅ [SUCCESS] 処理が完了しました
========================================
```

## 📋 JSON ファイル形式

### 投稿前

```json
{
  "id": 1,
  "title": "GPT-5の発表が近いとOpenAIが示唆",
  "url": "https://glotnexus.jp",
  "hashtags": ["AI", "GPT5", "OpenAI"],
  "status": "pending"
}
```

### 投稿成功後

```json
{
  "id": 1,
  "title": "GPT-5の発表が近いとOpenAIが示唆",
  "url": "https://glotnexus.jp",
  "hashtags": ["AI", "GPT5", "OpenAI"],
  "status": "published",
  "published_at": "2026-02-02T10:46:26.000Z",
  "tweet_id": "1234567890123456789"
}
```

### 投稿失敗時

```json
{
  "id": 1,
  "status": "failed",
  "error_message": "Rate limit exceeded"
}
```

## 🔄 定期実行（オプション）

### cron の例（毎時実行）

```bash
0 * * * * cd /path/to/project && npx tsx scripts/auto-post/index.ts >> /var/log/x-auto-post.log 2>&1
```

### GitHub Actions の例

```yaml
name: Auto Post to X
on:
  schedule:
    - cron: '0 */3 * * *'  # 3時間ごと
  workflow_dispatch:  # 手動実行も可能

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/auto-post/index.ts
        env:
          X_API_KEY: ${{ secrets.X_API_KEY }}
          X_API_SECRET: ${{ secrets.X_API_SECRET }}
          X_ACCESS_TOKEN: ${{ secrets.X_ACCESS_TOKEN }}
          X_ACCESS_TOKEN_SECRET: ${{ secrets.X_ACCESS_TOKEN_SECRET }}
```

## ⚠️ 注意事項

### X API の制限

| プラン | 月間投稿数 | 備考 |
|--------|-----------|------|
| Free | 1,500 tweets/月 | 読み取り制限もあり |
| Basic ($100/月) | 3,000 tweets/月 | より多くのAPIアクセス |
| Pro ($5,000/月) | 無制限 | フルアクセス |

### セキュリティ

- `.env` ファイルは絶対に Git にコミットしないでください
- GitHub Actions を使う場合は Secrets に登録してください

### 文字数制限

- X の文字数制限は 280 文字です
- URL は自動的に 23 文字としてカウントされます
- タイトルが長い場合は自動で切り詰められます

## 🐛 トラブルシューティング

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `401 Unauthorized` | 認証情報が間違っている | Keys and tokens を再確認 |
| `403 Forbidden` | Write 権限がない | App permissions を確認し、Access Token を再生成 |
| `429 Too Many Requests` | レート制限に達した | しばらく待ってから再実行 |
| `You are not allowed to create a Tweet with duplicate content` | 同じ内容を投稿しようとした | 投稿内容を変更 |

## 🔗 参考リンク

- [X API v2 Documentation](https://developer.x.com/en/docs/twitter-api)
- [twitter-api-v2 npm package](https://www.npmjs.com/package/twitter-api-v2)
- [X Developer Portal](https://developer.x.com/en/portal/dashboard)
