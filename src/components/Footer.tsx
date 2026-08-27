import Link from "next/link";

export function Footer() {
  return (
    <footer className="no-print border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted">
          <p className="font-semibold text-foreground">YouTube Preflight</p>
          <p className="mt-1 max-w-md">
            このツールは入力された情報を外部AI・外部APIへ送信せず、ブラウザ内で処理します。スコアはCTR・再生数を予測するものではありません。
          </p>
        </div>
        <nav aria-label="フッターナビゲーション" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/diagnose" className="text-muted hover:text-foreground">診断</Link>
          <Link href="/compare" className="text-muted hover:text-foreground">比較</Link>
          <Link href="/history" className="text-muted hover:text-foreground">履歴</Link>
          <Link href="/settings" className="text-muted hover:text-foreground">設定</Link>
          <Link href="/about" className="text-muted hover:text-foreground">このツールについて</Link>
        </nav>
      </div>
    </footer>
  );
}