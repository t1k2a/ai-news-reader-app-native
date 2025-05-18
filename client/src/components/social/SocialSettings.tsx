import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LoadingSpinner } from '../LoadingSpinner';

export function SocialSettings() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessSecret, setAccessSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // 認証情報の保存処理
  const handleSaveCredentials = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      // フォームバリデーション
      if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        setStatusMessage({
          type: 'error',
          text: 'すべての認証情報を入力してください。'
        });
        setIsLoading(false);
        return;
      }

      // 環境変数の保存を代替するため、ブラウザのストレージに一時的に保存
      // 注: 実際のプロダクションではサーバーサイドで安全な方法で保存する必要があります
      localStorage.setItem('TWITTER_API_KEY', apiKey);
      localStorage.setItem('TWITTER_API_SECRET', apiSecret);
      localStorage.setItem('TWITTER_ACCESS_TOKEN', accessToken);
      localStorage.setItem('TWITTER_ACCESS_SECRET', accessSecret);

      setStatusMessage({
        type: 'success',
        text: 'API認証情報を保存しました。これらの情報は自動投稿機能で使用されます。'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 保存済みの値を読み込む
  useEffect(() => {
    const savedApiKey = localStorage.getItem('TWITTER_API_KEY');
    const savedApiSecret = localStorage.getItem('TWITTER_API_SECRET');
    const savedAccessToken = localStorage.getItem('TWITTER_ACCESS_TOKEN');
    const savedAccessSecret = localStorage.getItem('TWITTER_ACCESS_SECRET');

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedApiSecret) setApiSecret(savedApiSecret);
    if (savedAccessToken) setAccessToken(savedAccessToken);
    if (savedAccessSecret) setAccessSecret(savedAccessSecret);
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>SNS連携設定</CardTitle>
        <CardDescription>
          X（旧Twitter）のAPI認証情報を設定して、新着ニュースの自動投稿を有効にします。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {statusMessage && (
          <Alert variant={statusMessage.type === 'error' ? 'destructive' : 
                        statusMessage.type === 'success' ? 'default' : 'default'}>
            <AlertTitle>
              {statusMessage.type === 'success' ? '成功' : 
              statusMessage.type === 'error' ? 'エラー' : 'お知らせ'}
            </AlertTitle>
            <AlertDescription>{statusMessage.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your X API Key"
            className="font-mono"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="apiSecret">API Secret</Label>
          <Input
            id="apiSecret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            type="password"
            placeholder="Enter your X API Secret"
            className="font-mono"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accessToken">Access Token</Label>
          <Input
            id="accessToken"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Enter your X Access Token"
            className="font-mono"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accessSecret">Access Token Secret</Label>
          <Input
            id="accessSecret"
            value={accessSecret}
            onChange={(e) => setAccessSecret(e.target.value)}
            type="password"
            placeholder="Enter your X Access Token Secret"
            className="font-mono"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setApiKey('');
            setApiSecret('');
            setAccessToken('');
            setAccessSecret('');
            localStorage.removeItem('TWITTER_API_KEY');
            localStorage.removeItem('TWITTER_API_SECRET');
            localStorage.removeItem('TWITTER_ACCESS_TOKEN');
            localStorage.removeItem('TWITTER_ACCESS_SECRET');
            setStatusMessage({
              type: 'info',
              text: '認証情報をクリアしました。'
            });
          }}
        >
          クリア
        </Button>
        <Button 
          onClick={handleSaveCredentials}
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : '保存'}
        </Button>
      </CardFooter>
    </Card>
  );
}