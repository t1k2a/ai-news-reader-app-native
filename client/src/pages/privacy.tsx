export default function PrivacyPage() {
  return (
    <main className="container mx-auto p-4 max-w-4xl text-slate-900 dark:text-slate-100">
      <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">← トップへ戻る</a>
      <h1 className="text-2xl font-bold mt-4 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">最終更新日: 2025-09-08</p>

      <section className="mt-4 space-y-2">
        <p>
          本ポリシーは、GlotNexus（以下「本サービス」）におけるユーザーの情報の取り扱いについて定めるものです。
        </p>
        <h2 className="text-lg font-semibold mt-4">1. 取得する情報</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本サービスは原則として、ユーザーの個人を特定できる情報を取得しません。</li>
          <li>ブラウザ内において、利便性向上のためニュース一覧等をローカルストレージ（localStorage）に最大5分間キャッシュします。</li>
          <li>PWA 機能のため、静的アセットを Service Worker がキャッシュする場合があります。</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">2. サーバーログ</h2>
        <p>本サービスの安定運用・不正防止のため、サーバーはアクセスログ（IPアドレス、User-Agent、アクセス時刻、リクエストパス等）を記録する場合があります。</p>
        <h2 className="text-lg font-semibold mt-4">3. 第三者サービスへの送信</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ニュースの翻訳・要約のため、記事テキストの一部を Google の翻訳エンドポイント（非公式）へ送信する場合があります。</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">4. Cookie・セッション</h2>
        <p>現時点で本サービスは独自のセッション Cookie を使用していません。導入する場合は本ポリシーを更新します。</p>
        <h2 className="text-lg font-semibold mt-4">5. 利用目的</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ニュースの表示・翻訳・要約の提供</li>
          <li>パフォーマンスおよびユーザー体験の向上</li>
          <li>不正防止・障害対応のための監視</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">6. 保持期間</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ローカルストレージのキャッシュは概ね5分の有効期限を目安とします（実装に依存）。</li>
          <li>サーバーログは運用上必要な期間のみ保持し、その後は削除または匿名化します。</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">7. ユーザーの選択</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ブラウザの設定からローカルストレージおよびキャッシュを削除できます。</li>
          <li>PWA のインストール/アンインストールは端末の設定から行えます。</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">8. 改訂</h2>
        <p>本ポリシーは必要に応じて改訂されることがあります。重要な変更がある場合は、アプリ内で告知します。</p>
        <h2 className="text-lg font-semibold mt-4">9. お問い合わせ</h2>
        <p>
          本ポリシーに関するお問い合わせは、運営者までご連絡ください。<br />
          連絡先: &lt;your-email@example.com&gt;
        </p>
      </section>
    </main>
  );
}
