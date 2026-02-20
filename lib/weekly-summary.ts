/**
 * 週次AIニュースまとめスレッド
 * 過去7日間のトップ5記事をXスレッドとして自動投稿
 */

import type { SendTweetV2Params } from "twitter-api-v2";
import { createXClient, SOURCE_PRIORITY } from "./auto-post.js";
import { generateBrandCard } from "./brand-card.js";
import {
  getWeeklySummaryLastPosted,
  setWeeklySummaryLastPosted,
} from "./cache.js";
import { summarizeForTweet } from "./translation-api.js";
import type { AINewsItem } from "./types.js";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://glotnexus.jp";
const X_MAX_CHARS = 280;

export interface WeeklySummaryResult {
  success: boolean;
  threadTweetIds: string[];
  articlesIncluded: number;
  error?: string;
}

/**
 * 過去7日間の記事からトップN件を選定
 * ソース別重複排除で多様性を確保
 */
export function selectTopArticles(
  articles: AINewsItem[],
  count: number = 5
): AINewsItem[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 過去7日間の記事をフィルタ
  const recentArticles = articles.filter(
    (a) => new Date(a.publishDate).getTime() >= oneWeekAgo.getTime()
  );

  // ソース優先度→公開日時でソート
  const sorted = [...recentArticles].sort((a, b) => {
    const priorityA = SOURCE_PRIORITY[a.sourceName] || 1;
    const priorityB = SOURCE_PRIORITY[b.sourceName] || 1;
    if (priorityA !== priorityB) return priorityB - priorityA;
    return (
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
  });

  // ソース別重複排除（同一ソースから1記事のみ）
  const seenSources = new Set<string>();
  const deduped: AINewsItem[] = [];
  for (const article of sorted) {
    if (!seenSources.has(article.sourceName)) {
      seenSources.add(article.sourceName);
      deduped.push(article);
    }
    if (deduped.length >= count) break;
  }

  return deduped;
}

/**
 * スレッド用ツイートテキスト配列を生成
 * [ヘッダー, 記事1, 記事2, ..., CTA]
 */
export function formatWeeklySummaryThread(articles: AINewsItem[]): string[] {
  const tweets: string[] = [];

  // ヘッダーツイート
  tweets.push(
    [
      "【今週のAIニュース TOP5】",
      "",
      "今週も世界のAI業界から注目ニュースをお届け!",
      "",
      "#生成AI #AI #GlotNexus",
    ].join("\n")
  );

  // 各記事ツイート
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const num = i + 1;
    const encodedId = encodeURIComponent(article.id);
    const url = `${APP_BASE_URL}/?article=${encodedId}`;

    // 文字数予算を計算
    const prefix = `${num}/ `;
    const urlLength = 23; // t.co短縮
    const separators = 4; // \n\n × 2
    const overhead = prefix.length + urlLength + separators;
    const available = X_MAX_CHARS - overhead;

    let title = article.title;
    let summary = article.summary ? summarizeForTweet(article.summary) : "";

    // 文字数オーバー時の調整
    const totalLen = title.length + (summary ? summary.length + 2 : 0);
    if (totalLen > available) {
      if (summary) {
        const summarySpace = available - title.length - 2;
        if (summarySpace > 20) {
          summary = summary.slice(0, summarySpace - 3) + "...";
        } else {
          title = title.slice(0, available - 3) + "...";
          summary = "";
        }
      } else {
        title = title.slice(0, available - 3) + "...";
      }
    }

    const parts = [`${prefix}${title}`];
    if (summary) {
      parts.push("", summary);
    }
    parts.push("", url);

    tweets.push(parts.join("\n"));
  }

  // CTAツイート
  tweets.push(
    [
      "全記事を日本語で読めます",
      "",
      APP_BASE_URL,
      "",
      "来週もお届けします!",
      "フォロー & リポストで応援お願いします",
      "",
      "#生成AI #AI #海外のAIニュース #GlotNexus",
    ].join("\n")
  );

  return tweets;
}

/**
 * 週次まとめスレッドの投稿オーケストレーション
 */
export async function postWeeklySummaryThread(
  articles: AINewsItem[]
): Promise<WeeklySummaryResult> {
  // 1. 今週既に投稿済みかチェック
  const lastPosted = await getWeeklySummaryLastPosted();
  if (lastPosted) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (new Date(lastPosted) > oneWeekAgo) {
      console.log(`Weekly summary already posted on ${lastPosted}, skipping`);
      return {
        success: false,
        threadTweetIds: [],
        articlesIncluded: 0,
        error: "Already posted this week",
      };
    }
  }

  // 2. トップ記事を選定
  const topArticles = selectTopArticles(articles);
  if (topArticles.length === 0) {
    return {
      success: false,
      threadTweetIds: [],
      articlesIncluded: 0,
      error: "No articles from past 7 days",
    };
  }

  // 3. X APIクライアント作成
  const client = createXClient();
  if (!client) {
    return {
      success: false,
      threadTweetIds: [],
      articlesIncluded: 0,
      error: "X API client not available",
    };
  }

  // 4. スレッドテキスト生成
  const tweetTexts = formatWeeklySummaryThread(topArticles);

  // 5. ヘッダー用ブランドカード生成
  let headerMediaId: string | undefined;
  if (process.env.USE_BRAND_CARD === "true") {
    try {
      const headerImage = await generateBrandCard(topArticles[0]);
      headerMediaId = await client.v1.uploadMedia(headerImage, {
        mimeType: "image/png",
      });
    } catch (err) {
      console.error("Failed to generate/upload header brand card:", err);
      // ブランドカード失敗時はテキストのみで続行
    }
  }

  // 6. tweetThread用ペイロード構築
  const threadPayload: (SendTweetV2Params | string)[] = tweetTexts.map(
    (text, index) => {
      if (index === 0 && headerMediaId) {
        return {
          text,
          media: { media_ids: [headerMediaId] },
        } as SendTweetV2Params;
      }
      return text;
    }
  );

  // 7. スレッド投稿
  try {
    const results = await client.v2.tweetThread(threadPayload);
    const tweetIds = results.map((r) => r.data.id);

    // 8. 投稿タイムスタンプ記録
    await setWeeklySummaryLastPosted(new Date().toISOString());

    return {
      success: true,
      threadTweetIds: tweetIds,
      articlesIncluded: topArticles.length,
    };
  } catch (error) {
    const err = error as { data?: unknown; message?: string };
    console.error(
      "Failed to post weekly summary thread:",
      err.data || err.message
    );
    return {
      success: false,
      threadTweetIds: [],
      articlesIncluded: topArticles.length,
      error: err.message || String(error),
    };
  }
}
