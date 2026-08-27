import Link from "next/link";
import { Card, SectionHeading } from "@/components/ui";

const FAQ: { q: string; a: string }[] = [
  {
    q: "なぜ「CTR」や「再生数」を予測しないのですか？",
    a: "投稿前チェック項目（サムネイル解像度やタイトルの構造など）の達成度を独自基準でスコア化することを目的としています。CTR・再生数・アルゴリズム評価は多くの要因が絡み、ルールベースでは予測できないため、その旨を明記するようにしています。",
  },
  {
    q: "データはどこに送信されますか？",
    a: "送信されません。画像解析はブラウザ内（Web Worker）で、保存はこの端末の localStorage / IndexedDB のみです。静的ホスティングからの配信以外の通信は発生しません。",
  },
  {
    q: "OCRや外部AIは使っていますか？",
    a: "使いません。サムネイル上の文字の読み取りは行わず、「サムネイル文字」欄に入力された文字とタイトルを比較する方式です。",
  },
  {
    q: "スコアの再現性は？",
    a: "同じ入力なら必ず同じスコアになります。ランダム要素やAIによる曖昧な評価はありません。",
  },
  {
    q: "サムネイル解析の「情報量」とは？",
    a: "画像処理上のエッジ密度（明るさの変化量）を表す近似指標です。視聴者の理解度や好みを表すものではありません。",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">このツールについて</h1>
        <p className="mt-1 text-sm text-muted">
          YouTube Preflight は、動画の投稿前チェックを支援するブラウザ内完結型のWebアプリです。
        </p>
      </div>

      <Card ariaLabel="方針">
        <SectionHeading icon="🎯" title="方針" />
        <ul className="list-inside space-y-2 text-sm leading-relaxed text-foreground/90">
          <li>・外部AI・外部API・アカウント連携を一切使用せず、データはブラウザ内で処理します。</li>
          <li>・判定はルールベースで、理由を明示します。結果の責任は利用者が負います。</li>
          <li>・「予測」ではなく「チェック」を提供します。CTR・再生数の予測はしません。</li>
        </ul>
      </Card>

      <Card ariaLabel="チェックできる項目">
        <SectionHeading icon="✅" title="チェックできる項目" />
        <ul className="list-inside space-y-1.5 text-sm text-foreground/90">
          <li>・タイトル: 文字数 / 文字種 / 構造 / 重要語の位置 / 表示シミュレーション</li>
          <li>・サムネイル: 解像度 / 比率 / 明るさ / コントラスト / 彩度 / 情報量（エッジ）/ 主要色 / 輝度分布</li>
          <li>・タイトル × サムネイル文字: 重複・数字一致・役割分担</li>
          <li>・概要欄: 文字数 / URL形式（HTTPS）/ 重複URL / 改行 / 冒頭文</li>
          <li>・チャプター: 形式 / 順序 / 重複 / 動画尺との整合 / タイトル有無</li>
          <li>・ハッシュタグ: 個数 / 重複 / 文字種</li>
          <li>・比較: サムネイル / タイトルA/B / 診断結果（最大5件）</li>
        </ul>
      </Card>

      <Card ariaLabel="技術スタック">
        <SectionHeading icon="🧰" title="技術スタック" />
        <p className="text-sm leading-relaxed text-muted">
          Next.js（App Router）/ TypeScript / Tailwind CSS。画像解析は Web Worker 上の Canvas API、
          保存は localStorage / IndexedDB、PDF出力はブラウザの印刷機能を使用しています。
          生成AIによるテキスト解析・画像認識は一切使用していません。
        </p>
      </Card>

      <Card ariaLabel="よくある質問">
        <SectionHeading icon="❓" title="よくある質問" />
        <dl className="space-y-4">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <dt className="font-semibold text-foreground">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="text-center text-xs text-muted">
        YouTube Preflight はYouTubeの公式ツールではありません。
        <Link href="/diagnose" className="ml-1 text-accent underline">診断を開始する</Link>
      </p>
    </div>
  );
}