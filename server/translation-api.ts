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
 * 長い記事のコンテンツを翻訳する - より単純で確実な実装
 * @param content 翻訳する長いコンテンツ
 * @param removeImages 画像を削除するかどうか
 * @returns 翻訳されたコンテンツ
 */
export async function translateLongContent(content: string, removeImages: boolean = false): Promise<string> {
  if (!content) return '';
  
  try {
    // 既存の<hr>タグを削除（記事を分断する原因になっているため）
    let processedContent = content.replace(/<hr\s*\/?>|<hr\s+[^>]*>/gi, '');
    
    // HTMLタグをプレースホルダーに置き換える（画像を含む）
    const tagPlaceholders = new Map();
    let tagCounter = 0;
    
    // 画像タグとその他のHTMLタグをプレースホルダーに置き換える
    const htmlTagRegex = /<[^>]+>/g;
    processedContent = processedContent.replace(htmlTagRegex, (match) => {
      // 画像を削除するモードで、かつimgタグの場合はスキップ
      if (removeImages && match.match(/<img[^>]*>/i)) {
        return '';
      }
      
      const placeholder = `__HTML_TAG_${tagCounter++}__`;
      tagPlaceholders.set(placeholder, match);
      return placeholder;
    });

    // コンテンツを適切なサイズのチャンクに分割（翻訳APIの制限を考慮）
    const chunks = [];
    const chunkSize = 1000; // 1000文字ずつ処理
    
    for (let i = 0; i < processedContent.length; i += chunkSize) {
      chunks.push(processedContent.substring(i, i + chunkSize));
    }
    
    // 各チャンクを翻訳
    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await translateToJapanese(chunk);
        } catch (e) {
          console.error('チャンク翻訳エラー:', e);
          return chunk; // エラーの場合は元のテキストを返す
        }
      })
    );
    
    // 翻訳されたチャンクを結合
    let translatedContent = translatedChunks.join('');
    
    // HTMLタグのプレースホルダーを元に戻す
    tagPlaceholders.forEach((tag, placeholder) => {
      translatedContent = translatedContent.replace(placeholder, tag);
    });
    
    // HTML構造が壊れていないかチェック
    if (!translatedContent.includes('</p>') && content.includes('</p>')) {
      console.log('警告: 翻訳後にHTML構造が失われている可能性があります');
      
      // 代替手法: 段落ごとに処理
      try {
        console.log('代替翻訳手法を試行（段落ごとに処理）...');
        
        // 段落のみを抽出して翻訳
        const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gi);
        if (paragraphs && paragraphs.length > 0) {
          const translatedParagraphs = await Promise.all(
            paragraphs.map(async (p) => {
              // 段落からテキスト部分のみを抽出
              const textMatch = p.match(/>([^<]+)</);
              if (textMatch && textMatch[1] && textMatch[1].trim().length > 0) {
                const textContent = textMatch[1];
                const translatedText = await translateToJapanese(textContent);
                return p.replace(textContent, translatedText);
              }
              return p;
            })
          );
          
          // 元のコンテンツで翻訳された段落を置き換え
          let result = content;
          for (let i = 0; i < paragraphs.length; i++) {
            result = result.replace(paragraphs[i], translatedParagraphs[i]);
          }
          
          return result;
        }
      } catch (fallbackError) {
        console.error('代替翻訳手法エラー:', fallbackError);
      }
    }
    
    return translatedContent;
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