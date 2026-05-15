import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";
import { lightTheme, darkTheme } from "./index";
import { ThemeContext } from "./themeContext";
import { THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY } from "./storageKey";

const getInitialMode = () => {
  if (typeof window === "undefined") return "light";
  // Prefer the canonical key; fall back to the legacy key for users who
  // saved a preference under the old name. The legacy entry is migrated and
  // cleaned up below in the mount effect.
  const stored =
    window.localStorage.getItem(THEME_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    // One-time cleanup of the legacy key so the same preference doesn't live
    // under two names. Safe to call every render — removeItem is a no-op
    // once the entry is gone.
    if (window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    }
  }, [mode]);

  const toggle = useCallback(
    () => setMode((m) => (m === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle]);
  const antdTheme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
