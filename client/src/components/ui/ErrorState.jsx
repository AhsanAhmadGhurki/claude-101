import { Button } from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

// Inline error block for pages that fail to fetch their data. Shows the
// error message and a retry button that re-runs the page's loader.
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retrying = false,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="alert"
      className={`rounded-2xl border border-line bg-surface/60 p-6 sm:p-8 text-center ${className}`}
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
        <Icon icon="mdi:cloud-alert-outline" className="text-2xl" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-fg">{title}</h2>
      <p className="mt-1 text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          type="primary"
          icon={<Icon icon="mdi:refresh" />}
          loading={retrying}
          onClick={onRetry}
          className="!mt-5 !font-semibold"
        >
          Try again
        </Button>
      )}
    </motion.div>
  );
}
