"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, SectionHeading, Toggle, cn } from "@/components/ui";
import { useSettings, useTheme } from "@/hooks/useTheme";
import { useHistory } from "@/hooks/useHistory";
import { clearAllData } from "@/lib/storage";
import type { ThemePreference } from "@/types";

const THEME_OPTIONS: { value: ThemePreference; label: string; desc: string }[] = [
  { value: "auto", label: "システムに合わせる", desc: "端末の設定に追従します" },
  { value: "light", label: "ライト", desc: "常に明るいテーマ" },
  { value: "dark", label: "ダーク", desc: "常に暗いテーマ" },
];

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="テーマ">
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "rounded-xl border px-4 py-2 text-left",
            theme === o.value
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/60"
          )}
        >
          <span className="block text-sm font-semibold text-foreground">{o.label}</span>
          <span className="block text-xs text-muted">{o.desc}</span>
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const history = useHistory();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (action: string, fn: () => Promise<void>) => {
    setBusy(action);
    setMsg(null);
    try {
      await fn();
      setMsg("処理しました");
    } catch {
      setMsg("エラーが発生しました");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">設定</h1>
        <p className="mt-1 text-sm text-muted">設定はこの端末のブラウザ内のみに保存されます。</p>
      </div>

      <Card ariaLabel="表示設定">
        <SectionHeading title="表示" />
        <ThemePicker />
      </Card>

      <Card ariaLabel="履歴設定">
        <SectionHeading
          title="履歴"
          description="診断を実行すると結果が自動で履歴に保存されます（最大200件）。"
        />
        <Toggle
          checked={settings.historyEnabled}
          onChange={(v) => update({ historyEnabled: v })}
          label="診断結果を履歴に保存する"
          description="保存先はこの端末のブラウザ内のみです。画像もサーバーへ送信されません。"
        />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            variant="danger"
            disabled={busy !== null}
            onClick={() => {
              if (window.confirm("履歴をすべて削除しますか？サムネイル画像も削除されます。")) {
                void run("clear", () => history.clear());
              }
            }}
          >
            {busy === "clear" ? "処理中…" : "履歴をすべて削除"}
          </Button>
        </div>
      </Card>

      <Card ariaLabel="データ削除">
        <SectionHeading
          title="データの初期化"
          description="履歴・設定・テーマ・IndexedDBのサムネイル画像をすべて削除し、初期状態に戻します。"
        />
        <Button
          variant="danger"
          disabled={busy !== null}
          onClick={() => {
            if (window.confirm("すべてのデータ（履歴・設定・保存画像）を削除しますか？この操作は取り消せません。")) {
              void run("all", async () => {
                await history.clear();
                clearAllData();
                router.push("/");
              });
            }
          }}
        >
          {busy === "all" ? "削除中…" : "すべてのデータを削除"}
        </Button>
      </Card>

      <Card ariaLabel="プライバシー">
        <SectionHeading title="プライバシー" />
        <p className="text-sm leading-relaxed text-muted">
          本ツールは入力内容を外部に送信しません。画像解析はブラウザ内（Web Worker）で、
          保存は localStorage / IndexedDB のみを使用しています。通信は静的ホスティングの配信のみです。
        </p>
      </Card>

      {msg && <p className="text-sm text-good" role="status">{msg}</p>}
    </div>
  );
}