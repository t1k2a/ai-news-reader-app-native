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
