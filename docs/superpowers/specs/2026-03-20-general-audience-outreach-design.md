# Issue #16: 一般層（パンピー）向けリーチ拡大 設計ドキュメント

**作成日**: 2026-03-20
**Issue**: #16
**ステータス**: 設計確定

---

## 背景・課題

現在の GlotNexus は X（Twitter）のみに自動投稿しており、リーチするのはアーリーアダプター層（技術者・AI 関心層）に限られている。一般層（パンピー）へリーチするために、以下の2点を実装する：

1. **Brand Card 画像の品質改善**（日本語化・デザイン刷新・文字化け修正）
2. **Instagram（+ Facebook ページ）への自動投稿**

LINE は運用コストの観点から対象外。note は公式 API が存在しないため対象外。

---

## フェーズ1: Brand Card 改善

### 1-A. 文字化け修正

**原因**: Vercel サーバーレス環境に `IPAGothic` / `Noto Sans CJK JP` 等の日本語フォントが存在しない。

**修正内容**:
- `NotoSansJP-Bold.ttf` と `NotoSansJP-Regular.ttf` をリポジトリに同梱（`assets/fonts/`）
- `lib/brand-card.ts` の初期化時に `registerFont()` で明示的に読み込む
- `vercel.json` の `includeFiles` にフォントファイルを追加して Vercel デプロイ時にバンドル

**変更ファイル**:
- `lib/brand-card.ts`
- `vercel.json`
- `assets/fonts/NotoSansJP-Bold.ttf`（新規）
- `assets/fonts/NotoSansJP-Regular.ttf`（新規）

### 1-B. 日本語化（A-1）

**変更内容**:
- `generateBrandCard()` は `AINewsItem` に `translatedTitle` / `translatedSummary` フィールドがあればそれを使用
- フィールドがない場合は `lib/translation-api.ts` を呼び出して翻訳してから描画
- `autoPostArticles()` の呼び出し前に翻訳を完了しておくことでレンダリング時のレイテンシを回避
- `AINewsItem` 型に `translatedTitle?: string` / `translatedSummary?: string` を追加（`lib/types.ts`）

**変更ファイル**:
- `lib/brand-card.ts`
- `lib/types.ts`
- `lib/auto-post.ts`（投稿前に翻訳済みフィールドをセット）

### 1-C. デザイン刷新（A-2）

一般層に向けて視認性・シェアされやすさを重視したデザインに変更：

- 背景: 白または淡いグラデーション（現状のダーク系から変更）
- 日本語タイトルを大きく・中央上部に配置
- 日本語要約を2〜3行でタイトル下に表示
- ソースバッジをより目立つデザインに
- フッターに「海外AIニュースを日本語で｜glotnexus.jp」を表示
- フォントサイズ階層を明確化: タイトル（48px）> 要約（24px）> ソース名（20px）

**変更ファイル**:
- `lib/brand-card.ts`

---

## フェーズ2: Instagram（+ Facebook）自動投稿

### アーキテクチャ

X の投稿フローと対称的な構造で、独立したファイルとして実装する。

```
lib/instagram-post.ts          ← 新規: Instagram/Facebook 投稿ロジック
api/cron/instagram-post.ts     ← 新規: Vercel Cron（1時間ごと）
```

X cron と Instagram cron は独立しており、一方の失敗がもう一方に影響しない。

### Instagram 投稿フロー

Meta Content Publishing API の2ステップフロー：

```
Step 1: 画像を一時ホスティングサービスにアップロード → 公開URL取得
Step 2: POST /v19.0/{ig-user-id}/media
        { image_url, caption }
        → media_id 取得
Step 3: POST /v19.0/{ig-user-id}/media_publish
        { creation_id: media_id }
        → Instagram 投稿完了
Step 4（任意）: Facebook ページへの同時投稿
```

**画像一時ホスティング**: brand card の PNG Buffer を imgbb（無料 API）にアップロードし、公開 URL を Meta API に渡す。Vercel Blob も選択肢だが、imgbb の方が追加費用なし。

### 投稿テキスト（キャプション）フォーマット

```
{日本語タイトル}

{日本語要約（2〜3行）}

詳細はこちら👉 https://glotnexus.jp/?article={id}

#AI #生成AI #海外のAIニュース #GlotNexus
```

### 投稿済み管理

Instagram の投稿済み記事 ID は X とは独立したキーで Redis に保存する：

- X 用: `posted_ids`（既存）
- Instagram 用: `ig:posted_ids`（新規）

`lib/cache.ts` に `getInstagramPostedIds()` / `addInstagramPostedId()` を追加。

### 新規環境変数

```bash
META_ACCESS_TOKEN=               # Meta Graph API 長期アクセストークン
INSTAGRAM_BUSINESS_ACCOUNT_ID=  # Instagram Business アカウントID
FACEBOOK_PAGE_ID=                # Facebook ページID（任意、FB同時投稿用）
IMGBB_API_KEY=                   # imgbb API キー（画像一時公開）
```

### 変更ファイル

| ファイル | 種別 | 内容 |
|---------|------|------|
| `lib/instagram-post.ts` | 新規 | Instagram/Facebook 投稿ロジック |
| `lib/cache.ts` | 変更 | Instagram 用 posted_ids 関数追加 |
| `api/cron/instagram-post.ts` | 新規 | Vercel Cron ハンドラー |
| `vercel.json` | 変更 | Instagram cron ジョブ追加 |
| `.env.vercel` | 変更 | 新規環境変数追記 |

---

## 実装順序

1. フォントファイルの追加（`assets/fonts/`）
2. `lib/brand-card.ts` の修正（文字化け → 日本語化 → デザイン刷新）
3. `lib/types.ts` に翻訳済みフィールド追加
4. `lib/auto-post.ts` に翻訳前処理を追加
5. `lib/cache.ts` に Instagram 用関数追加
6. `lib/instagram-post.ts` の新規作成
7. `api/cron/instagram-post.ts` の新規作成
8. `vercel.json` の更新

---

## 非対象（スコープ外）

- LINE 連携（運用コスト過多のため除外）
- note 自動投稿（公式 API なし）
- コンテンツの噛み砕き（翻訳品質改善は別 issue）
- X の投稿フォーマット変更
