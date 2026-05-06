import { Spin } from "antd";
import { motion } from "framer-motion";

// Shown immediately (Suspense fallback) while a route's lazy chunk loads,
// or wherever a page needs to wait on data before its real UI is ready.
// Centered, full-viewport-height — replaces the blank/black gap users
// otherwise see during a slow chunk fetch.
export function PageLoader({ label = "Loading…" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="min-h-[70vh] flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Spin size="large" />
      <p className="text-xs uppercase tracking-[0.3em] text-fg-subtle">
        {label}
      </p>
    </motion.div>
  );
}
