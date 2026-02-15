# 📅 X (Twitter) 投稿スケジュール最適化

## 現在のスケジュール

Vercel Cronで1日3回、日本時間のピークタイムに自動投稿を実行します。

### 投稿時刻（日本時間 JST）

| 時間帯 | JST | UTC | 理由 |
|--------|-----|-----|------|
| 🌅 **朝** | 08:00 | 23:00（前日） | 通勤時間、スマホチェック率が高い |
| 🌞 **昼** | 12:30 | 03:30 | 昼休み、リラックスタイム |
| 🌙 **夜** | 20:00 | 11:00 | 帰宅後、SNS利用ピーク |

### Cron表記（UTC基準）

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-post",
      "schedule": "0 23 * * *"
    },
    {
      "path": "/api/cron/auto-post",
      "schedule": "30 3 * * *"
    },
    {
      "path": "/api/cron/auto-post",
      "schedule": "0 11 * * *"
    }
  ]
}
```

## エンゲージメントが高い時間帯の根拠

### 日本のSNS利用傾向（調査データより）

1. **朝（7-9時）**
   - 通勤電車でのスマホ利用
   - 朝食時のニュースチェック
   - 仕事開始前のSNS確認

2. **昼（12-13時）**
   - ランチタイムのリラックス
   - 休憩時間のSNS閲覧
   - 午後の仕事前の情報収集

3. **夜（19-22時）**
   - 帰宅後のリラックスタイム
   - 夕食後のSNS利用ピーク
   - 1日の総括、トレンドチェック

### AI・テック系コンテンツの特性

- **朝投稿**: 最新ニュースとして認識されやすい
- **昼投稿**: 軽く読める技術情報が好まれる
- **夜投稿**: 詳しく読む時間があり、エンゲージメント率が最も高い

## 投稿頻度の設計

### 現在: 1日3回（最大30投稿/日）

- 1回あたり最大10投稿（`AUTO_POST_MAX_PER_RUN=10`）
- 投稿間隔10秒（`AUTO_POST_DELAY_SECONDS=10`）
- 合計所要時間: 約100秒/回（10投稿 × 10秒）

### なぜ1日3回？

**避けるべき問題:**
- ❌ 投稿頻度が高すぎる → スパム認定、フォロワー減少
- ❌ 投稿頻度が低すぎる → 露出不足、成長が遅い

**最適なバランス:**
- ✅ 1日3回 = フォロワーのタイムラインを圧迫しない
- ✅ ピークタイムに集中 = エンゲージメント最大化
- ✅ 時間帯分散 = 異なるオーディエンスにリーチ

## Vercel Cronの設定

### 必要な設定

1. **`vercel.json` にCronを追加**（完了✅）
2. **環境変数 `CRON_SECRET` を設定**
   ```bash
   # ランダムな文字列を生成
   openssl rand -base64 32

   # Vercel Dashboard で設定
   # Settings → Environment Variables → CRON_SECRET
   ```

3. **Function timeout を 300秒に設定**（完了✅）
   - デフォルト: 10秒
   - 必要: 300秒（10投稿 × 10秒 + バッファ）
   - 注意: Vercel Pro プラン以上が必要

### デプロイ後の確認

```bash
# Vercel Cronのログを確認
vercel logs --follow

# 特定のCronジョブのログ
vercel logs --follow --filter="cron/auto-post"
```

## A/Bテストによる最適化

### 投稿時刻の最適化（将来的）

1. **データ収集（1-2週間）**
   - 各時間帯のインプレッション数
   - エンゲージメント率（いいね、リツイート、返信）
   - クリック率（サイト訪問）

2. **分析と調整**
   - 最もパフォーマンスが良い時間帯を特定
   - 低パフォーマンスの時間帯を調整または削除
   - 新しい時間帯をテスト

3. **継続的改善**
   - 月次でスケジュールレビュー
   - 季節変動を考慮（夏休み、年末年始など）
   - トレンド変化に対応

## モニタリング

### チェックすべきKPI

| KPI | 目標（フェーズ1） | 測定方法 |
|-----|-----------------|---------|
| インプレッション/投稿 | 100+ | X Analytics |
| エンゲージメント率 | 2-5% | X Analytics |
| クリック率 | 1-3% | Google Analytics（UTMパラメータ） |
| フォロワー増加 | +5-15/週 | X Analytics |

### アラート設定

- 投稿失敗が3回連続 → Slack/メール通知
- エンゲージメント率が1%以下 → レビューが必要
- API制限に到達 → 投稿頻度を調整

## トラブルシューティング

### Cronが実行されない場合

1. **Vercel Dashboard で確認**
   - Settings → Cron Jobs
   - ステータスが "Active" か確認

2. **環境変数を確認**
   - `CRON_SECRET` が設定されているか
   - X API credentials が正しいか

3. **ログを確認**
   ```bash
   vercel logs --follow --filter="cron"
   ```

### 投稿が失敗する場合

1. **X API制限**
   - ツイート: 300投稿/3時間（Free tier）
   - 読み込み: 300リクエスト/15分
   → 投稿頻度を下げる

2. **タイムアウトエラー**
   - Function timeout が足りない
   → `vercel.json` で `maxDuration: 300` を確認

3. **認証エラー**
   - X API credentials が期限切れ
   → Developer Portal で再生成

## 参考資料

- [Vercel Cron Jobs ドキュメント](https://vercel.com/docs/cron-jobs)
- [X API Rate Limits](https://developer.x.com/en/docs/twitter-api/rate-limits)
- [Best Time to Post on X (Twitter) in Japan](https://buffer.com/resources/best-time-to-tweet-research/)

---

**最終更新**: 2026-02-15
**バージョン**: 1.0
