import type { DiagnosisResult, ScoreCategory } from "@/types";
import { allPass } from "@/lib/diagnose";

const PALETTE = {
  bg: "#0f1115",
  card: "#171a21",
  line: "#2b303b",
  text: "#e8ebf0",
  sub: "#9aa3b2",
  accent: "#ff4356",
  good: "#22c55e",
  warn: "#eab308",
  crit: "#ef4444",
  info: "#60a5fa",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function severityColor(sev: ScoreCategory["severity"]): string {
  switch (sev) {
    case "critical": return PALETTE.crit;
    case "warning": return PALETTE.warn;
    case "info": return PALETTE.info;
    default: return PALETTE.good;
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur + w;
    if (ctx.measureText(test).width > maxWidth && cur !== "") {
      lines.push(cur);
      cur = w.trimStart();
    } else {
      cur = test;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export function resultCardCanvas(result: DiagnosisResult): HTMLCanvasElement {
  const W = 1000;
  const title = result.input.title || "（タイトル未入力）";
  const date = new Date(result.createdAt).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });

  // Estimate height
  const headerH = 200;
  const checklistH = 90 + result.checklist.length * 34;
  const scoresH = 90 + result.scores.length * 52;
  const H = headerH + 260 + scoresH + checklistH + 80;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  let y = 0;

  // Header
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(0, 0, W, 8);
  y = 40;
  ctx.fillStyle = PALETTE.text;
  ctx.font = "bold 40px system-ui, sans-serif";
  ctx.fillText("YouTube Preflight 診断結果", 48, y);
  y += 30;
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillStyle = PALETTE.sub;
  const titleLines = wrapText(ctx, title, W - 96);
  for (const l of titleLines) {
    ctx.fillText(l, 48, y);
    y += 28;
  }
  y += 6;
  ctx.font = "15px system-ui, sans-serif";

  // Score gauge
  const gaugeR = 72;
  const gx = W - 140;
  const gy = 150;
  ctx.beginPath();
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 14;
  ctx.arc(gx, gy, gaugeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "round";
  const pct = Math.max(0, Math.min(1, result.totalScore / 100));
  ctx.strokeStyle = pct >= 0.85 ? PALETTE.good : pct >= 0.5 ? PALETTE.warn : PALETTE.crit;
  ctx.beginPath();
  ctx.arc(gx, gy, gaugeR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(result.totalScore), gx, gy + 4);
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = PALETTE.sub;
  ctx.fillText("/ 100", gx, gy + 26);
  ctx.font = "500 18px system-ui, sans-serif";
  ctx.fillText("投稿準備度", gx, gy - 96);
  ctx.textAlign = "left";

  // Summary chips
  y = 184;
  ctx.font = "15px system-ui, sans-serif";
  const chips: [string, string][] = [
    [`修正必須 ${result.summary.critical}`, PALETTE.crit],
    [`要改善 ${result.summary.warning}`, PALETTE.warn],
    [`参考 ${result.summary.info}`, PALETTE.info],
    [`OK ${result.summary.pass}`, PALETTE.good],
  ];
  let cx = 48;
  for (const [label, color] of chips) {
    ctx.fillStyle = color;
    ctx.fillText(label, cx, y);
    cx += ctx.measureText(label).width + 36;
  }
  y += 40;
  ctx.fillStyle = PALETTE.sub;
  const status = allPass(result) ? "投稿前チェック完了" : "要修正項目があります";
  ctx.fillText(status + ` ｜ ${date}`, 48, y);
  y = 250;

  // Scores
  ctx.fillStyle = PALETTE.text;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("スコア内訳", 48, y + 18);
  y += 44;

  for (const s of result.scores) {
    ctx.fillStyle = PALETTE.card;
    roundRect(ctx, 48, y, W - 96, 52, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = "600 17px system-ui, sans-serif";
    ctx.fillText(s.label, 68, y + 26);
    ctx.fillStyle = severityColor(s.severity);
    ctx.font = "600 17px system-ui, sans-serif";
    const earnedTxt = `${s.earned} / ${s.max}`;
    ctx.textAlign = "right";
    ctx.fillText(earnedTxt, W - 68, y + 26);
    ctx.textAlign = "left";
    const bw = 160;
    ctx.fillStyle = PALETTE.line;
    roundRect(ctx, 210, y + 30, bw, 6, 3);
    ctx.fill();
    ctx.fillStyle = severityColor(s.severity);
    roundRect(ctx, 210, y + 30, Math.max(6, (s.earned / Math.max(1, s.max)) * bw), 6, 3);
    ctx.fill();
    // reasons (max 2 lines)
    ctx.fillStyle = PALETTE.sub;
    ctx.font = "13px system-ui, sans-serif";
    let ry = y + 24;
    const shown = s.reasons.slice(0, 2);
    for (const r of shown) {
      ctx.fillText(r.type === "good" ? `・ ${r.text}` : `・ ${r.text}`, 390, ry + 46);
      ry += 14;
    }
    y += 52;
  }

  y += 16;
  // Checklist
  ctx.fillStyle = PALETTE.text;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("投稿前チェック", 48, y);
  y += 34;
  for (const c of result.checklist) {
    const color =
      c.status === "pass"
        ? PALETTE.good
        : c.status === "critical"
          ? PALETTE.crit
          : c.status === "warning"
            ? PALETTE.warn
            : PALETTE.info;
    ctx.fillStyle = color;
    ctx.font = "600 17px system-ui, sans-serif";
    const mark = c.status === "pass" ? "OK" : c.status === "critical" ? "NG" : c.status === "warning" ? "!" : "i";
    ctx.fillText(mark, 64, y);
    ctx.fillStyle = PALETTE.text;
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillText(c.label, 96, y);
    ctx.fillStyle = PALETTE.sub;
    ctx.font = "13px system-ui, sans-serif";
    const det = wrapText(ctx, c.detail, W - 96 - 320 - 60);
    ctx.fillText(det[0] ?? "", 320, y);
    y += 30;
  }
  y += 30;
  ctx.fillStyle = PALETTE.sub;
  ctx.font = "13px system-ui, sans-serif";
  const noteLines = wrapText(ctx, result.privacyNote, W - 96);
  for (const l of noteLines) {
    ctx.fillText(l, 48, y);
    y += 20;
  }
  y += 6;
  ctx.fillText("注意: スコアは投稿前チェック項目の達成度を独自基準で算出したもので、CTR・再生数を予測するものではありません。", 48, y);

  return canvas;
}

export function downloadResultPng(result: DiagnosisResult): void {
  const canvas = resultCardCanvas(result);
  const a = document.createElement("a");
  a.download = `preflight-${result.id}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

/** Ranked list helper for comparison values (not a CTR prediction). */
export function ruleBasedRank(result: DiagnosisResult): { rank: number; label: string; score: number }[] {
  const items = result.scores
    .map((s) => ({ key: s.key, label: s.label, score: s.earned, max: s.max }))
    .sort((a, b) => severityRankFor(b) - severityRankFor(a));
  return items.map((it, i) => ({ rank: i + 1, label: it.label, score: normalizedScore(it.score, it.max) }));
}

function severityRankFor(s: { score: number; max: number }): number {
  const r = s.max === 0 ? 0 : s.score / s.max;
  if (r >= 0.85) return 3;
  if (r >= 0.5) return 2;
  if (r > 0) return 1;
  return 0;
}

function normalizedScore(score: number, max: number): number {
  return max === 0 ? 0 : Math.round((score / max) * 100);
}

/** Comparison data for multiple results (compare page). */
export function compareResults(results: DiagnosisResult[]) {
  return results.map((r) => {
    const byKey = new Map<string, ScoreCategory>(r.scores.map((s) => [s.key, s]));
    return {
      id: r.id,
      title: r.input.title || "（タイトル未入力）",
      total: r.totalScore,
      thumbnail: byKey.get("thumbnail")?.earned ?? 0,
      titleScore: byKey.get("title")?.earned ?? 0,
      titleThumbnail: byKey.get("titleThumbnail")?.earned ?? 0,
      description: byKey.get("description")?.earned ?? 0,
      chapters: byKey.get("chapters")?.earned ?? 0,
      hashtags: byKey.get("hashtags")?.earned ?? 0,
      technical: byKey.get("technical")?.earned ?? 0,
      warnings: r.summary.warning,
      criticals: r.summary.critical,
      createdAt: r.createdAt,
    };
  });
}