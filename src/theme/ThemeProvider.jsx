import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider } from "antd";
import { lightTheme, darkTheme } from "./index";
import { ThemeContext } from "./themeContext";

const STORAGE_KEY = "adventure.theme";

const getInitialMode = () => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, mode);
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
