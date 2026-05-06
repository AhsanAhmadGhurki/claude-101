import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../client/src/theme/themeContext";

export function ThemeToggle({ className = "" }) {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-line text-fg-muted hover:text-fg hover:border-line-strong transition ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <Icon
            icon={isDark ? "mdi:weather-sunny" : "mdi:weather-night"}
            className="text-lg"
          />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
