# Issue #16: 一般層（パンピー）向けリーチ拡大 設計ドキュメント

**作成日**: 2026-03-20
**Issue**: #16
**ステータス**: 設計確定（レビュー v2 済み）

---

## 背景・課題

現在の GlotNexus は X（Twitter）のみに自動投稿しており、リーチするのはアーリーアダプター層（技術者・AI 関心層）に限られている。一般層（パンピー）へリーチするために以下を実装する：

1. **Brand Card 画像の品質改善**（文字化け修正・日本語表示・デザイン刷新）
2. **Instagram への自動投稿**

LINE は運用コスト過多のため対象外。note は公式 API なしのため対象外。Facebook ページ同時投稿は別 issue で対応。

---

## 型定義の整理（変更なし）

`AINewsItem`（`lib/types.ts`）には既に以下のフィールドが存在する：

| フィールド | 役割 |
|-----------|------|
| `title` | 現在のタイトル（翻訳後は日本語が入る） |
| `summary` | 現在の要約（翻訳後は日本語が入る） |
| `originalTitle?` | 英語の元タイトル（翻訳時に退避） |
| `originalSummary?` | 英語の元要約（翻訳時に退避） |

**`lib/types.ts` の変更は不要。** brand card は既存の `title` / `summary` を使用する。

---

## フェーズ1: Brand Card 改善

### 実装順序（依存関係順）

1. `assets/fonts/` にフォントファイルを追加
2. `lib/brand-card.ts` を修正（文字化け → 日本語表示 → デザイン刷新）
3. `lib/auto-post.ts` に翻訳前処理を追加
4. `lib/cache.ts` に Instagram 用関数追加
5. `lib/instagram-post.ts` を新規作成
6. `api/cron/instagram-post.ts` を新規作成
7. `vercel.json` を更新（フォント + Instagram cron）

---

### 1-A. 文字化け修正

**原因**: Vercel サーバーレス環境に `IPAGothic` / `Noto Sans CJK JP` 等の日本語フォントが存在しない。

**修正内容**:

1. `assets/fonts/NotoSansJP-Bold.ttf` と `assets/fonts/NotoSansJP-Regular.ttf` をリポジトリに同梱
2. `lib/brand-card.ts` のモジュール初期化時（import 直後）に `registerFont()` を呼び出す：
   ```ts
   import path from "path";
   registerFont(path.join(process.cwd(), "assets/fonts/NotoSansJP-Bold.ttf"), { family: "NotoSansJP", weight: "bold" });
   registerFont(path.join(process.cwd(), "assets/fonts/NotoSansJP-Regular.ttf"), { family: "NotoSansJP" });
   ```
3. 全 `ctx.font` 文字列を `"NotoSansJP"` ファミリーに統一する：
   ```ts
   // 変更前
   ctx.font = 'bold 24px "IPAGothic", "Noto Sans CJK JP", "Hiragino Sans", sans-serif';
   // 変更後
   ctx.font = 'bold 24px "NotoSansJP"';
   ```
4. `vercel.json` の全関数エントリ（`api/index.ts`, `api/cron/auto-post.ts`, `api/cron/instagram-post.ts`）の `includeFiles` に `assets/fonts/**` を追加

**変更ファイル**: `lib/brand-card.ts`, `vercel.json`, `assets/fonts/`（新規）

---

### 1-B. brand card に日本語を表示

`AINewsItem.title` / `summary` は翻訳済みであれば既に日本語が入っている。brand card 側の変更は不要。

翻訳の注入は `lib/auto-post.ts` の `autoPostArticles()` 内、for ループの先頭で行う：

```ts
// lib/auto-post.ts の autoPostArticles() 内 for ループ先頭
import { translateToJapanese } from "./translation-api.js";

// 翻訳されていない（日本語文字を含まない）場合のみ翻訳
const isAlreadyJapanese = /[\u3040-\u9fff]/.test(article.title);
if (!isAlreadyJapanese) {
  const originalTitle = article.title;       // 先に退避
  const originalSummary = article.summary;   // 先に退避
  article.originalTitle = article.originalTitle ?? originalTitle;
  article.originalSummary = article.originalSummary ?? originalSummary;
  article.title = await translateToJapanese(originalTitle);
  article.summary = article.summary
    ? await translateToJapanese(originalSummary)
    : article.summary;
}
// この後 postToX(client, article) → 内部で generateBrandCard(article) が呼ばれる
```

**注意**: 日本語判定 `/[\u3040-\u9fff]/` はヒューリスティックであり、韓国語・中国語を誤って「翻訳済み」と判定する既知の制限がある。RSS フィードは英語ソース限定のため実用上の問題は低い。

**変更ファイル**: `lib/auto-post.ts`

---

### 1-C. デザイン刷新（A-2）

一般層に向けて視認性・シェアされやすさを重視したデザインに変更：

- **背景**: 白または淡いグラデーション（現状のダーク系 `#0f0f23` から変更）
- **タイトル**: 48px・ページ上部に配置
- **要約**: 24px で2〜3行
- **ソースバッジ**: 20px でカラフルに
- **フッター**: `海外AIニュースを日本語で｜glotnexus.jp` を表示
- **フォントファミリー**: 全て `NotoSansJP`（1-A と統合）

**変更ファイル**: `lib/brand-card.ts`

---

## フェーズ2: Instagram 自動投稿

### アーキテクチャ

```
lib/instagram-post.ts          ← 新規: Instagram 投稿ロジック
api/cron/instagram-post.ts     ← 新規: Vercel Cron（毎時30分）
```

X cron（毎時0分）と Instagram cron（毎時30分）を30分ずらすことで同時実行を避ける。

### Instagram 投稿フロー

Meta Content Publishing API の3ステップ：

```
Step 1: brand card PNG Buffer を Vercel Blob にアップロード → 公開 URL 取得
Step 2: POST /v{api_version}/{ig-user-id}/media
        { image_url: <Vercel Blob URL>, caption }
        → creation_id 取得
Step 3: POST /v{api_version}/{ig-user-id}/media_publish
        { creation_id }
        → 投稿完了
```

**Meta API バージョン**: 実装時に Meta 公式ドキュメントで最新安定版を確認すること（v19.0 は2026年時点で deprecated の可能性あり）。

**画像ホスティング**: Vercel Blob を使用。`@vercel/blob` パッケージを `package.json` に追加が必要。imgbb は採用しない（無料プランは削除不可・SLA なし）。

### エラーハンドリング

| ケース | 対応 |
|--------|------|
| Vercel Blob アップロード失敗 | スキップ（ログ記録）、投稿済み ID に追加しない |
| Step 2（container 作成）失敗 | スキップ（ログ記録） |
| Step 3（publish）失敗 | スキップ（ログ記録） |
| 重複コンテンツエラー | 投稿済み ID に追加してスキップ |

### CRON_SECRET 認証

`api/cron/instagram-post.ts` は `api/cron/auto-post.ts` と同様に `CRON_SECRET` ヘッダーによる認証を実装する。未認証リクエストは 401 を返す。

### 投稿テキスト（キャプション）フォーマット

```
{日本語タイトル}

{日本語要約（2〜3行）}

詳細はこちら👉 https://glotnexus.jp/?article={id}

#AI #生成AI #海外のAIニュース #GlotNexus
```

### 投稿済み管理

- X 用: `posted_ids`（既存）
- Instagram 用: `ig:posted_ids`（新規）

`lib/cache.ts` に `getInstagramPostedIds()` / `addInstagramPostedId()` を追加（既存関数のキー名を変えたもの）。

**開発時（Redis なし）の挙動**: X と同様に空の `Set` が返るため、毎ローカル実行で全記事が再投稿対象になる。ローカルでの Instagram cron テストは環境変数 `DRY_RUN=true` 等で制御することを推奨（実装時に判断）。

### 新規環境変数

```bash
META_ACCESS_TOKEN=               # Meta Graph API 長期アクセストークン
INSTAGRAM_BUSINESS_ACCOUNT_ID=  # Instagram Business アカウントID
BLOB_READ_WRITE_TOKEN=           # Vercel Blob トークン
CRON_SECRET=                     # 既存（instagram cron でも使用）
```

### `vercel.json` の変更（完全差分）

```json
"functions": {
  "api/index.ts": {
    "includeFiles": "lib/**,assets/fonts/**",  // assets/fonts/** を追加
    "maxDuration": 60
  },
  "api/sitemap.ts": {
    "includeFiles": "lib/**",
    "maxDuration": 60
  },
  "api/cron/auto-post.ts": {
    "includeFiles": "lib/**,assets/fonts/**",  // assets/fonts/** を追加
    "maxDuration": 300
  },
  "api/cron/warm-cache.ts": {
    "includeFiles": "lib/**",
    "maxDuration": 120
  },
  "api/cron/instagram-post.ts": {              // 新規追加
    "includeFiles": "lib/**,assets/fonts/**",
    "maxDuration": 300
  }
}
```

および crons に追加：
```json
{
  "path": "/api/cron/instagram-post",
  "schedule": "30 * * * *"
}
```

**注意**: `maxDuration: 300` は Vercel Pro プラン必須（X の auto-post cron と同じ要件）。

### 変更ファイル一覧

| ファイル | 種別 | 内容 |
|---------|------|------|
| `assets/fonts/NotoSansJP-Bold.ttf` | 新規 | 日本語フォント |
| `assets/fonts/NotoSansJP-Regular.ttf` | 新規 | 日本語フォント |
| `lib/brand-card.ts` | 変更 | フォント修正・日本語表示・デザイン刷新 |
| `lib/auto-post.ts` | 変更 | brand card 生成前の翻訳注入 |
| `lib/cache.ts` | 変更 | Instagram 用 posted_ids 関数追加 |
| `lib/instagram-post.ts` | 新規 | Instagram 投稿ロジック |
| `api/cron/instagram-post.ts` | 新規 | Vercel Cron ハンドラー（CRON_SECRET 認証付き） |
| `vercel.json` | 変更 | fonts includeFiles 追加・Instagram cron 追加 |
| `package.json` | 変更 | `@vercel/blob` 追加 |
| `.env.vercel` | 変更 | 新規環境変数3件追記 |

---

## 非対象（スコープ外）

- LINE 連携（運用コスト過多のため除外）
- note 自動投稿（公式 API なし）
- Facebook ページへの同時投稿（別 issue で対応）
- コンテンツの噛み砕き改善（翻訳品質改善は別 issue）
- X の投稿フォーマット変更
