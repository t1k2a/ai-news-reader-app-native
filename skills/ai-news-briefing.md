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
