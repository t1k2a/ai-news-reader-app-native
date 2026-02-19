/**
 * OGP画像（og-image.png）生成スクリプト
 *
 * Twitter Card / OGP 用の静的画像を生成する。
 * SVG では Twitter Card クローラーが画像を読み込めないため PNG で出力。
 *
 * 使い方:
 *   npx tsx scripts/generate-og-image.ts
 *
 * 出力:
 *   client/public/og-image.png (1200x630px)
 */

import { createCanvas } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 1200;
const HEIGHT = 630;

async function generateOgImage(): Promise<void> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // ============================
  // 1. 背景グラデーション
  // ============================
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#0f172a");  // slate-950
  gradient.addColorStop(0.5, "#1e3a8a"); // blue-900
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ============================
  // 2. 装飾的な円（グロー効果）
  // ============================
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(WIDTH * 0.2, HEIGHT * 0.5, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#60a5fa";
  ctx.beginPath();
  ctx.arc(WIDTH * 0.8, HEIGHT * 0.3, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ============================
  // 3. アクセントバー（上部）
  // ============================
  const barGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  barGradient.addColorStop(0, "#3b82f6");
  barGradient.addColorStop(1, "#6366f1");
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, 0, WIDTH, 6);

  // ============================
  // 4. ネットワーク図（左側）
  // ============================
  const nodes = [
    { x: 220, y: 315 },
    { x: 360, y: 200 },
    { x: 360, y: 430 },
    { x: 500, y: 315 },
  ];

  // エッジを描画
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 3;
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
    ctx.stroke();
  }
  ctx.restore();

  // ノードを描画
  for (const node of nodes) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#93c5fd";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ============================
  // 5. テキスト（右側）
  // ============================
  // サービス名
  ctx.font = "bold 90px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("GlotNexus", 600, 290);

  // キャッチフレーズ（英語）
  ctx.font = "28px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("AI News from Around the World", 600, 345);
  ctx.fillText("Translated into Japanese", 600, 382);

  // タグライン
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillStyle = "#60a5fa";
  ctx.fillText("glotnexus.jp", 600, 440);

  // ============================
  // 6. フッター区切り線
  // ============================
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, HEIGHT - 80);
  ctx.lineTo(WIDTH - 60, HEIGHT - 80);
  ctx.stroke();

  ctx.font = "18px Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText("Powered by AI Translation", 60, HEIGHT - 45);

  // ============================
  // 7. アクセントバー（下部）
  // ============================
  ctx.fillStyle = barGradient;
  ctx.fillRect(0, HEIGHT - 4, WIDTH, 4);

  // ============================
  // 出力
  // ============================
  const outputPath = path.resolve(__dirname, "../client/public/og-image.png");
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`og-image.png generated: ${outputPath} (${buffer.length} bytes)`);
}

generateOgImage().catch((err) => {
  console.error("Failed to generate og-image.png:", err);
  process.exit(1);
});
