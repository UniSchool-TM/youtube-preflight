"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ThemePreference } from "@/types";
import { useTheme } from "@/hooks/useTheme";

const ThemeContext = createContext<{
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  isDark: boolean;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useTheme();
  const v = useMemo(() => value, [value]);
  return <ThemeContext.Provider value={v}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}