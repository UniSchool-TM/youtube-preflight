"use client";

import type { DiagnosisResult } from "@/types";
import { allPass } from "@/lib/diagnose";

/** Print-only simplified copy of the results (activated via window.print). */
export function PrintSheet({ result }: { result: DiagnosisResult }) {
  const title = result.input.title || "（タイトル未入力）";
  const date = new Date(result.createdAt).toLocaleString("ja-JP");
  return (
    <div className="print-area hidden print:block bg-white text-black">
      <div className="mb-6 border-b-2 border-black pb-4">
        <p className="text-xs text-gray-600">YouTube Preflight — 診断結果（ブラウザ内で生成）</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-gray-600">{date}</p>
      </div>
      <div className="mb-6">
        <p className="text-5xl font-bold">
          {result.totalScore}
          <span className="text-lg font-normal"> / 100</span>
        </p>
        <p className="mt-1 text-sm">
          投稿準備度: {allPass(result) ? "投稿前チェック完了" : "改善項目あり"}（Critical {result.summary.critical} / Warning {result.summary.warning} / Info {result.summary.info}）
        </p>
      </div>
      <h2 className="mb-2 text-lg font-bold">スコア内訳</h2>
      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-gray-400 px-2 py-1 text-left">項目</th>
            <th className="border border-gray-400 px-2 py-1 text-left">点数</th>
            <th className="border border-gray-400 px-2 py-1 text-left">評価</th>
          </tr>
        </thead>
        <tbody>
          {result.scores.map((s) => (
            <tr key={s.label}>
              <td className="border border-gray-400 px-2 py-1">{s.label}</td>
              <td className="border border-gray-400 px-2 py-1 font-bold">
                {s.earned} / {s.max}
              </td>
              <td className="border border-gray-400 px-2 py-1">
                {s.reasons[0]?.text ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mb-2 text-lg font-bold">投稿前チェック</h2>
      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-gray-400 px-2 py-1 text-left">状態</th>
            <th className="border border-gray-400 px-2 py-1 text-left">項目</th>
            <th className="border border-gray-400 px-2 py-1 text-left">詳細</th>
          </tr>
        </thead>
        <tbody>
          {result.checklist.map((c) => (
            <tr key={c.key}>
              <td className="border border-gray-400 px-2 py-1 font-bold">
                {c.status === "pass" ? "OK" : c.status === "critical" ? "NG" : c.status === "warning" ? "!" : "i"}
              </td>
              <td className="border border-gray-400 px-2 py-1">{c.label}</td>
              <td className="border border-gray-400 px-2 py-1">{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500">{result.privacyNote}</p>
      <p className="text-xs text-gray-500">
        スコアは投稿前チェック項目の達成度を独自基準でスコア化したものであり、CTR・再生数を予測するものではありません。
      </p>
    </div>
  );
}