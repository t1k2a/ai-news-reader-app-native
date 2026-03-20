/**
 * ブランドカード画像生成モジュール
 *
 * X (Twitter) 投稿に添付するブランドカード画像を自動生成する。
 * 画像付き投稿はアルゴリズムにより優遇され、インプレッションが150-300%向上する。
 *
 * 画像仕様:
 * - サイズ: 1200x675px (Twitter推奨の16:9比率)
 * - フォーマット: PNG
 * - 内容: グラデーション背景 + ソース名 + 記事タイトル + GlotNexusブランディング
 */

import { createCanvas, registerFont, type CanvasRenderingContext2D } from "canvas";
import type { AINewsItem } from "./types.js";
import path from "path";

// 日本語フォントを登録（Vercel 環境での文字化けを防ぐ）
try {
  registerFont(
    path.join(process.cwd(), "assets/fonts/NotoSansJP-Bold.ttf"),
    { family: "NotoSansJP", weight: "bold" }
  );
  registerFont(
    path.join(process.cwd(), "assets/fonts/NotoSansJP-Regular.ttf"),
    { family: "NotoSansJP" }
  );
} catch (e) {
  console.warn("NotoSansJP font registration failed (non-fatal):", e);
}

// 画像サイズ（Twitter推奨のsummary_large_image向け）
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

/**
 * ソース名からテーマカラーを取得
 */
const SOURCE_THEME_MAP: Record<
  string,
  { primary: string; secondary: string; accent: string }
> = {
  "OpenAI Blog": {
    primary: "#10a37f",
    secondary: "#1a7f64",
    accent: "#0d8c6d",
  },
  "Google AI Blog": {
    primary: "#4285f4",
    secondary: "#3367d6",
    accent: "#2a56c6",
  },
  "Google DeepMind Blog": {
    primary: "#4285f4",
    secondary: "#174ea6",
    accent: "#1a73e8",
  },
  "Anthropic News": {
    primary: "#d4a574",
    secondary: "#c4956a",
    accent: "#b08660",
  },
  "NVIDIA Technical Blog": {
    primary: "#76b900",
    secondary: "#5a9e00",
    accent: "#4a8500",
  },
  "Meta AI Blog": {
    primary: "#0668e1",
    secondary: "#0553b9",
    accent: "#044291",
  },
  "Microsoft Research Blog": {
    primary: "#00a4ef",
    secondary: "#0078d4",
    accent: "#005da6",
  },
  "Hugging Face Blog": {
    primary: "#ff9d00",
    secondary: "#e08c00",
    accent: "#c77c00",
  },
  "Mistral AI News": {
    primary: "#ff7000",
    secondary: "#e06300",
    accent: "#c75600",
  },
  "xAI Blog": {
    primary: "#1d9bf0",
    secondary: "#1a8cd8",
    accent: "#1577b5",
  },
  "Stability AI Blog": {
    primary: "#9333ea",
    secondary: "#7e22ce",
    accent: "#6b21a8",
  },
  "VentureBeat AI": {
    primary: "#e74c3c",
    secondary: "#c0392b",
    accent: "#a93226",
  },
  "TechCrunch AI": {
    primary: "#0a9e01",
    secondary: "#088501",
    accent: "#066d01",
  },
  "AI News": {
    primary: "#3498db",
    secondary: "#2980b9",
    accent: "#2471a3",
  },
  "arXiv cs.AI": {
    primary: "#b31b1b",
    secondary: "#8b1515",
    accent: "#6e1010",
  },
  "arXiv cs.LG": {
    primary: "#b31b1b",
    secondary: "#8b1515",
    accent: "#6e1010",
  },
  "Papers with Code": {
    primary: "#21cbaf",
    secondary: "#1bb399",
    accent: "#169b84",
  },
  "Databricks Blog": {
    primary: "#ff3621",
    secondary: "#e02e1b",
    accent: "#c72616",
  },
  "Cohere Blog": {
    primary: "#39594d",
    secondary: "#2d4a3f",
    accent: "#213b31",
  },
};

const DEFAULT_THEME = {
  primary: "#6366f1",
  secondary: "#4f46e5",
  accent: "#4338ca",
};

/**
 * ソース名から絵文字を取得
 */
const SOURCE_EMOJI: Record<string, string> = {
  "OpenAI Blog": "🧠",
  "Google AI Blog": "🔍",
  "Google DeepMind Blog": "🔬",
  "Anthropic News": "🤖",
  "NVIDIA Technical Blog": "💚",
  "Meta AI Blog": "🌐",
  "Microsoft Research Blog": "💻",
  "Hugging Face Blog": "🤗",
  "Mistral AI News": "🌬️",
  "xAI Blog": "⚡",
  "Stability AI Blog": "🎨",
  "VentureBeat AI": "📰",
  "TechCrunch AI": "📱",
  "AI News": "🗞️",
  "arXiv cs.AI": "📄",
  "arXiv cs.LG": "📄",
  "Papers with Code": "📊",
  "Databricks Blog": "⚙️",
  "Cohere Blog": "💬",
};

/**
 * テキストを指定幅内で折り返し
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;

      if (lines.length >= maxLines) {
        // 最終行を「...」で終了
        const lastLine = lines[lines.length - 1];
        if (lastLine.length > 3) {
          lines[lines.length - 1] = lastLine.slice(0, -3) + "...";
        }
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 角丸矩形を描画
 */
function roundRect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * ブランドカード画像を生成
 *
 * @param item 記事情報
 * @returns PNG画像のBuffer
 */
export async function generateBrandCard(item: AINewsItem): Promise<Buffer> {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  const theme = SOURCE_THEME_MAP[item.sourceName] || DEFAULT_THEME;
  const emoji = SOURCE_EMOJI[item.sourceName] || "📰";

  // ============================
  // 1. 背景グラデーション
  // ============================
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#0f0f23");
  gradient.addColorStop(0.5, "#1a1a3e");
  gradient.addColorStop(1, "#0f0f23");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // ============================
  // 2. 装飾的な円（グロー効果）
  // ============================
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = theme.primary;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH * 0.85, CARD_HEIGHT * 0.2, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.secondary;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH * 0.15, CARD_HEIGHT * 0.8, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ============================
  // 3. テーマカラーのアクセントバー（上部）
  // ============================
  const barGradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  barGradient.addColorStop(0, theme.primary);
  barGradient.addColorStop(1, theme.secondary);
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, 0, CARD_WIDTH, 6);

  // ============================
  // 4. ソース名バッジ（左上）
  // ============================
  const sourceName = item.sourceName;
  ctx.font = 'bold 24px "NotoSansJP"';
  const sourceText = `${emoji}  ${sourceName}`;
  const sourceMetrics = ctx.measureText(sourceText);
  const badgePadX = 20;
  const badgePadY = 10;
  const badgeW = sourceMetrics.width + badgePadX * 2;
  const badgeH = 44;
  const badgeX = 60;
  const badgeY = 50;

  // バッジの背景
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = theme.primary;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fill();
  ctx.restore();

  // バッジのボーダー
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.stroke();
  ctx.restore();

  // ソース名テキスト
  ctx.fillStyle = theme.primary;
  ctx.fillText(sourceText, badgeX + badgePadX, badgeY + 31);

  // ============================
  // 5. 記事タイトル（メインコンテンツ）
  // ============================
  const titleFontSize = 42;
  ctx.font = `bold ${titleFontSize}px "NotoSansJP"`;
  ctx.fillStyle = "#ffffff";

  const titleMaxWidth = CARD_WIDTH - 120;
  const title = item.title;
  const titleLines = wrapText(ctx, title, titleMaxWidth, 3);

  const titleStartY = 160;
  const titleLineHeight = titleFontSize * 1.4;

  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], 60, titleStartY + i * titleLineHeight);
  }

  // ============================
  // 6. 要約テキスト（サブテキスト）
  // ============================
  if (item.summary) {
    const summaryFontSize = 22;
    ctx.font = `${summaryFontSize}px "NotoSansJP"`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";

    const summaryMaxWidth = CARD_WIDTH - 120;
    const summaryText = item.summary.length > 120
      ? item.summary.slice(0, 117) + "..."
      : item.summary;
    const summaryLines = wrapText(ctx, summaryText, summaryMaxWidth, 2);

    const summaryStartY = titleStartY + titleLines.length * titleLineHeight + 30;
    const summaryLineHeight = summaryFontSize * 1.5;

    for (let i = 0; i < summaryLines.length; i++) {
      ctx.fillText(summaryLines[i], 60, summaryStartY + i * summaryLineHeight);
    }
  }

  // ============================
  // 7. フッター: GlotNexus ブランディング
  // ============================
  const footerY = CARD_HEIGHT - 60;

  // 区切り線
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, footerY - 20);
  ctx.lineTo(CARD_WIDTH - 60, footerY - 20);
  ctx.stroke();

  // GlotNexus ロゴテキスト
  ctx.font = 'bold 22px "NotoSansJP"';
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("🌐 GlotNexus", 60, footerY);

  // キャッチフレーズ
  ctx.font = '18px "NotoSansJP"';
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText("最新AIニュースを日本語で", 220, footerY);

  // 日付
  const dateStr = new Date(item.publishDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.font = '16px "NotoSansJP"';
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  const dateMetrics = ctx.measureText(dateStr);
  ctx.fillText(dateStr, CARD_WIDTH - 60 - dateMetrics.width, footerY);

  // ============================
  // 8. テーマカラーのアクセントバー（下部）
  // ============================
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, CARD_HEIGHT - 4, CARD_WIDTH, 4);

  // PNG として出力
  return canvas.toBuffer("image/png");
}

/**
 * テスト用: ブランドカードを保存
 */
export async function saveBrandCardToFile(
  item: AINewsItem,
  outputPath: string
): Promise<void> {
  const fs = await import("fs");
  const buffer = await generateBrandCard(item);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Brand card saved: ${outputPath} (${buffer.length} bytes)`);
}
