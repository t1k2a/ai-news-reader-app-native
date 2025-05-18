import { Helmet } from 'react-helmet-async';

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function Meta({
  title = 'AI News Reader - 最新のAI関連ニュースをシンプルに',
  description = 'AI News Readerは、最新のAI関連ニュースを自動収集し、日本語に翻訳して表示するサービスです。機械学習、自然言語処理、コンピュータビジョンなど様々な分野のAI情報を簡単に入手できます。',
  keywords = 'AI,人工知能,機械学習,ニュース,自然言語処理,コンピュータビジョン,最新技術',
  ogTitle,
  ogDescription,
  ogImage = '/og-image.png', // デフォルトのOGP画像
  ogUrl = 'https://ai-news-reader.replit.app',
  twitterCard = 'summary_large_image'
}: MetaProps) {
  return (
    <Helmet>
      {/* 基本メタタグ */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* OGP (Open Graph Protocol) タグ */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AI News Reader" />
      
      {/* Twitter Card タグ */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* その他のメタタグ */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#1e40af" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* 言語設定 */}
      <html lang="ja" />
      <meta httpEquiv="content-language" content="ja" />
      
      {/* キャノニカルURL */}
      <link rel="canonical" href={ogUrl} />
    </Helmet>
  );
}