import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import outputs from "../../../amplify_outputs.json";

type RuntimeConfig = {
  API_BASE_URL?: string;
};

type AmplifyOutputs = {
  custom?: {
    myFunctionUrl?: string;
  };
};

const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === "undefined") {
    return {};
  }

  const config = (window as Window & { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__;
  return config ?? {};
};

const normalizeBaseUrl = (value?: string): string => {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
};

const runtimeBaseUrl = normalizeBaseUrl(getRuntimeConfig().API_BASE_URL);
const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const amplifyFunctionUrl = normalizeBaseUrl((outputs as AmplifyOutputs).custom?.myFunctionUrl);

export const API_BASE_URL = runtimeBaseUrl || envBaseUrl || amplifyFunctionUrl || "";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = (key: string): any =>
  JSON.parse(window.localStorage.getItem(key) || "null");
const setLocalStorage = (key: string, value: any): void =>
  window.localStorage.setItem(key, JSON.stringify(value));

/**
 * シンプルなローカルストレージキャッシュ取得
 * @param key ストレージキー
 * @param maxAge 有効期限（ms）
 */
export function getCachedData<T>(key: string, maxAge: number): T | null {
  const cached = getLocalStorage(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) {
    window.localStorage.removeItem(key);
    return null;
  }
  return cached.data as T;
}

/**
 * ローカルストレージにキャッシュを保存
 * @param key ストレージキー
 * @param data 保存するデータ
 */
export function setCachedData(key: string, data: unknown): void {
  setLocalStorage(key, { timestamp: Date.now(), data });
}

/**
 * HTMLタグを除去するヘルパー関数
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

export { getLocalStorage, setLocalStorage };
