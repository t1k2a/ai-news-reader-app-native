// AI News Item の型定義

export interface AINewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  summary: string;
  firstParagraph?: string;
  publishDate: Date;
  sourceName: string;
  sourceLanguage: string;
  categories: string[];
  originalTitle?: string;
  originalContent?: string;
  originalSummary?: string;
  originalFirstParagraph?: string;
}

export interface FeedInfo {
  url: string;
  name: string;
  language: string;
  defaultCategories: string[];
}
