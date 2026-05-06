import { motion } from "framer-motion";

// Shared visual frame for /signin and /signup so the two pages feel like one
// flow rather than two unrelated screens.
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent dark:from-accent/5"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-line bg-surface/80 backdrop-blur-md p-8 shadow-xl"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-fg">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>
          )}
        </div>
        {children}
        {footer && <div className="mt-6 text-sm text-fg-muted">{footer}</div>}
      </motion.div>
    </section>
  );
}
