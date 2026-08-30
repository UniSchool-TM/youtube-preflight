"use client";

import { useCallback, useRef, useState } from "react";
import { AI_MODEL_ID, AI_MODEL_NOTE, AI_MODEL_LIMITATION, buildAiMessages } from "@/lib/aiPrompt";
import { Card, SectionHeading } from "@/components/ui";
import type { DiagnosisResult } from "@/types";

type Phase = "idle" | "loading" | "generating" | "done" | "error";

interface ProgressState {
  percent: number;
  text: string;
}

export function AiImproveCard({ result }: { result: DiagnosisResult }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<ProgressState>({ percent: 0, text: "" });
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const pipeRef = useRef<Awaited<ReturnType<typeof createGenerator>> | null>(null);

  const run = useCallback(async () => {
    if (pipeRef.current) {
      await generate(pipeRef.current, result, setPhase, setOutput, setError);
      return;
    }
    setPhase("loading");
    setProgress({ percent: 0, text: "AIエンジンを準備中…" });
    try {
      const generator = await createGenerator((p) => setProgress(p));
      pipeRef.current = generator;
      await generate(generator, result, setPhase, setOutput, setError);
    } catch (e) {
      setError(toMessage(e));
      setPhase("error");
    }
  }, [result]);

  if (phase === "idle") {
    return (
      <Card ariaLabel="AIによる改善提案">
        <SectionHeading
          title="AIによる改善提案"
          description="診断結果を端末内のAIが読み、投稿前の改善ポイントを提案します。"
          right={
            <button
              type="button"
              onClick={() => void run()}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-[0_2px_0_rgba(0,0,0,0.2)] hover:brightness-110"
            >
              提案を生成（端末内AI）
            </button>
          }
        />
        <AiPrivacyNote />
      </Card>
    );
  }

  return (
    <Card ariaLabel="AIによる改善提案">
      <SectionHeading
        title="AIによる改善提案"
        description="診断結果を端末内のAIが読み、投稿前の改善ポイントを提案します。"
      />
      {phase === "loading" && (
        <div className="space-y-3" role="status">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent"
              aria-hidden="true"
            />
            <span>{progress.text}</span>
            {progress.percent > 0 && (
              <span className="tabular-nums">{progress.percent}%</span>
            )}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
      {phase === "generating" && (
        <div className="flex items-center gap-3 text-sm text-muted" role="status">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent"
            aria-hidden="true"
          />
          <span>提案を作成中…</span>
        </div>
      )}
      {phase === "done" && (
        <div>
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs">
            <span className="font-bold text-warn">注意</span>
            <p className="text-foreground/80">{AI_MODEL_LIMITATION}</p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {output}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void run()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent"
            >
              もう一度生成
            </button>
          </div>
        </div>
      )}
      {phase === "error" && (
        <div>
          <p className="rounded-lg border border-crit/40 bg-crit/10 px-3 py-2 text-sm text-crit" role="alert">
            AI提案の生成に失敗しました。{error}
          </p>
          <button
            type="button"
            onClick={() => void run()}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent"
          >
            再試行
          </button>
        </div>
      )}
      <AiPrivacyNote />
    </Card>
  );
}

function AiPrivacyNote() {
  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-start gap-2 text-xs text-muted">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>{AI_MODEL_NOTE}</span>
      </p>
      <p className="flex items-start gap-2 text-xs text-muted">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>{AI_MODEL_LIMITATION}</span>
      </p>
    </div>
  );
}

async function createGenerator(
  onProgress: (p: ProgressState) => void
): Promise<import("@huggingface/transformers").TextGenerationPipeline> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;

  const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
  const device = hasWebGPU ? "webgpu" : "wasm";
  const dtype = hasWebGPU ? "q4" : "q8";

  onProgress({ percent: 0, text: "AIモデルをダウンロードしています（初回のみ）…" });
  const generator = await pipeline("text-generation", AI_MODEL_ID, {
    device,
    dtype,
    progress_callback: (p) => {
      if (p.status === "progress" && p.total) {
        onProgress({
          percent: Math.round((p.loaded / p.total) * 100),
          text: "AIモデルをダウンロードしています（初回のみ）…",
        });
      } else if (p.status === "done") {
        onProgress({ percent: 100, text: "ダウンロード完了" });
      }
    },
  });
  return generator;
}

async function generate(
  generator: import("@huggingface/transformers").TextGenerationPipeline,
  result: DiagnosisResult,
  setPhase: (p: Phase) => void,
  setOutput: (s: string) => void,
  setError: (s: string) => void
) {
  setPhase("generating");
  try {
    const input = result.input;
    const messages = buildAiMessages({
      title: input.title,
      description: input.description,
      durationRaw: input.durationRaw,
      genre: input.genre,
      target: input.target,
      hashtags: input.hashtagsRaw
        ? input.hashtagsRaw.split(/[\s,]+/).filter(Boolean)
        : undefined,
      chaptersRaw: input.chaptersRaw,
    });
    const out = await generator(messages, {
      max_new_tokens: 384,
      do_sample: true,
      temperature: 0.3,
      top_p: 0.9,
      repetition_penalty: 1.1,
    });
    const chat = out[0].generated_text;
    const last = chat.at(-1);
    const content = last?.content;
    const text = typeof content === "string" ? content : joinContent(content);
    const cleaned = cleanOutput(text);
    if (!cleaned.trim()) {
      setError("提案を生成できませんでした。再度お試しください。");
      setPhase("error");
      return;
    }
    setOutput(cleaned);
    setPhase("done");
  } catch (e) {
    setError(toMessage(e));
    setPhase("error");
  }
}

interface ContentItem {
  type?: string;
  text?: string;
}

function joinContent(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((c) => {
      const item = c as ContentItem;
      return item && item.type === "text" && typeof item.text === "string"
        ? item.text
        : "";
    })
    .join("");
}

function cleanOutput(text: string): string {
  return text.trim();
}

function toMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}