// シンプルな翻訳用モジュール
import axios from "axios";

/**
 * AI専門用語の翻訳辞書
 * Google Translateの誤訳を修正するために使用
 */
const AI_TERMINOLOGY_DICTIONARY: Record<string, string> = {
  // AI モデル名（長い名前を先にマッチさせるため順序に注意）
  "ChatGPT": "ChatGPT",
  "GPT-4o": "GPT-4o",
  "GPT-4": "GPT-4",
  "GPT-3.5": "GPT-3.5",
  "Gemini Ultra": "Gemini Ultra",
  "Gemini Pro": "Gemini Pro",
  "Gemini": "Gemini",
  "Claude": "Claude",
  "DALL-E 3": "DALL-E 3",
  "DALL-E": "DALL-E",
  "Stable Diffusion": "Stable Diffusion",
  "Midjourney": "Midjourney",
  "LLaMA": "LLaMA",
  "Llama 3": "Llama 3",
  "Llama": "Llama",
  "PaLM": "PaLM",
  "Mistral": "Mistral",
  "Mixtral": "Mixtral",
  "Sora": "Sora",
  "Copilot": "Copilot",
  "Grok": "Grok",
  "Phi-3": "Phi-3",
  "Command R": "Command R",
  "Cohere": "Cohere",

  // AI技術用語（長いフレーズを先に）
  "Artificial General Intelligence": "汎用人工知能（AGI）",
  "Large Language Model": "大規模言語モデル（LLM）",
  "Small Language Model": "小規模言語モデル（SLM）",
  "Vision Language Model": "視覚言語モデル（VLM）",
  "Retrieval-Augmented Generation": "検索拡張生成（RAG）",
  "Reinforcement Learning from Human Feedback": "人間のフィードバックによる強化学習（RLHF）",
  "Direct Preference Optimization": "直接選好最適化（DPO）",
  "Chain of Thought": "思考の連鎖（CoT）",
  "Mixture of Experts": "混合エキスパート（MoE）",
  "Prompt Engineering": "プロンプトエンジニアリング",
  "Reinforcement Learning": "強化学習",
  "Transfer Learning": "転移学習",
  "Federated Learning": "連合学習",
  "Continual Learning": "継続学習",
  "Deep Learning": "ディープラーニング",
  "Machine Learning": "機械学習",
  "Neural Network": "ニューラルネットワーク",
  "Fine-tuning": "ファインチューニング",
  "Multimodal": "マルチモーダル",
  "Transformer": "Transformer",
  "Embedding": "埋め込み",
  "Tokenizer": "トークナイザー",
  "Token": "トークン",
  "LLM": "LLM",
  "AGI": "AGI",
  "RAG": "RAG",
  "RLHF": "RLHF",
  "DPO": "DPO",
  "LoRA": "LoRA",
  "QLoRA": "QLoRA",
  "MoE": "MoE",
  "CoT": "CoT",
  "GGUF": "GGUF",
  "ONNX": "ONNX",

  // AI安全性・倫理用語
  "AI Safety": "AI安全性",
  "AI Alignment": "AIアライメント",
  "Hallucination": "ハルシネーション",
  "Guardrails": "ガードレール",
  "Red Teaming": "レッドチーミング",
  "Jailbreak": "ジェイルブレイク",
  "Bias": "バイアス",
  "Benchmark": "ベンチマーク",

  // AI応用分野
  "Computer Vision": "コンピュータビジョン",
  "Natural Language Processing": "自然言語処理（NLP）",
  "Text-to-Image": "テキストから画像生成",
  "Text-to-Video": "テキストから動画生成",
  "Text-to-Speech": "テキスト読み上げ（TTS）",
  "Speech-to-Text": "音声認識（STT）",
  "Image Generation": "画像生成",
  "Code Generation": "コード生成",
  "Autonomous Agent": "自律型エージェント",
  "AI Agent": "AIエージェント",
  "Agentic AI": "エージェント型AI",
  "Generative AI": "生成AI",
  "GenAI": "生成AI",

  // インフラ・技術用語
  "Inference": "推論",
  "Training": "学習",
  "Pre-training": "事前学習",
  "Quantization": "量子化",
  "Distillation": "蒸留",
  "Context Window": "コンテキストウィンドウ",
  "Attention Mechanism": "アテンション機構",
  "Diffusion Model": "拡散モデル",
  "Foundation Model": "基盤モデル",
  "Frontier Model": "フロンティアモデル",
  "On-device AI": "オンデバイスAI",
  "Edge AI": "エッジAI",

  // 一般的な技術用語
  "AI": "AI",
  "Artificial Intelligence": "人工知能",
  "API": "API",
  "Cloud": "クラウド",
  "Edge Computing": "エッジコンピューティング",
  "GPU": "GPU",
  "TPU": "TPU",
  "NPU": "NPU",
  "Open Source": "オープンソース",
  "Open Weight": "オープンウェイト",
  "Beta": "ベータ版",
  "Release": "リリース",
  "Startup": "スタートアップ",
  "Scaling Law": "スケーリング則",
};

/**
 * 専門用語辞書のエントリを長さ順にソート（長い用語を先にマッチさせるため）
 */
const SORTED_TERMINOLOGY_ENTRIES = Object.entries(AI_TERMINOLOGY_DICTIONARY)
  .sort((a, b) => b[0].length - a[0].length);

/**
 * 翻訳テキストをポストプロセスする
 * AI専門用語の修正、不自然な表現の改善
 */
function postProcessTranslation(text: string): string {
  if (!text) return text;

  let processed = text;

  // 専門用語辞書を適用（長い用語から順にマッチ）
  for (const [en, ja] of SORTED_TERMINOLOGY_ENTRIES) {
    // 単語境界を考慮した正規表現（部分一致を防ぐ）
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    processed = processed.replace(regex, ja);
  }

  // 不自然な翻訳パターンを修正
  processed = processed
    .replace(/(\d+)\s*億/g, "$1億")       // 「10 億」→「10億」
    .replace(/(\d+)\s*万/g, "$1万")       // 「100 万」→「100万」
    .replace(/(\d+)\s*兆/g, "$1兆")       // 「1 兆」→「1兆」
    .replace(/\s+([、。！？）」])/g, "$1")  // 句読点の前のスペース削除
    .replace(/([（「])\s+/g, "$1")         // 括弧の後のスペース削除
    // 日本語文字と英数字の間の余分なスペースを削除（英単語同士のスペースは保持）
    .replace(/([\u3000-\u9FFF\uF900-\uFAFF])\s+([A-Za-z0-9])/g, "$1$2")
    .replace(/([A-Za-z0-9])\s+([\u3000-\u9FFF\uF900-\uFAFF])/g, "$1$2")
    // Google翻訳が生成する不自然なパターンを修正
    .replace(/の\s+の/g, "の")             // 「の の」→「の」
    .replace(/を\s+を/g, "を")             // 重複助詞の修正
    .replace(/が\s+が/g, "が")
    .replace(/は\s+は/g, "は")
    .trim();

  return processed;
}

/**
 * テキストを自然な位置で切り詰める
 * 句読点や助詞の後、単語の区切りで切ることで自然な日本語を維持
 * @param text 切り詰めるテキスト
 * @param maxLength 最大文字数
 * @returns 切り詰められたテキスト
 */
function truncateAtNaturalBreak(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const limit = maxLength - 3; // 「...」の分
  const candidate = text.slice(0, limit);

  // 句点（。）、読点（、）、または助詞の後で切れる最後の位置を探す
  const breakPoints = [
    candidate.lastIndexOf("。"),
    candidate.lastIndexOf("、"),
    candidate.lastIndexOf("！"),
    candidate.lastIndexOf("？"),
    candidate.lastIndexOf(" "),
  ];

  // 最大文字数の半分以降にある区切りを採用（短すぎる切り詰めを避ける）
  const minBreak = Math.floor(limit * 0.5);
  const bestBreak = breakPoints
    .filter((pos) => pos >= minBreak)
    .sort((a, b) => b - a)[0];

  if (bestBreak !== undefined && bestBreak > 0) {
    return text.slice(0, bestBreak + 1).trim() + "...";
  }

  return candidate + "...";
}

/**
 * テキストを英語から日本語に翻訳する（強化版）
 * Googleの非公式APIを使用し、専門用語辞書でポストプロセス
 * @param text 翻訳するテキスト
 * @param maxLength 最大文字数（省略可、デフォルトは制限なし）
 * @returns 翻訳されたテキスト、またはエラーの場合は元のテキスト
 */
export async function translateToJapanese(
  text: string,
  maxLength?: number
): Promise<string> {
  if (!text) return "";

  try {
    // 長すぎるテキストは先に切り詰める（API制限対策）
    let textToTranslate = text;
    if (maxLength && text.length > maxLength * 2) {
      // 英語は日本語より短いことが多いので、2倍の余裕を持たせる
      textToTranslate = text.slice(0, maxLength * 2);
    }

    // 非公式APIを使用（低負荷用）
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=${encodeURIComponent(
      textToTranslate
    )}`;

    const { data } = await axios.get(url, { timeout: 5000 }); // 5秒タイムアウト

    // レスポンスから翻訳テキストを抽出
    let translatedText = "";
    if (data && data[0]) {
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) {
          translatedText += data[0][i][0];
        }
      }
    }

    if (!translatedText) {
      console.warn("翻訳結果が空です。元のテキストを返します。");
      return text;
    }

    // ポストプロセス（専門用語修正、不自然な表現の改善）
    let processed = postProcessTranslation(translatedText);

    // 最大文字数制限がある場合は自然な位置で切り詰め
    if (maxLength && processed.length > maxLength) {
      processed = truncateAtNaturalBreak(processed, maxLength);
    }

    return processed;
  } catch (error) {
    console.error("翻訳エラー:", error);
    // エラーの場合は元のテキストを返す（ただし最大文字数で切り詰め）
    if (maxLength && text.length > maxLength) {
      return truncateAtNaturalBreak(text, maxLength);
    }
    return text;
  }
}

/**
 * 長い記事のコンテンツを翻訳する
 * 段落ごとに分割して翻訳し、より効率的に処理する
 * @param content 翻訳する長いコンテンツ
 * @returns 翻訳されたコンテンツ
 */
export async function translateLongContent(content: string): Promise<string> {
  if (!content) return "";

  try {
    // HTMLタグを除去
    let cleanedContent = "";
    try {
      cleanedContent = stripHtmlTags(content);
    } catch (error) {
      console.error("HTMLタグの除去に失敗:", error);
      cleanedContent = content.replace(/<[^>]*>/g, ""); // 簡易的なタグ除去
    }

    // 段落で分割（改行や空行で区切る）
    const paragraphs = cleanedContent
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .filter((p) => p.trim() !== "");

    // 段落ごとに翻訳
    const translatedParagraphs = await batchTranslateToJapanese(paragraphs);

    // 翻訳された段落を元の形式で結合
    return translatedParagraphs.join("\n\n");
  } catch (error) {
    console.error("コンテンツ翻訳エラー:", error);
    return content; // エラーの場合は元のコンテンツを返す
  }
}

/**
 * 複数のテキストを一括で翻訳する
 * 注意: APIの制限に引っかからないよう、一度に大量のテキストを送らないこと
 * @param texts 翻訳するテキストの配列
 * @returns 翻訳されたテキストの配列
 */
export async function batchTranslateToJapanese(
  texts: string[]
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const validTexts = texts.filter((text) => text && text.trim() !== "");
  if (validTexts.length === 0) return [];

  try {
    // 5つずつに分割して処理（API制限を避けるため）
    const chunks = [];
    for (let i = 0; i < validTexts.length; i += 5) {
      chunks.push(validTexts.slice(i, i + 5));
    }

    const results: string[] = [];

    for (const chunk of chunks) {
      const promises = chunk.map((text) => translateToJapanese(text));
      const translatedChunk = await Promise.all(promises);
      results.push(...translatedChunk);

      // APIリクエスト制限を回避するための短い待機
      if (chunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error("一括翻訳エラー:", error);
    return validTexts; // エラーの場合は元のテキストを返す
  }
}

/**
 * HTMLタグを除去するヘルパー関数
 * @param html HTMLを含む可能性のあるテキスト
 * @returns HTMLタグを除去したプレーンテキスト
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

  // HTMLタグを除去
  const plainText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // スクリプトタグを削除
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // スタイルタグを削除
    .replace(/<[^>]*>/g, "") // 残りのHTMLタグを削除
    .replace(/&nbsp;/g, " ") // &nbsp;をスペースに置換
    .replace(/&amp;/g, "&") // &amp;を&に置換
    .replace(/&lt;/g, "<") // &lt;を<に置換
    .replace(/&gt;/g, ">") // &gt;を>に置換
    .replace(/&quot;/g, '"') // &quot;を"に置換
    .replace(/&#039;/g, "'") // &#039;を'に置換
    .replace(/\s+/g, " ") // 連続する空白を1つに
    .trim(); // 前後の空白を削除

  return plainText;
}

/**
 * HTMLコンテンツから最初の段落を抽出する
 * @param html HTMLを含むテキスト
 * @returns 最初の<p>タグの内容（HTMLタグなし）
 */
export function extractFirstParagraph(html: string): string {
  if (!html) return "";

  try {
    // スクリプトとスタイルタグを削除
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // 簡易的な方法で最初の<p>タグの位置を特定
    const pTagStart = cleanHtml.toLowerCase().indexOf("<p");

    if (pTagStart !== -1) {
      const contentStart = cleanHtml.indexOf(">", pTagStart) + 1;
      const contentEnd = cleanHtml.indexOf("</p>", contentStart);

      if (contentStart !== -1 && contentEnd !== -1) {
        const paragraphContent = cleanHtml.substring(contentStart, contentEnd);
        return stripHtmlTags(paragraphContent).trim();
      }
    }

    // <p>タグが見つからない場合は最初の100文字を返す
    return stripHtmlTags(cleanHtml).substring(0, 100) + "...";
  } catch (error) {
    console.error("段落の抽出に失敗:", error);
    return "";
  }
}

/**
 * テキストを指定した長さに要約する（強化版）
 * @param text 要約するテキスト
 * @param maxLength 最大文字数（デフォルト80、ツイート用）
 * @returns 要約されたテキスト
 */
export function summarizeText(text: string, maxLength: number = 80): string {
  if (!text) return "";

  // まずHTMLタグを除去
  const plainText = stripHtmlTags(text);

  if (plainText.length <= maxLength) return plainText;

  // 文章を句点で分割（日本語と英語両対応）
  const sentences = plainText
    .split(/。|！|？|\.|!|\?/)
    .filter((s) => s.trim().length > 0);

  let summary = "";
  let currentLength = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // 最初の文は必ず追加（ただし長すぎる場合は切り詰め）
    if (summary === "") {
      if (trimmedSentence.length > maxLength) {
        // 最初の文が長すぎる場合は切り詰める
        return trimmedSentence.slice(0, maxLength - 3) + "...";
      }
      summary = trimmedSentence;
      currentLength = summary.length;
      continue;
    }

    const sentenceWithPeriod = trimmedSentence + "。";
    if (currentLength + sentenceWithPeriod.length <= maxLength) {
      summary += sentenceWithPeriod;
      currentLength += sentenceWithPeriod.length;
    } else {
      // 直前までの文で終了
      break;
    }
  }

  // 句点で終わっていない場合は追加
  if (summary && !summary.match(/[。！？]$/)) {
    summary += "。";
  }

  return summary;
}

/**
 * ツイート用の要約を生成（80文字以内）
 * @param text 要約するテキスト
 * @returns ツイート用要約（80文字以内）
 */
export function summarizeForTweet(text: string): string {
  return summarizeText(text, 80);
}
