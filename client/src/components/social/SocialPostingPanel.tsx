import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LoadingSpinner } from '../LoadingSpinner';
import { Badge } from '../ui/badge';
import { SocialSettings } from './SocialSettings';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

type PostingResult = {
  success: boolean;
  result?: {
    totalProcessed: number;
    newItemsPosted: number;
    errors: number;
    details: string[];
  };
  message?: string;
};

export function SocialPostingPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PostingResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(() => {
    return localStorage.getItem('AUTO_POSTING_ENABLED') === 'true';
  });

  // 手動でニュースを投稿する関数
  const handlePostNews = async () => {
    // X API認証情報をローカルストレージから取得
    const apiKey = localStorage.getItem('TWITTER_API_KEY');
    const apiSecret = localStorage.getItem('TWITTER_API_SECRET');
    const accessToken = localStorage.getItem('TWITTER_ACCESS_TOKEN');
    const accessSecret = localStorage.getItem('TWITTER_ACCESS_SECRET');

    // 認証情報が不足している場合は設定画面を表示
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      setShowSettings(true);
      setResult({
        success: false,
        message: 'X（Twitter）APIの認証情報が設定されていません。設定を行ってください。'
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // サーバーに投稿リクエストを送信
      const response = await fetch('/api/social/post-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // 環境変数はサーバーサイドで管理するため、認証情報は送信しない
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ニュースの投稿に失敗しました');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 自動投稿設定の切り替え
  const handleToggleAutoPosting = (enabled: boolean) => {
    setAutoPostingEnabled(enabled);
    localStorage.setItem('AUTO_POSTING_ENABLED', enabled.toString());
    
    // ここで実際のサーバーサイドの自動投稿設定を変更するAPIを呼び出す
    // このサンプルでは、ローカルストレージのみで管理
  };

  if (showSettings) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(false)}
          className="mb-4"
        >
          ← 戻る
        </Button>
        
        <SocialSettings />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SNSへの自動投稿</CardTitle>
          <CardDescription>
            新しいAI関連ニュースを自動的にX（旧Twitter）に投稿します
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-posting" 
              checked={autoPostingEnabled}
              onCheckedChange={handleToggleAutoPosting}
            />
            <Label htmlFor="auto-posting">自動投稿を有効にする（5分ごとに最新ニュースを確認）</Label>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">自動投稿のステータス</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${autoPostingEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{autoPostingEnabled ? '有効' : '無効'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              自動投稿が有効な場合、5分ごとに最新のニュースを確認し、未投稿の記事を自動的にXに投稿します。
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowSettings(true)}
          >
            API設定を変更
          </Button>
          <Button 
            onClick={handlePostNews}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : '今すぐ最新ニュースを投稿'}
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>投稿結果</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertTitle>{result.success ? '成功' : 'エラー'}</AlertTitle>
              <AlertDescription>
                {result.message || (result.success 
                  ? `${result.result?.newItemsPosted || 0}件の新しいニュースを投稿しました。` 
                  : '投稿に失敗しました。')}
              </AlertDescription>
            </Alert>
            
            {result.success && result.result && (
              <>
                <div className="flex space-x-2 mt-4">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                    処理件数: {result.result.totalProcessed}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                    投稿成功: {result.result.newItemsPosted}
                  </Badge>
                  {result.result.errors > 0 && (
                    <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">
                      エラー: {result.result.errors}
                    </Badge>
                  )}
                </div>
                
                {result.result.details.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">詳細</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded max-h-48 overflow-y-auto text-sm">
                      {result.result.details.map((detail, index) => (
                        <div 
                          key={index} 
                          className={`py-1 px-2 ${detail.includes('エラー') 
                            ? 'text-red-600 dark:text-red-400' 
                            : detail.includes('スキップ')
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}