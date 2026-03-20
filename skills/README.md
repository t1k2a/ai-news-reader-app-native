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
