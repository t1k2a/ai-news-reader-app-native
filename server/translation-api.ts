// シンプルな翻訳用モジュール
import axios from 'axios';

/**
 * テキストを英語から日本語に翻訳する
 * Googleの非公式APIを使用（低負荷用途のみ）
 * @param text 翻訳するテキスト
 * @returns 翻訳されたテキスト、またはエラーの場合は元のテキスト
 */
export async function translateToJapanese(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    // 非公式APIを使用（低負荷用）
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=${encodeURIComponent(text)}`;
    
    const { data } = await axios.get(url);
    
    // レスポンスから翻訳テキストを抽出
    let translatedText = '';
    if (data && data[0]) {
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) {
          translatedText += data[0][i][0];
        }
      }
    }
    
    return translatedText || text;
  } catch (error) {
    console.error('翻訳エラー:', error);
    return text; // エラーの場合は元のテキストを返す
  }
}

/**
 * HTMLからimg要素を削除する関数
 * @param html HTML文字列
 * @returns img要素を削除したHTML文字列
 */
export function removeImageTags(html: string): string {
  if (!html) return '';
  return html.replace(/<img\b[^>]*>/gi, '');
}

/**
 * HTMLからテキスト部分のみを抽出する関数
 * @param html HTML文字列
 * @returns テキスト部分のみを含む文字列
 */
export function extractTextFromHtml(html: string): string {
  return stripHtmlTags(html);
}

/**
 * 長い記事のコンテンツを翻訳する
 * 段落ごとに分割して翻訳し、より効率的に処理する
 * @param content 翻訳する長いコンテンツ
 * @param removeImages 画像を削除するかどうか
 * @returns 翻訳されたコンテンツ
 */
export async function translateLongContent(content: string, removeImages: boolean = true): Promise<string> {
  if (!content) return '';
  
  try {
    // 画像タグを削除（必要な場合）
    let processedContent = content;
    if (removeImages) {
      processedContent = removeImageTags(processedContent);
    }
    
    // シンプルな方法: HTML文字列を段落で分割して翻訳
    const paragraphs = processedContent
      .split(/(<\/p>|<\/h[1-6]>|<\/div>|<\/li>|<br\s*\/?>|\n\n)/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // 分割された各部分を処理
    const translatedParts = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      const part = paragraphs[i];
      
      // HTMLタグか通常のテキストかを判断
      if (part.startsWith('<') && part.endsWith('>')) {
        // 閉じタグや単一タグはそのまま追加
        translatedParts.push(part);
      } else {
        // タグを含む可能性があるコンテンツ部分
        
        if (part.includes('<img')) {
          // 画像タグが含まれている場合は画像を削除または保持
          translatedParts.push(removeImages ? removeImageTags(part) : part);
        } else if (part.match(/<[a-z][\s\S]*>/i)) {
          // その他のHTMLタグを含む場合
          try {
            // テキスト部分のみを抽出して翻訳
            const textOnly = extractTextFromHtml(part);
            if (textOnly.trim().length > 0) {
              const translated = await translateToJapanese(textOnly);
              // 元のHTMLの構造を維持するため、テキスト部分のみを置換
              translatedParts.push(part.replace(textOnly, translated));
            } else {
              translatedParts.push(part);
            }
          } catch (e) {
            console.error('部分翻訳エラー:', e);
            translatedParts.push(part);
          }
        } else if (part.trim().length > 0) {
          // 純粋なテキストの場合は直接翻訳
          try {
            const translated = await translateToJapanese(part);
            translatedParts.push(translated);
          } catch (e) {
            console.error('テキスト翻訳エラー:', e);
            translatedParts.push(part);
          }
        } else {
          // 空の場合はそのまま追加
          translatedParts.push(part);
        }
      }
    }
    
    // 翻訳された部分を結合
    return translatedParts.join(' ');
  } catch (error) {
    console.error('コンテンツ翻訳エラー:', error);
    return content; // エラーの場合は元のコンテンツを返す
  }
}

/**
 * 複数のテキストを一括で翻訳する
 * 注意: APIの制限に引っかからないよう、一度に大量のテキストを送らないこと
 * @param texts 翻訳するテキストの配列
 * @returns 翻訳されたテキストの配列
 */
export async function batchTranslateToJapanese(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) return [];
  
  const validTexts = texts.filter(text => text && text.trim() !== '');
  if (validTexts.length === 0) return [];
  
  try {
    // 5つずつに分割して処理（API制限を避けるため）
    const chunks = [];
    for (let i = 0; i < validTexts.length; i += 5) {
      chunks.push(validTexts.slice(i, i + 5));
    }
    
    const results: string[] = [];
    
    for (const chunk of chunks) {
      const promises = chunk.map(text => translateToJapanese(text));
      const translatedChunk = await Promise.all(promises);
      results.push(...translatedChunk);
      
      // APIリクエスト制限を回避するための短い待機
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  } catch (error) {
    console.error('一括翻訳エラー:', error);
    return validTexts; // エラーの場合は元のテキストを返す
  }
}

/**
 * HTMLタグを除去するヘルパー関数
 * @param html HTMLを含む可能性のあるテキスト
 * @returns HTMLタグを除去したプレーンテキスト
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // HTMLタグを除去
  const plainText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // スクリプトタグを削除
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // スタイルタグを削除
    .replace(/<[^>]*>/g, '')                                           // 残りのHTMLタグを削除
    .replace(/&nbsp;/g, ' ')                                           // &nbsp;をスペースに置換
    .replace(/&amp;/g, '&')                                            // &amp;を&に置換
    .replace(/&lt;/g, '<')                                             // &lt;を<に置換
    .replace(/&gt;/g, '>')                                             // &gt;を>に置換
    .replace(/&quot;/g, '"')                                           // &quot;を"に置換
    .replace(/&#039;/g, "'")                                           // &#039;を'に置換
    .replace(/\s+/g, ' ')                                              // 連続する空白を1つに
    .trim();                                                           // 前後の空白を削除
  
  return plainText;
}

/**
 * テキストを指定した長さ（約140文字）に要約する
 * @param text 要約するテキスト
 * @param maxLength 最大文字数（デフォルト140）
 * @returns 要約されたテキスト
 */
export function summarizeText(text: string, maxLength: number = 140): string {
  if (!text) return '';
  
  // まずHTMLタグを除去
  const plainText = stripHtmlTags(text);
  
  if (plainText.length <= maxLength) return plainText;
  
  // 文章を句点で分割
  const sentences = plainText.split(/。|！|？|\.|!|\?/).filter(s => s.trim().length > 0);
  
  let summary = '';
  let currentLength = 0;
  
  for (const sentence of sentences) {
    const sentenceWithPeriod = sentence + '。';
    if (currentLength + sentenceWithPeriod.length <= maxLength) {
      summary += sentenceWithPeriod;
      currentLength += sentenceWithPeriod.length;
    } else {
      // 残りのスペースに収まる部分だけを追加
      const remainingSpace = maxLength - currentLength;
      if (remainingSpace > 10) { // 最低10文字は入るようにする
        summary += sentenceWithPeriod.substring(0, remainingSpace - 1) + '…';
      }
      break;
    }
  }
  
  return summary;
}