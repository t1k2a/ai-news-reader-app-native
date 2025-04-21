import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 翻訳APIのエンドポイント
const TRANSLATION_API_URL = 'https://api-free.deepl.com/v2/translate';
const API_KEY = process.env.DEEPL_API_KEY || '';

/**
 * テキストを英語から日本語に翻訳する
 * @param text 翻訳するテキスト
 * @returns 翻訳されたテキスト、またはエラーの場合は元のテキスト
 */
export async function translateToJapanese(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    const response = await axios.post(
      TRANSLATION_API_URL,
      new URLSearchParams({
        auth_key: API_KEY,
        text: text,
        source_lang: 'EN',
        target_lang: 'JA',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.translations && response.data.translations.length > 0) {
      return response.data.translations[0].text;
    }
    
    return text; // 翻訳が取得できない場合は元のテキストを返す
  } catch (error) {
    console.error('翻訳エラー:', error);
    return text; // エラーの場合は元のテキストを返す
  }
}

/**
 * 複数のテキストを一括で翻訳する
 * @param texts 翻訳するテキストの配列
 * @returns 翻訳されたテキストの配列
 */
export async function batchTranslateToJapanese(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) return [];
  
  const validTexts = texts.filter(text => text && text.trim() !== '');
  if (validTexts.length === 0) return [];
  
  try {
    const response = await axios.post(
      TRANSLATION_API_URL,
      new URLSearchParams({
        auth_key: API_KEY,
        text: validTexts.join('\n[SEP]\n'),
        source_lang: 'EN',
        target_lang: 'JA',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.translations && response.data.translations.length > 0) {
      // 分割して返す
      const translatedText = response.data.translations[0].text;
      return translatedText.split('\n[SEP]\n');
    }
    
    return validTexts; // 翻訳が取得できない場合は元のテキストを返す
  } catch (error) {
    console.error('一括翻訳エラー:', error);
    return validTexts; // エラーの場合は元のテキストを返す
  }
}