import { computeThumbnailStats, type ThumbnailStatsResult } from "@/lib/thumbnailAnalysis";

export interface WorkerRequest {
  type: "analyze";
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type WorkerResponse =
  | { type: "result"; stats: ThumbnailStatsResult }
  | { type: "error"; message: string };

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  if (!msg || msg.type !== "analyze") return;
  try {
    if (!(msg.data instanceof Uint8ClampedArray) || msg.data.length === 0) {
      (self as unknown as Worker).postMessage({ type: "error", message: "解析データが空です" });
      return;
    }
    const stats = computeThumbnailStats(msg.data, msg.width, msg.height);
    const response: WorkerResponse = { type: "result", stats };
    (self as unknown as Worker).postMessage(response);
  } catch (e) {
    const response: WorkerResponse = {
      type: "error",
      message: e instanceof Error ? e.message : "画像解析に失敗しました",
    };
    (self as unknown as Worker).postMessage(response);
  }
};