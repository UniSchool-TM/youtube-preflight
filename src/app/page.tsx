import Link from "next/link";
import type { SVGProps } from "react";
import { Button } from "@/components/ui";
import { HeroIllustration } from "@/components/HeroIllustration";

type FeatureIconKey = "type" | "photo" | "swap" | "list" | "gauge" | "lock" | "sparkle";

function FeatureIcon({ name }: { name: FeatureIconKey }) {
  const common: Omit<SVGProps<SVGSVGElement>, "children"> = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round" as const,
    className: "shrink-0",
    "aria-hidden": true,
  };
  switch (name) {
    case "type":
      return (
        <svg {...common}>
          <path d="M4 7V5h16v2M12 5v14M8 19h8" />
        </svg>
      );
    case "photo":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M21 15l-4.5-4.5L9 18M12 13l-3-3" />
        </svg>
      );
    case "swap":
      return (
        <svg {...common}>
          <path d="M5 12l3-3v5M19 12l-3 3v-5" />
          <path d="M8 9V6h8v3M16 15v3H8v-3" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...common}>
          <path d="M12 14l4-4" />
          <path d="M4 19a8 8 0 1 1 16 0" opacity="0.7" />
          <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6-4.7-1.9 4.7-1.9z" />
          <path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" opacity="0.7" />
        </svg>
      );
  }
}

const FEATURES: { icon: FeatureIconKey; tint: string; title: string; desc: string }[] = [
  {
    icon: "type",
    tint: "bg-accent/10 text-accent",
    title: "タイトル分析",
    desc: "文字数・文字種・構造・重要語の位置をルールベースで分析し、投稿前の曖昧さを減らします。",
  },
  {
    icon: "photo",
    tint: "bg-info/10 text-info",
    title: "サムネイル分析",
    desc: "画像をブラウザ内で解析し、解像度・明るさ・コントラスト・彩度・情報量の近似指標を表示します。",
  },
  {
    icon: "swap",
    tint: "bg-good/10 text-good",
    title: "タイトル × サムネ",
    desc: "タイトルの語と「サムネイル文字」の重複を検出し、役割分担の重なりを指摘します。",
  },
  {
    icon: "list",
    tint: "bg-warn/10 text-warn",
    title: "概要欄・チャプター",
    desc: "URL形式・ハッシュタグ・チャプターの時刻・動画尺との整合性を確認します。",
  },
  {
    icon: "gauge",
    tint: "bg-accent/10 text-accent",
    title: "スコア / 100点",
    desc: "7つの観点を独自基準で採点。なぜその点数なのか、理由付きで確認できます。",
  },
  {
    icon: "lock",
    tint: "bg-info/10 text-info",
    title: "ブラウザ内完結",
    desc: "外部AIや外部API・アカウント連携を一切使わず、画像やテキストをサーバーへ送信しません。",
  },
  {
    icon: "sparkle",
    tint: "bg-accent/10 text-accent",
    title: "AI改善提案（オプション）",
    desc: "診断後に端末内で動作する小規模AIが改善ポイントを提案。モデルは初回のみダウンロード。",
  },
];

function Feature({ icon, tint, title, desc }: (typeof FEATURES)[number]) {
  return (
    <div className="group rounded-[20px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5">
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tint} transition-transform group-hover:-rotate-6`}
      >
        <FeatureIcon name={icon} />
      </span>
      <h3 className="mt-3 font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            外部AI・外部APIを一切使用しない投稿前チェックツール
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            YouTube 投稿前チェック
            <span className="scribble mt-1 block text-accent">YouTube Preflight</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            タイトル・サムネイル・概要欄・チャプターなどを入力し、投稿前に確認すべき点を
            3 段階（要改善 / 注意 / 情報）でチェックします。
            <br className="hidden sm:block" />
            すべてブラウザ内で処理されるため、データが外部へ送信されることはありません。
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/diagnose" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                診断を始める <span aria-hidden="true">→</span>
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                このツールについて
              </Button>
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {["データ送信なし", "無料・アカウント不要", "インストール不要"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12.5l5.5 5.5L20 7" stroke="var(--good)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroIllustration />
      </section>

      <section aria-label="主な機能">
        <h2 className="heading-mark text-xl font-bold text-foreground">できること</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section aria-label="診断の流れ" className="rounded-[24px] border border-border bg-card p-6 sm:p-8">
        <h2 className="heading-mark text-xl font-bold text-foreground">診断の流れ</h2>
        <ol className="relative mt-6 grid gap-8 md:grid-cols-3 md:gap-4">
          <div
            aria-hidden="true"
            className="absolute left-6 top-6 hidden h-px w-[calc(100%-3rem)] border-t-2 border-dashed border-border md:block"
          />
          {[
            ["タイトル・概要欄などを入力", "動画タイトル、概要欄、動画尺、チャプターなどを入力します。"],
            ["サムネイルをアップロード", "画像はブラウザ内でのみ解析されます。サムネイル文字も任意で入力可。"],
            ["診断を開始", "チェックリストと100点満点のスコアが、理由付きで表示されます。"],
          ].map(([t, d], i) => (
            <li key={t} className="relative flex flex-col gap-2.5 md:px-2">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] ${
                  i % 2 === 1 ? "rotate-3" : "-rotate-2"
                }`}
              >
                {i + 1}
              </span>
              <p className="font-bold text-foreground">{t}</p>
              <p className="text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="注意事項" className="tape rounded-[20px] border border-warn/40 bg-warn/5 p-6">
        <h2 className="text-lg font-bold text-warn">注意事項</h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground/90">
          <li>本ツールのスコアは投稿前チェック項目の達成度を独自基準で算出したもので、CTR・再生数・視聴維持率・アルゴリズム評価を予測するものではありません。</li>
          <li>「情報量」などの数値は画像処理上の指標であり、視聴者の理解度や好みを表すものではありません。</li>
          <li>入力された内容を外部AI・外部API・サーバーへ送信することはありません。診断結果の保存先はご利用ブラウザ内のみです。</li>
        </ul>
      </section>
    </div>
  );
}