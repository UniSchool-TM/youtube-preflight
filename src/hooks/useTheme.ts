"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppSettings, ThemePreference } from "@/types";
import {
  loadThemePreference,
  saveThemePreference,
  loadSettings,
  saveSettings,
} from "@/lib/storage";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: ThemePreference): void {
  if (typeof document === "undefined") return;
  const dark = theme === "dark" || (theme === "auto" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function useTheme(): {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  isDark: boolean;
} {
  const [theme, setThemeState] = useState<ThemePreference>(() => loadThemePreference());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());
  const isDark = theme === "dark" || (theme === "auto" && systemDark);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setSystemDark(mq.matches);
      applyTheme(theme);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
    saveThemePreference(t);
    const settings = loadSettings();
    saveSettings({ ...settings, theme: t });
  }, []);

  return { theme, setTheme, isDark };
}

export function useSettings(): {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
} {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  return { settings, update };
}