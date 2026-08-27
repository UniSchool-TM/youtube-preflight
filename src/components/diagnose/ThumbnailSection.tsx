"use client";

import type { ThumbnailAnalysis } from "@/types";
import { Card, SectionHeading } from "@/components/ui";
import {
  BarChart,
  ColorSwatch,
  Meter,
  StatGrid,
  MessageList,
} from "@/components/diagnose/analysisViews";
import {
  brightnessLabel,
  contrastLabel,
  edgeLabel,
  saturationLabel,
} from "@/lib/thumbnailAnalysis";

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

export function ThumbnailSection({
  analysis,
  previewUrl,
}: {
  analysis: ThumbnailAnalysis;
  previewUrl: string | null;
}) {
  const mp = (analysis.totalPixels / 1e6).toFixed(2);
  const bLabel = brightnessLabel(analysis.avgBrightness);
  const cLabel = contrastLabel(analysis.contrast);
  const sLabel = saturationLabel(analysis.avgSaturation);
  const eLabel = edgeLabel(analysis.edgesPerPixel);

  const issues: { type: "good" | "warning" | "critical" | "info"; text: string }[] = [];
  if (analysis.width < 1280 || analysis.height < 720) {
    issues.push({
      type: "warning",
      text: `解像度が ${analysis.width}x${analysis.height} です。1280x720以上を推奨します（低解像度の場合は拡大時に粗くなる可能性があります）`,
    });
  }
  if (Math.abs(analysis.aspectRatio - 16 / 9) > 0.15) {
    issues.push({ type: "warning", text: "アスペクト比が16:9と異なります。YouTubeのプレイヤー表示に合わせるためトリミングを検討してください。" });
  }
  if (analysis.fileSize > 5 * 1024 * 1024) {
    issues.push({ type: "warning", text: "ファイルサイズが大きめです。2MB以内を目安に圧縮を検討してください。" });
  }
  if (bLabel === "暗すぎる" || bLabel === "明るすぎる") {
    issues.push({ type: "warning", text: `明るさが${bLabel === "暗すぎる" ? "低" : "高"}すぎます。小さい表示での視認性に影響します。` });
  }
  if (cLabel === "低コントラスト") {
    issues.push({ type: "warning", text: "コントラストが低いため、小さい表示では視認性が低下する可能性があります。" });
  }
  if (cLabel === "高コントラスト") {
    issues.push({ type: "info", text: "コントラストが非常に高く、ディテールが潰れている可能性があります。" });
  }

  return (
    <div className="space-y-6">
      <Card ariaLabel="サムネイル基本情報">
        <SectionHeading
          title="サムネイル基本情報"
          description="画像をブラウザ内で解析した結果です。外部へ送信されません。"
        />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {previewUrl && (
            <div className="overflow-hidden rounded-lg bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="解析したサムネイル" className="w-full" />
            </div>
          )}
          <div>
            <StatGrid
              items={[
                { label: "幅", value: `${analysis.width} px` },
                { label: "高さ", value: `${analysis.height} px` },
                { label: "アスペクト比", value: analysis.aspectRatio.toFixed(3) },
                { label: "ファイル形式", value: analysis.format },
                { label: "ファイルサイズ", value: fmtBytes(analysis.fileSize) },
                { label: "総ピクセル数", value: `${mp} MP` },
              ]}
            />
            {issues.length > 0 && (
              <div className="mt-4">
                <MessageList
                  reasons={issues.map((i) => ({ type: i.type, text: i.text }))}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card ariaLabel="サムネイル画質指標">
        <SectionHeading
          title="画質指標"
          description="輝度・コントラスト・彩度・エッジ量を全ピクセルから算出しています。"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Meter
            label={`明るさ（${bLabel}）`}
            value={analysis.avgBrightness}
            format={(v) => `${(v * 100).toFixed(0)}%`}
            status={bLabel === "適正" ? "good" : "warning"}
          />
          <Meter
            label={`コントラスト（${cLabel}）`}
            value={analysis.contrast}
            format={(v) => v.toFixed(2)}
            status={cLabel === "適正" ? "good" : "warning"}
          />
          <Meter
            label={`彩度（${sLabel}）`}
            value={analysis.avgSaturation}
            format={(v) => `${(v * 100).toFixed(0)}%`}
            status={sLabel === "適正" ? "good" : "warning"}
          />
          <Meter
            label={`エッジ量・情報量（${eLabel}）`}
            value={analysis.edgesPerPixel}
            format={(v) => v.toFixed(2)}
            status={eLabel === "適正" ? "good" : "warning"}
          />
        </div>
        <p className="mt-4 text-xs text-muted">
          「情報量」はあくまで画像処理上の指標（エッジ密度）であり、視聴者の理解度を直接示すものではありません。
        </p>
      </Card>

      <Card ariaLabel="サムネイル色分析">
        <SectionHeading
          title="色分析"
          description="主要カラーを平均色バケットから抽出。クリックでHEXをコピーできます。"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.dominantColors.map((c, i) => (
            <ColorSwatch key={c.hex + i} color={c} index={i} />
          ))}
        </div>
      </Card>

      <Card ariaLabel="輝度ヒストグラム">
        <SectionHeading
          title="輝度分布"
          description="全ピクセルの明るさの分布。左が暗い側、右が明るい側です。偏りすぎている場合は補正を検討してください。"
        />
        <BarChart
          values={analysis.luminanceHistogram}
          maxVal={Math.max(...analysis.luminanceHistogram)}
          ariaLabel="輝度ヒストグラム"
          colorClass="bg-accent"
          height={64}
          labels={Array.from({ length: 16 }, (_, i) => `${Math.round((i / 16) * 100)}%`)}
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>暗</span>
          <span>明</span>
        </div>
      </Card>
    </div>
  );
}