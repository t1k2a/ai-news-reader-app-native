# GlotNexus Skills 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GlotNexusのAIニュース取得機能をSuperpowers互換スキルとして外部公開し、Claude Codeコミュニティへのブランド認知とglotnexus.jpへのトラフィックを獲得する。

**Architecture:** `skills/` ディレクトリに2本のMarkdownスキルファイルを作成し、既存の公開API（`https://glotnexus.jp/api/news`）をWebFetch経由で呼び出す。バックエンド変更は不要。GitHubのpublicリポジトリ経由でcurlインストールを提供する。

**Tech Stack:** Superpowers skill format（YAML frontmatter + Markdown）、WebFetch（Claude Code組み込みツール）、既存GlotNexus REST API

---

## ファイルマップ

| 操作 | パス | 責務 |
|------|------|------|
| Create | `skills/glotnexus-news.md` | オンデマンドAIニュース取得スキル |
| Create | `skills/ai-news-briefing.md` | 朝・夕ブリーフィングスキル |
| Create | `skills/README.md` | インストール手順（日本語・英語） |
| Modify | `README.md` | Claude Codeスキルセクションを追加 |

---

## Task 1: `skills/glotnexus-news.md` を作成する

**Files:**
- Create: `skills/glotnexus-news.md`

- [ ] **Step 1: APIレスポンスを手動で確認する**（スペックのチェックリスト「既存 `/api/news` エンドポイントの動作確認」に相当）

実際のAPIがどんなデータを返すか確認する。

```bash
curl -s "https://glotnexus.jp/api/news?limit=2" | jq '.[0] | {id, title, summary, sourceName, categories}'
```

期待する出力（フィールド名の確認）:
```json
{
  "id": "...",
  "title": "...",
  "summary": "...",
  "sourceName": "...",
  "categories": [...]
}
```

> **注意**: curlまたはjqがない場合は `curl -s "https://glotnexus.jp/api/news?limit=2"` だけでもOK。`id` フィールドが存在することを確認できればよい。

- [ ] **Step 2: `skills/` ディレクトリを作成して `glotnexus-news.md` を書く**

```bash
mkdir -p skills
```

`skills/glotnexus-news.md` を以下の内容で作成する:

```markdown
---
name: glotnexus-news
description: GlotNexusから最新のAIニュースを日本語で取得する。「AIニュース教えて」「今日のAI動向は？」「機械学習の最新情報を見せて」などのリクエストに応答する。
---

GlotNexusのAIニュースAPIを使って、最新の日本語AIニュースを取得・表示する。

## 手順

1. ユーザーのリクエストからカテゴリと件数を読み取る:
   - **件数のデフォルト**: `limit=10`（指定がない場合）
   - **カテゴリ指定なし**: `category` パラメーターを省略して全カテゴリ取得
   - **利用可能なカテゴリ**: `機械学習`, `自然言語処理`, `コンピュータビジョン`, `ロボティクス`, `AI倫理`, `AI研究`, `ビジネス活用`, `AI`

2. WebFetchでニュースを取得する:
   - カテゴリなし: `https://glotnexus.jp/api/news?limit=10`
   - カテゴリあり: `https://glotnexus.jp/api/news?limit=10&category=機械学習`
   - 件数変更例: `https://glotnexus.jp/api/news?limit=5`

3. 各記事を以下のフォーマットで表示する:

   ```
   📰 **{title}**
   {summary}
   🔗 https://glotnexus.jp/?article={id}
   📌 {sourceName}
   ```

4. 全記事の表示後、末尾に以下を添える:

   ```
   ---
   詳細は [GlotNexus](https://glotnexus.jp) でご覧いただけます。
   ```
```

- [ ] **Step 3: frontmatterのYAMLを目視確認する**

`skills/glotnexus-news.md` を開き、以下を確認する:
- `---` で始まり `---` で終わるfrontmatterがある
- `name:` フィールドがある（値にスペースや特殊文字なし）
- `description:` フィールドがある

- [ ] **Step 4: コミットする**

```bash
git add skills/glotnexus-news.md
git commit -m "feat: glotnexus-news スキルを追加 (issue #9)"
```

---

## Task 2: `skills/ai-news-briefing.md` を作成する

**Files:**
- Create: `skills/ai-news-briefing.md`

- [ ] **Step 1: `skills/ai-news-briefing.md` を書く**

```markdown
---
name: ai-news-briefing
description: 朝または夕のAIニュースブリーフィングを行う。毎朝・毎夕のAI情報収集に活用する定型スキル。「AIニュースブリーフィングして」で起動。
---

GlotNexusのAIニュースAPIを使って、朝または夕の定型ブリーフィングを行う。

## 手順

1. 現在時刻をJST（日本標準時、UTC+9）で確認する:
   - **JSTで12:00より前** → 朝モード（Morning mode）
   - **JSTで12:00以降** → 夕モード（Evening mode）

2. WebFetchでニュースを取得する:
   `https://glotnexus.jp/api/news?limit=20`

3. **朝モード（JSTで12:00前）** の場合、以下のフォーマットで出力する:

   ```
   🌅 今朝のAIニュース ブリーフィング

   【トップニュース5選】
   1. **{title}** — {1行サマリー}
      🔗 https://glotnexus.jp/?article={id}
   （5件分繰り返す）

   【今日のAIトレンドキーワード】
   • {keyword1} • {keyword2} • {keyword3}（取得したニュースから3〜5個抽出）

   【今日の注目ポイント】
   {今日のニュースから読み取れる1〜2文のポイント}

   ---
   powered by [GlotNexus](https://glotnexus.jp) — AI海外ニュースを日本語で
   ```

4. **夕モード（JSTで12:00以降）** の場合、以下のフォーマットで出力する:

   ```
   🌆 今日のAIニュース まとめ

   【今日の主要ニュース5選】
   1. **{title}** — {1行サマリー}
      🔗 https://glotnexus.jp/?article={id}
   （5件分繰り返す）

   【明日ウォッチすべきトピック】
   • {topic1}
   • {topic2}
   （今日のニュースから読み取れる2〜3トピック）

   【今日の総括】
   {今日のAI情勢を1〜2文でまとめる}

   ---
   powered by [GlotNexus](https://glotnexus.jp) — AI海外ニュースを日本語で
   ```
```

- [ ] **Step 2: frontmatterのYAMLを目視確認する**

`skills/ai-news-briefing.md` を開き、以下を確認する:
- `---` で始まり `---` で終わるfrontmatterがある
- `name: ai-news-briefing`（ハイフン含む、スペースなし）
- `description:` フィールドがある

- [ ] **Step 3: コミットする**

```bash
git add skills/ai-news-briefing.md
git commit -m "feat: ai-news-briefing スキルを追加 (issue #9)"
```

---

## Task 3: `skills/README.md` を作成する

**Files:**
- Create: `skills/README.md`

- [ ] **Step 1: `skills/README.md` を書く**

```markdown
# GlotNexus Skills for Claude Code

[Claude Code](https://claude.ai/code) + [Superpowers](https://superpowers.ai) 向けの公式スキルです。
GlotNexusの日本語AIニュースをClaude Code上で直接取得できます。

---

## 前提条件

- [Claude Code](https://claude.ai/code) がインストール済みであること
- [Superpowers プラグイン](https://superpowers.ai) がセットアップ済みであること

---

## インストール方法 / Installation

### 方法1: curl（推奨）

```bash
# スキルディレクトリを作成（初回のみ）
mkdir -p ~/.claude/skills

# glotnexus-news スキルをインストール
curl -o ~/.claude/skills/glotnexus-news.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/glotnexus-news.md

# ai-news-briefing スキルをインストール
curl -o ~/.claude/skills/ai-news-briefing.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/ai-news-briefing.md
```

### 方法2: 手動コピー

このリポジトリの `skills/*.md` ファイルを `~/.claude/skills/` にコピーする。

---

## 使い方 / Usage

### `glotnexus-news` — オンデマンドニュース取得

Claude Codeに自然言語で話しかけるだけ:

| 発言例 | 動作 |
|--------|------|
| 「AIニュース教えて」 | 最新10件のAIニュースを表示 |
| 「今日のAI動向は？」 | 最新10件のAIニュースを表示 |
| 「機械学習のニュースを5件見せて」 | 機械学習カテゴリのニュースを5件表示 |
| 「自然言語処理の最新情報」 | NLPカテゴリのニュースを表示 |

**利用可能なカテゴリ**: 機械学習 / 自然言語処理 / コンピュータビジョン / ロボティクス / AI倫理 / AI研究 / ビジネス活用 / AI

---

### `ai-news-briefing` — 朝・夕ブリーフィング

`/ai-news-briefing` または「AIニュースブリーフィングして」で起動。

- **朝（JSTで12:00前）**: トップ5ニュース + 今日のトレンドキーワード + 注目ポイント
- **夕（JSTで12:00以降）**: 今日の主要ニュース5選 + 明日のウォッチリスト + 総括

---

## データソース

すべてのニュースは [GlotNexus](https://glotnexus.jp) が提供しています。
18以上のAI専門RSSフィード（OpenAI, Google AI, Anthropic, VentureBeat AI等）から収集し、日本語に自動翻訳したものです。

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- [Superpowers plugin](https://superpowers.ai) configured

## Install

```bash
mkdir -p ~/.claude/skills
curl -o ~/.claude/skills/glotnexus-news.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/glotnexus-news.md
curl -o ~/.claude/skills/ai-news-briefing.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/ai-news-briefing.md
```

## Skills

**`glotnexus-news`** — Get latest AI news in Japanese on demand.
Say "AIニュース教えて" or "Give me AI news" to trigger.

**`ai-news-briefing`** — Morning/evening AI news briefing.
Run `/ai-news-briefing` for a structured briefing based on time of day (JST).

Powered by [GlotNexus](https://glotnexus.jp) — AI news from around the world, in Japanese.
```

- [ ] **Step 2: コミットする**

```bash
git add skills/README.md
git commit -m "docs: skills/README.md を追加（インストール手順）(issue #9)"
```

---

## Task 4: メイン `README.md` にスキルセクションを追加する

**Files:**
- Modify: `README.md`

- [ ] **Step 1: `README.md` を読んで既存の構成を確認する**

```bash
grep -n "^##" README.md
```

現在の見出し構成を把握する。

- [ ] **Step 2: `README.md` の「主な機能」セクションにスキルを追記する**

`README.md` の `### 主な機能` の最後の箇条書き行（`- ✅ **ハイブリッド構成**: Express サーバー + Vercel Serverless Functions`）の直後、空行の前に以下を追加する:

```markdown
- ✅ **Claude Code スキル**: Superpowers互換スキルを提供。Claude Code上でAIニュースを直接取得可能
```

- [ ] **Step 3: `README.md` に「Claude Code スキル」セクションを追加する**

`## 🤝 コントリビューション` セクションの直前（その `---` セパレーターの前）に以下を追加する:

```markdown
---

## 🤖 Claude Code スキル

Claude Code + Superpowers ユーザー向けに、GlotNexusのAIニュースをClaude Code上で直接取得できるスキルを提供しています。

```bash
# インストール
mkdir -p ~/.claude/skills
curl -o ~/.claude/skills/glotnexus-news.md \
  https://raw.githubusercontent.com/t1k2a/ai-news-reader-app-native/main/skills/glotnexus-news.md
```

詳細は [`skills/README.md`](./skills/README.md) を参照してください。
```

- [ ] **Step 4: コミットする**

```bash
git add README.md
git commit -m "docs: README.md にClaude Codeスキルセクションを追加 (issue #9)"
```

---

## Task 5: 動作確認（スモークテスト）

**Files:** なし（確認のみ）

- [ ] **Step 1: インストール手順を手元で試す**

```bash
mkdir -p ~/.claude/skills
cp skills/glotnexus-news.md ~/.claude/skills/
cp skills/ai-news-briefing.md ~/.claude/skills/
```

- [ ] **Step 2: Claude Codeを再起動してスキルが認識されているか確認する**

Claude Codeを再起動し、以下を実行:
```
/glotnexus-news
```
または「AIニュース教えて」と入力。

期待する動作:
- WebFetch が `https://glotnexus.jp/api/news?limit=10` を呼ぶ
- JSONレスポンスが返ってくる
- 記事一覧が整形されて表示される
- 末尾に `glotnexus.jp` へのリンクがある

次に、カテゴリ指定の動作も確認する。Claude Codeに「機械学習のニュースを3件見せて」と入力。

期待する動作:
- WebFetch が `https://glotnexus.jp/api/news?limit=3&category=機械学習` を呼ぶ
- 機械学習カテゴリの記事が3件表示される

- [ ] **Step 3: `ai-news-briefing` の動作確認**

```
/ai-news-briefing
```

期待する動作:
- 現在時刻（JST）に応じて朝/夕モードが選択される
- WebFetch が `https://glotnexus.jp/api/news?limit=20` を呼ぶ
- フォーマット通りのブリーフィングが表示される
- 末尾に `powered by GlotNexus` がある

> **両モードの確認について**: 実行時刻によって片方のモードしか確認できない場合がある。もう一方のモードを確認したい場合は、「現在時刻はJSTで午前9時として、今朝のAIニュースブリーフィングをして」のようにプロンプトで時刻を指定して強制することができる。

- [ ] **Step 4: Issue #9 をクローズする**

```bash
gh issue close 9 --comment "Superpowers互換スキル2本を追加しました。MCPはPhase 2として別issueで対応予定。\n\n- skills/glotnexus-news.md\n- skills/ai-news-briefing.md\n- skills/README.md"
```
