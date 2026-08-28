"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui";

const DEFAULT_MAX = 30;
const DISPLAY_LIMIT = 15;

export function parseTagTokens(text: string): string[] {
  return text
    .split(/[\s,、\n]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter((t) => t.length > 0);
}

export function HashtagInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = parseTagTokens(value);

  useEffect(() => {
    if (value === "" && draft !== "" && document.activeElement !== inputRef.current) {
      setDraft("");
    }
    // draft のリセットのみを目的とする
  }, [value, draft]);

  const commitTokens = (raw: string) => {
    const combined = `${value} ${raw}`;
    const seen = new Set<string>();
    const next = parseTagTokens(combined).filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    onChange(next.slice(0, DEFAULT_MAX).join(" "));
  };

  const submitDraft = () => {
    const t = draft.trim();
    setDraft("");
    if (t) commitTokens(t);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag).join(" "));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === "," || e.key === "、") {
      e.preventDefault();
      submitDraft();
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-base transition-shadow sm:text-sm",
          "cursor-text focus-within:border-accent focus-within:outline-none focus-within:ring-4 focus-within:ring-ring"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/10 pl-2.5 pr-1 py-1 text-sm font-medium text-foreground"
          >
            <span className="text-accent">#</span>
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`ハッシュタグ ${tag} を削除`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/15 hover:text-accent"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id="hashtag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            e.stopPropagation();
          }}
          onBlur={() => {
            submitDraft();
          }}
          enterKeyHint="enter"
          autoComplete="off"
          spellCheck={false}
          placeholder={tags.length === 0 ? "例: 動画編集 初心者 YouTube" : ""}
          aria-label="ハッシュタグ入力"
          className="min-w-28 flex-1 bg-transparent text-foreground placeholder:text-muted/70 focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Enter または <span className="font-mono">,</span> を押すと入力した語をハッシュタグとして確定します。タグは{" "}
        <span className="text-foreground">#{tags.length}</span> 個
        {tags.length >= DISPLAY_LIMIT && (
          <span className="text-warn">（15個以上は YouTube のタイトル上に表示されません）</span>
        )}
      </p>
    </div>
  );
}