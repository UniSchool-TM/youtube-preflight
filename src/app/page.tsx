import Link from "next/link";
import { Button } from "@/components/ui";

const FEATURES = [
  {
    icon: "🔤",
    title: "タイトル分析",
    desc: "文字数・文字種・構造・重要語の位置をルールベースで分析し、投稿前の曖昧さを減らします。",
  },
  {
    icon: "🖼️",
    title: "サムネイル分析",
    desc: "画像をブラウザ内で解析し、解像度・明るさ・コントラスト・彩度・情報量の近似指標を表示します。",
  },
  {
    icon: "🔄",
    title: "タイトル × サムネ",
    desc: "タイトルの語と「サムネイル文字」の重複を検出し、役割分担の重なりを指摘します。",
  },
  {
    icon: "📝",
    title: "概要欄・チャプター",
    desc: "URL形式・ハッシュタグ・チャプターの時刻・動画尺との整合性を確認します。",
  },
  {
    icon: "💯",
    title: "スコア / 100点",
    desc: "7つの観点を独自基準で採点。なぜその点数なのか、理由付きで確認できます。",
  },
  {
    icon: "🔒",
    title: "ブラウザ内完結",
    desc: "外部AIや外部API・アカウント連携を一切使わず、画像やテキストをサーバーへ送信しません。",
  },
];

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <h3 className="mt-2 font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border bg-gradient-to-b from-card to-transparent px-6 py-12 text-center sm:py-16">
        <p className="mx-auto inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          外部AI・外部APIを一切使用しない投稿前チェックツール
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          YouTube 投稿前チェック
          <span className="block text-accent">YouTube Preflight</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          タイトル・サムネイル・概要欄・チャプターなどを入力し、投稿前に確認すべき点を
          3 段階（要改善 / 注意 / 情報）でチェックします。
          <br className="hidden sm:block" />
          すべてブラウザ内で処理されるため、データが外部へ送信されることはありません。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnose">
            <Button variant="primary" className="px-6 py-3 text-base">
              診断を始める
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="secondary" className="px-6 py-3 text-base">
              このツールについて
            </Button>
          </Link>
        </div>
      </section>

      <section aria-label="主な機能">
        <h2 className="text-xl font-bold text-foreground">できること</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section aria-label="診断の流れ" className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground">診断の流れ</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["タイトル・概要欄などを入力", "動画タイトル、概要欄、動画尺、チャプターなどを入力します。"],
            ["サムネイルをアップロード", "画像はブラウザ内でのみ解析されます。サムネイル文字も任意で入力可。"],
            ["診断を開始", "チェックリストと100点満点のスコアが、理由付きで表示されます。"],
          ].map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <p className="font-semibold text-foreground">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="注意事項" className="rounded-2xl border border-warn/40 bg-warn/5 p-6">
        <h2 className="text-lg font-bold text-warn">注意事項</h2>
        <ul className="mt-2 list-inside space-y-1 text-sm text-foreground/90">
          <li>本ツールのスコアは投稿前チェック項目の達成度を独自基準で算出したもので、CTR・再生数・視聴維持率・アルゴリズム評価を予測するものではありません。</li>
          <li>「情報量」などの数値は画像処理上の指標であり、視聴者の理解度や好みを表すものではありません。</li>
          <li>入力された内容を外部AI・外部API・サーバーへ送信することはありません。診断結果の保存先はご利用ブラウザ内のみです。</li>
        </ul>
      </section>
    </div>
  );
}