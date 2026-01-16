# AI News Reader アプリケーション GCP デプロイレポート

**作成日**: 2026年1月10日
**デプロイ先**: Google Cloud Platform (Cloud Run)

| 項目 | 値 |
|---|---|
| **サービスURL** | https://ai-news-reader-1007179888594.asia-northeast1.run.app |
| **サービス名** | ai-news-reader |
| **リビジョン** | ai-news-reader-00003-xp5 |
| **リージョン** | asia-northeast1 (東京) |

上記のURLにアクセスすると、アプリが表示されます！

---

## 📋 目次

1. [概要](#概要)
2. [発生した問題と解決方法](#発生した問題と解決方法)
3. [最終的なアーキテクチャ](#最終的なアーキテクチャ)
4. [作成・変更したファイル](#作成変更したファイル)
5. [今後の運用コマンド](#今後の運用コマンド)

---

## 概要

既存のAI News Readerアプリケーション（Express + React + Vite）をPulumiを使用してGoogle Cloud Platform上にデプロイするタスクを実行しました。

当初の目標：
- Pulumiプロジェクトの初期化
- GCPストレージバケットの作成
- アプリケーション本体のCloud Runへのデプロイ

---

## 発生した問題と解決方法

### 問題 1: Pulumiコマンドが見つからない

**症状**:
```
pulumi: command not found
```

**原因**: Pulumiがシステムのパスに含まれていなかった。

**解決方法**: Pulumiのフルパス `~/.pulumi/bin/pulumi` を使用してコマンドを実行。

---

### 問題 2: Pulumiログインが必要

**症状**:
```
Enter your access token from https://app.pulumi.com/account/tokens
```

**原因**: Pulumiクラウドへのログインが求められた。

**解決方法**: `pulumi login --local` を実行してローカルバックエンドを使用するように設定。

---

### 問題 3: GCPプロジェクトIDが未設定

**症状**:
```
error: project: required field is not set
```

**原因**: PulumiにGCPプロジェクトIDが設定されていなかった。

**解決方法**: 
```bash
gcloud projects list --format="value(projectId)" | head -1
pulumi config set gcp:project <project-id>
```

---

### 問題 4: package.jsonがPulumiによって上書きされた

**症状**:
```
npm ERR! Missing script: "dev"
```

**原因**: `pulumi new --force` がルートディレクトリのpackage.jsonを上書きし、アプリケーションのスクリプト（`npm run dev`など）が消えた。

**解決方法**: 
1. `git show HEAD:package.json` で元のpackage.jsonを取得
2. 元の依存関係とPulumiの依存関係をマージして復元
3. `npm install` を再実行

---

### 問題 5: ES Module と Pulumi の競合

**症状**:
```
TypeError: Unknown file extension ".ts" for /home/joji/ai-news-reader-app-native/index.ts
```

**原因**: アプリケーションのpackage.jsonに `"type": "module"` が設定されており、Pulumiの実行と競合した。

**解決方法**: Pulumiプロジェクトをルートディレクトリではなく `infra/` サブディレクトリに分離。

```bash
mkdir -p infra
cd infra
pulumi new gcp-typescript --yes --force
```

---

### 問題 6: uniformBucketLevelAccess の必須化

**症状**:
```
error: Request violates constraint 'constraints/storage.uniformBucketLevelAccess'
```

**原因**: GCPの組織ポリシーにより、バケット作成時に`uniformBucketLevelAccess`が必須だった。

**解決方法**: Pulumiコード内でバケット設定に `uniformBucketLevelAccess: true` を追加。

```typescript
const bucket = new gcp.storage.Bucket("my-bucket", {
    location: "ASIA-NORTHEAST1",
    forceDestroy: true,
    uniformBucketLevelAccess: true,  // 追加
});
```

---

### 問題 7: DockerデーモンがWSL環境で動作しない

**症状**:
```
error: Docker native provider returned an unexpected error: failed to connect to any docker daemon
```

**原因**: WSL環境でDockerデーモンが起動していなかった。

**解決方法**: ローカルのDockerを使う代わりに、**Google Cloud Build**を使用してリモートでイメージをビルドする方式に変更。

```typescript
// @pulumi/docker を使う代わりに @pulumi/command を使用
const buildImage = new command.local.Command("build-and-push", {
    create: pulumi.interpolate`gcloud builds submit --project ${project} --tag ${imageName} .`,
    dir: "..",
}, { dependsOn: [registry] });
```

---

### 問題 8: Cloud Runコンテナが起動しない（モジュール未発見エラー）

**症状**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /app/dist/index.js
```

**原因**: 
- サーバーコード (`server/vite.ts`) が `../vite.config` をインポート
- `vite.config.ts` が `@vitejs/plugin-react` をインポート
- esbuildでバンドル時にこれらの開発依存がサーバーバンドルに含まれた
- 本番Dockerイメージには `--omit=dev` で開発依存がインストールされていないため、実行時にエラー

**解決方法**: `server/vite.ts` を修正し、開発環境でのみ使用されるモジュールをすべて**動的インポート**に変更。

```typescript
// 変更前（静的インポート - バンドルに含まれる）
import { createServer } from "vite";
import viteConfig from "../vite.config";

// 変更後（動的インポート - 実行時に遅延読み込み）
export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const react = await import("@vitejs/plugin-react");
  const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
  const glsl = await import("vite-plugin-glsl");
  const { nanoid } = await import("nanoid");
  // ... 以下設定
}
```

これにより、本番環境（`NODE_ENV=production`）では `setupVite` が呼ばれず、開発依存モジュールのインポートも発生しない。

---

### 問題 9: Cloud Runサービスの削除保護

**症状**:
```
error: cannot destroy service without setting deletion_protection=false
```

**原因**: 古いCloud Runサービスに削除保護が有効になっていた。

**解決方法**: `pulumi state delete` を使用してPulumiの状態から古いリソースを手動で削除。

---

## 最終的なアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  Cloud Build     │───▶│  Artifact Registry            │   │
│  │  (イメージビルド)  │    │  (ai-news-reader リポジトリ)  │   │
│  └──────────────────┘    └──────────────────────────────┘   │
│                                    │                         │
│                                    ▼                         │
│                          ┌──────────────────┐                │
│                          │   Cloud Run       │                │
│                          │  (ai-news-reader) │                │
│                          │                   │                │
│                          │  - Node.js 20     │                │
│                          │  - Express        │                │
│                          │  - 東京リージョン   │                │
│                          └──────────────────┘                │
│                                    │                         │
│                                    ▼                         │
│                          ┌──────────────────┐                │
│                          │  インターネット    │                │
│                          │  (公開アクセス)    │                │
│                          └──────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 作成・変更したファイル

| ファイル | 種別 | 説明 |
|---------|------|------|
| `Dockerfile` | 新規作成 | マルチステージビルド用Dockerfile |
| `.dockerignore` | 新規作成 | Dockerビルド時の除外設定 |
| `infra/index.ts` | 新規作成 | Pulumiインフラコード（Cloud Run + Artifact Registry） |
| `infra/Pulumi.yaml` | 自動生成 | Pulumiプロジェクト設定 |
| `infra/Pulumi.dev.yaml` | 自動生成 | devスタック設定（GCPプロジェクトID含む） |
| `server/vite.ts` | 変更 | 開発依存モジュールを動的インポートに変更 |
| `package.json` | 変更 | Pulumi依存の追加（元の内容を復元後マージ） |

---

## 今後の運用コマンド

### サービスの状態確認
```bash
gcloud run services describe ai-news-reader \
  --project project-933b6b1d-0696-437d-b82 \
  --region asia-northeast1
```

### ログの確認
```bash
gcloud run services logs read ai-news-reader \
  --project project-933b6b1d-0696-437d-b82 \
  --region asia-northeast1
```

### 新しいバージョンのデプロイ
```bash
# 1. イメージをビルド
gcloud builds submit \
  --project project-933b6b1d-0696-437d-b82 \
  --tag asia-northeast1-docker.pkg.dev/project-933b6b1d-0696-437d-b82/ai-news-reader/app:v4 \
  .

# 2. Cloud Runを更新
gcloud run services update ai-news-reader \
  --image asia-northeast1-docker.pkg.dev/project-933b6b1d-0696-437d-b82/ai-news-reader/app:v4 \
  --project project-933b6b1d-0696-437d-b82 \
  --region asia-northeast1
```

### Pulumiでの管理（infraディレクトリ内）
```bash
cd infra
export PULUMI_CONFIG_PASSPHRASE=""

# プレビュー
~/.pulumi/bin/pulumi preview

# デプロイ
~/.pulumi/bin/pulumi up --yes

# リソースの削除
~/.pulumi/bin/pulumi destroy --yes
```

### サービスの削除（不要になった場合）
```bash
gcloud run services delete ai-news-reader \
  --project project-933b6b1d-0696-437d-b82 \
  --region asia-northeast1 \
  --quiet
```

---

## まとめ

本デプロイでは合計9つの問題に遭遇しましたが、すべて解決し、最終的にアプリケーションをGCP Cloud Run上で公開することに成功しました。

特に重要だった学びは：
1. **Pulumiプロジェクトは専用ディレクトリに分離**すべき（既存アプリとの競合を避けるため）
2. **開発依存モジュールは動的インポート**を使用して本番バンドルから除外すべき
3. **WSL環境ではCloud Build**を使用することでローカルDocker不要でビルド可能

---

*このレポートは自動生成されました。*
