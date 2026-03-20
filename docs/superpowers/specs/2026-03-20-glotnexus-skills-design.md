# GlotNexus Skills — 設計ドキュメント

**作成日**: 2026-03-20
**Issue**: #9 (mcpを提供する)
**スコープ**: Superpowers互換スキルの外部公開（MCP はPhase 2）

---

## 前提知識

**Superpowers** は Claude Code 用のプラグインシステムで、`~/.claude/skills/` ディレクトリに置いたMarkdownファイルをスキルとして認識する。スキルファイルは以下のfrontmatter形式で定義する：

```markdown
---
name: skill-name
description: このスキルが何をするかの1行説明（スキル選択時に使われる）
---

スキルの本文（Claudeへの指示内容）
```

スキルはユーザーが `/skill-name` と入力するか、descriptionにマッチする自然言語で発動する。

---

## 概要

GlotNexusのAIニュース収集・日本語翻訳機能をSuperpowers互換スキルとして外部公開する。Claude Codeユーザーがスキルをインストールすることで、日本語AIニュースの取得・ブリーフィングをClaude Code上で行えるようになる。

**主目的**: GlotNexusのブランド認知をClaude Codeコミュニティに広げる
**副目的**: スキル経由で glotnexus.jp へのトラフィックを増やす

---

## アーキテクチャ

### データフロー

```
ユーザー → Claude Code → skill発動 → WebFetch → glotnexus.jp/api/news → 整形して回答
```

既存の `/api/news` エンドポイントをそのまま利用する。新規バックエンド実装は不要。

### APIエンドポイント（既存）

```
GET https://glotnexus.jp/api/news
  ?limit=10          # 取得件数（1-100）
  &category=機械学習  # カテゴリフィルター（任意）
```

- 認証不要（公開API）
- CORS対応済み
- 5分キャッシュ（Upstash Redis）
- レスポンス: 日本語翻訳済みAIニュース一覧（JSON）

**レスポンス例（1件分）:**
```json
{
  "id": "abc123",
  "title": "OpenAIが新モデルを発表",
  "link": "https://openai.com/blog/...",
  "summary": "OpenAIは本日...",
  "publishDate": "2026-03-20T09:00:00.000Z",
  "sourceName": "OpenAI Blog",
  "sourceLanguage": "en",
  "categories": ["AI研究", "機械学習"]
}
```

スキル内での記事リンク生成: `https://glotnexus.jp/?article={id}`

---

## 成果物

### ファイル構成

```
skills/
  glotnexus-news.md        # スキル1: オンデマンドニュース取得
  ai-news-briefing.md      # スキル2: 朝・夕ブリーフィング
  README.md                # インストール手順（日本語/英語）
```

---

## スキル詳細

### スキル1: `glotnexus-news`

**用途**: ユーザーが任意のタイミングでAIニュースを取得する

**トリガー例**:
- 「AIニュース教えて」
- 「今日のAI動向は？」
- 「機械学習の最新ニュースは？」
- 「OpenAI関連のニュースを見せて」

**動作**:
1. ユーザーの発言からカテゴリ・件数の意図を読み取る
   - デフォルト件数: `limit=10`（ユーザーが指定しない場合）
   - カテゴリ指定なし: `category` パラメーターを省略（全カテゴリ取得）
2. `WebFetch https://glotnexus.jp/api/news?limit=10[&category=X]` を呼ぶ
3. 各記事をタイトル・要約・ソース・リンクで整形して返す
   - 記事リンク: `https://glotnexus.jp/?article={id}` 形式（`id` フィールドを使用）
4. 末尾に `詳細は glotnexus.jp で` の導線を入れる

**利用可能カテゴリ**:
- 機械学習 / 自然言語処理 / コンピュータビジョン / ロボティクス
- AI倫理 / AI研究 / ビジネス活用 / AI

---

### スキル2: `ai-news-briefing`

**用途**: 朝・夕の定型的なAIニュースブリーフィング

**トリガー**: `/ai-news-briefing` または「AIニュースブリーフィングして」

**モード**:

| モード | 時間帯 | 内容 |
|--------|--------|------|
| 朝モード | 午前 | トップ5ニュース + 今日のAIトレンドキーワード |
| 夕モード | 午後 | 今日の主要ニュースまとめ + 明日ウォッチすべきトピック |

**動作**:
1. 現在時刻からJST（日本標準時）で朝/夕モードを自動判定（JST 12:00前 → 朝、12:00以降 → 夕）
   - 対象ユーザーが日本語圏のため、タイムゾーンは常にJSTを基準とする
2. `WebFetch https://glotnexus.jp/api/news?limit=20` で最新20件取得
3. モードに応じたフォーマットで整形・分析して出力
4. 末尾に `powered by GlotNexus (glotnexus.jp)` を添える

---

## ブランディング設計

スキルが呼ばれるたびに自然な形でGlotNexusを露出させる。

- 各スキルのメタデータ（frontmatter）に `GlotNexus (glotnexus.jp)` を明記
- ニュース表示時に「powered by GlotNexus」を添える
- 記事リンクは `glotnexus.jp/?article={id}` 形式でサイト経由に誘導

---

## 配布方法

### インストール手順（ユーザー向け）

**前提**: GitHubリポジトリ `t1k2a/ai-news-reader-app-native` はパブリックリポジトリとして公開される。

```bash
# glotnexus-news スキルをインストール
curl -o ~/.claude/skills/glotnexus-news.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/glotnexus-news.md

# ai-news-briefing スキルをインストール
curl -o ~/.claude/skills/ai-news-briefing.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/ai-news-briefing.md
```

または `skills/` ディレクトリのファイルを手動で `~/.claude/skills/` にコピー。

`skills/README.md` に記載する内容:
- Superpowersの前提条件（Claude Code + Superpowersプラグイン）
- curlによるインストール手順（日本語・英語）
- 各スキルのトリガー例
- glotnexus.jp へのリンク

### 告知チャネル（実装後）

1. GlotNexusのX（Twitter）で告知ポスト
2. Claude Code / Anthropic系コミュニティ（Reddit, Discord等）にシェア
3. GlotNexus メインREADMEにスキルへのリンクを追加

---

## スコープ外（Phase 2）

- **MCP サーバー**: `api/mcp.ts` をVercel上に実装（Issue #9の元々の内容）
- **npmパッケージ配布**: `glotnexus-skills` としてnpm公開
- **Superpowersプラグイン登録**: 公式/サードパーティレジストリへの登録
- **`search_news` ツール**: キーワード検索機能の追加

---

## 実装チェックリスト

- [ ] `skills/glotnexus-news.md` を作成
- [ ] `skills/ai-news-briefing.md` を作成
- [ ] `skills/README.md` を作成（日本語・英語）
- [ ] メインの `README.md` にスキルセクションを追加
- [ ] 既存 `/api/news` エンドポイントの動作確認
- [ ] スキルの動作テスト（Claude Code上で手動確認）
