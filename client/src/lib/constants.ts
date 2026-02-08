/**
 * アプリケーション全体で使用するグローバル定数
 */

// サービス名
export const APP_NAME = "GlotNexus";

// キャッチコピー（タグライン）
export const APP_TAGLINE = "海外AIメディアを翻訳・要約。見出しで掴む世界の最先端";

// サービス名 + キャッチコピー
export const APP_TITLE = `${APP_NAME} - ${APP_TAGLINE}`;

// 詳細な説明文（メタディスクリプション用）
export const APP_DESCRIPTION = `${APP_NAME}は、最新のAI関連ニュースを自動収集し、日本語に翻訳して表示するサービスです。機械学習、自然言語処理、コンピュータビジョンなど様々な分野のAI情報を簡単に入手できます。`;

// デフォルトのベースURL
export const APP_BASE_URL = "https://glotnexus.jp";

// OGP・ソーシャル共有用の短い説明
export const APP_SHORT_DESCRIPTION = `${APP_NAME}は、最新のAI関連ニュースを自動収集し、日本語に翻訳して表示するサービスです。`;

// AIカテゴリの定義（サーバーと同期）
export const AI_CATEGORIES = {
  ML: '機械学習',
  NLP: '自然言語処理',
  CV: 'コンピュータビジョン',
  ROBOTICS: 'ロボティクス',
  ETHICS: 'AI倫理',
  RESEARCH: 'AI研究',
  BUSINESS: 'ビジネス活用',
  GENERAL: 'AI'
};
