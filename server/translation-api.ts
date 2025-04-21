import translate from '@vitalets/google-translate-api';

/**
 * テキストを英語から日本語に翻訳する
 * @param text 翻訳するテキスト
 * @returns 翻訳されたテキスト、またはエラーの場合は元のテキスト
 */
export async function translateToJapanese(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    const { text: translatedText } = await translate(text, { to: 'ja' });
    return translatedText;
  } catch (error) {
    console.error('翻訳エラー:', error);
    return text; // エラーの場合は元のテキストを返す
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
 * テキストを指定した長さ（約140文字）に要約する
 * @param text 要約するテキスト
 * @param maxLength 最大文字数（デフォルト140）
 * @returns 要約されたテキスト
 */
export function summarizeText(text: string, maxLength: number = 140): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // 文章を句点で分割
  const sentences = text.split(/。|！|？|\.|!|\?/).filter(s => s.trim().length > 0);
  
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