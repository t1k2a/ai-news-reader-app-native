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
 * 長い記事のコンテンツを翻訳する - より確実なアプローチ
 * @param content 翻訳する長いコンテンツ
 * @param removeImages 画像を削除するかどうか
 * @returns 翻訳されたコンテンツと元のコンテンツを含むオブジェクト
 */
export async function translateLongContent(content: string, removeImages: boolean = false): Promise<string> {
  if (!content) return '';

  try {
    // HTML構造を分析して処理する
    const parser = new RegExp(/<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/gi);
    const imgPattern = /<img[^>]*>/gi;
    
    // まず、全ての画像タグを保存
    const images: string[] = [];
    if (!removeImages) {
      let imgMatch;
      while ((imgMatch = imgPattern.exec(content)) !== null) {
        images.push(imgMatch[0]);
      }
    }

    // HTMLタグとテキストを分離して処理するヘルパー関数
    const translateHtmlText = async (htmlContent: string): Promise<string> => {
      // 単純なテキストの場合は直接翻訳
      if (!htmlContent.includes('<') && !htmlContent.includes('>')) {
        if (htmlContent.trim().length > 5) {
          try {
            return await translateToJapanese(htmlContent);
          } catch (e) {
            console.error('テキスト翻訳エラー:', e);
            return htmlContent;
          }
        }
        return htmlContent;
      }

      // HTMLタグとテキストを分離して処理
      const parts: string[] = [];
      let lastIndex = 0;
      const tagPattern = /<[^>]+>/g;
      let match;

      while ((match = tagPattern.exec(htmlContent)) !== null) {
        // タグの前にあるテキストを処理
        if (match.index > lastIndex) {
          const text = htmlContent.substring(lastIndex, match.index);
          if (text.trim().length > 5) {
            try {
              parts.push(await translateToJapanese(text));
            } catch (e) {
              parts.push(text);
            }
          } else {
            parts.push(text);
          }
        }
        
        // タグ自体を追加
        parts.push(match[0]);
        lastIndex = match.index + match[0].length;
      }

      // 最後の部分を処理
      if (lastIndex < htmlContent.length) {
        const text = htmlContent.substring(lastIndex);
        if (text.trim().length > 5) {
          try {
            parts.push(await translateToJapanese(text));
          } catch (e) {
            parts.push(text);
          }
        } else {
          parts.push(text);
        }
      }

      return parts.join('');
    };

    // 直接段落レベルで処理（最も確実な方法）
    const paragraphs = content.split('</p>').filter(p => p.includes('<p'));
    
    if (paragraphs.length > 0) {
      // 各段落を処理
      const translatedParagraphs = await Promise.all(
        paragraphs.map(async (p) => {
          try {
            // HTMLタグとテキストを分離
            const plainText = stripHtmlTags(p);
            
            if (plainText.trim().length < 10) {
              return p + '</p>'; // テキストが少ない場合はそのまま返す
            }
            
            // テキスト部分を翻訳
            const translatedText = await translateToJapanese(plainText);
            
            // 段落内のテキストを翻訳されたテキストに置き換え
            // 戦略：テキストノードだけを置換
            let processedP = p;
            const textNodePattern = />([^<]+)</g;
            processedP = processedP.replace(textNodePattern, (match, textContent) => {
              if (textContent.trim().length > 5) {
                // 対応する翻訳済みテキストの部分を見つける試み
                return `>${translatedText}<`;
              }
              return match;
            });
            
            return processedP + '</p>';
          } catch (e) {
            console.error('段落翻訳エラー:', e);
            return p + '</p>'; // エラーが発生した場合は元の段落を返す
          }
        })
      );
      
      // 翻訳された段落を結合
      let result = translatedParagraphs.join('');
      
      // 画像を元の位置に復元
      if (images.length > 0) {
        // 画像を適切な位置に挿入（段落の間）
        const imagePerParagraph = Math.max(1, Math.floor(images.length / (translatedParagraphs.length + 1)));
        let imgIndex = 0;
        
        result = result.replace(/<\/p>/g, (match, offset, string) => {
          if (imgIndex < images.length && (offset % imagePerParagraph === 0)) {
            const imgTags = images.slice(imgIndex, imgIndex + imagePerParagraph).join('\n');
            imgIndex += imagePerParagraph;
            return `</p>\n${imgTags}\n`;
          }
          return match;
        });
        
        // 残りの画像を最後に追加
        if (imgIndex < images.length) {
          const remainingImgs = images.slice(imgIndex).join('\n');
          result += '\n' + remainingImgs;
        }
      }
      
      return result;
    }
    
    // 段落分割が機能しない場合は単純なアプローチを試す
    return await translateHtmlText(content);
  } catch (error) {
    console.error('コンテンツ翻訳エラー:', error);
    
    // 最も単純な方法：テキストのみを抽出して翻訳
    try {
      const plainText = stripHtmlTags(content);
      const translatedText = await translateToJapanese(plainText);
      
      // HTML構造を維持しつつテキストのみを置き換え
      let result = content;
      const textNodes = content.match(/>([^<]+)</g);
      
      if (textNodes && textNodes.length > 0) {
        for (const textNode of textNodes) {
          const text = textNode.substring(1, textNode.length - 1);
          if (text.trim().length > 5) {
            result = result.replace(textNode, `>${translatedText}<`);
            break; // 一度だけ置換（全文を一括翻訳したため）
          }
        }
      }
      
      return result;
    } catch (fallbackError) {
      return content; // 全てのアプローチが失敗した場合
    }
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