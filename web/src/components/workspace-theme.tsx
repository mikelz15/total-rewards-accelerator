"use client";

import { useEffect, useState } from "react";

export type WorkspaceTheme = "light" | "dark";

const STORAGE_KEY = "tra-workspace-theme";

export function useWorkspaceTheme() {
  const [theme, setTheme] = useState<WorkspaceTheme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  function choose(next: WorkspaceTheme) {
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { theme, setTheme: choose };
}
