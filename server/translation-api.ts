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
export async function translateLongContent(content: string, removeImages: boolean = false): Promise<string> {
  if (!content) return '';
  
  try {
    // コンテンツを処理（画像は保持）
    let processedContent = content;
    
    // セクションに分割する（画像は保持）
    const sections = [];
    
    // HTMLタグやセクションを認識して分割
    // 画像タグを特別に処理する
    const imageTagsMap = new Map();
    let imageTagCounter = 0;
    
    // 画像タグをプレースホルダーに置き換える（翻訳から保護するため）
    if (!removeImages) {
      const imgRegex = /<img[^>]*>/gi;
      processedContent = processedContent.replace(imgRegex, (match) => {
        const placeholder = `__IMG_PLACEHOLDER_${imageTagCounter++}__`;
        imageTagsMap.set(placeholder, match);
        return placeholder;
      });
    }
    
    // コンテンツを段落やセクションに分割
    // 複雑な正規表現ではなく、基本的な段落分割
    const paragraphs = processedContent.split(/\n\n|\r\n\r\n|<\/p>|<\/div>|<\/h[1-6]>/).filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      // 空の段落はスキップ
      if (!paragraph.trim()) continue;
      
      // HTMLタグを含むかどうかをチェック
      if (/<[a-z][^>]*>/i.test(paragraph)) {
        // HTMLタグを含む場合、テキスト部分を抽出して翻訳
        const plainText = stripHtmlTags(paragraph);
        
        if (plainText.trim().length > 5) {
          try {
            // テキスト部分だけを翻訳
            const translatedText = await translateToJapanese(plainText);
            
            // 翻訳されたテキストで元のテキストを置換
            // 単純な置換ではなく、テキストノードを特定して置換する
            let translatedParagraph = paragraph;
            
            // テキストノードを特定して翻訳済みのテキストに置き換える
            // この部分は実装が複雑なため、単純化した方法で対応
            translatedParagraph = translatedParagraph.replace(/>([^<]+)</g, (match, p1) => {
              if (p1.trim().length > 5) {
                // 対応する翻訳済みテキストを見つける
                const index = plainText.indexOf(p1);
                if (index >= 0) {
                  const endIndex = index + p1.length;
                  const translatedPart = translatedText.substring(index, endIndex);
                  return `>${translatedPart}<`;
                }
              }
              return match;
            });
            
            sections.push(translatedParagraph);
          } catch (e) {
            console.error('段落翻訳エラー:', e);
            sections.push(paragraph); // 翻訳に失敗した場合は元の段落を使用
          }
        } else {
          // テキストがほとんどない場合はそのまま追加
          sections.push(paragraph);
        }
      } else {
        // HTMLタグを含まない純粋なテキストの場合は直接翻訳
        if (paragraph.trim().length > 5) {
          try {
            const translated = await translateToJapanese(paragraph);
            sections.push(translated);
          } catch (e) {
            console.error('テキスト翻訳エラー:', e);
            sections.push(paragraph);
          }
        } else {
          sections.push(paragraph);
        }
      }
    }
    
    // 翻訳されたセクションを結合
    let translatedContent = sections.join('\n');
    
    // 画像タグのプレースホルダーを元に戻す
    if (!removeImages) {
      imageTagsMap.forEach((imgTag, placeholder) => {
        translatedContent = translatedContent.replace(placeholder, imgTag);
      });
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