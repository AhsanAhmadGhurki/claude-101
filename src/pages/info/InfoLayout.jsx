import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export function InfoLayout({ eyebrow, title, intro, icon, children }) {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <header className="mb-12">
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6"
          >
            <Icon icon={icon} className="text-3xl" />
          </motion.div>
        )}
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
        >
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-4xl sm:text-6xl font-bold tracking-tight text-fg leading-[1.05]"
        >
          {title}
        </motion.h1>
        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-lg text-fg-muted leading-relaxed max-w-2xl"
          >
            {intro}
          </motion.p>
        )}
      </header>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function InfoSection({ title, children, className = "" }) {
  return (
    <section className={`mb-10 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-fg tracking-tight mb-3">
          {title}
        </h2>
      )}
      <div className="space-y-3 text-fg-muted leading-relaxed">{children}</div>
    </section>
  );
}

export function InfoCard({ icon, title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-surface border border-line surface-shadow p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Icon icon={icon} className="text-xl" />
          </div>
        )}
        {title && (
          <h3 className="text-lg font-bold text-fg tracking-tight">{title}</h3>
        )}
      </div>
      <div className="text-sm text-fg-muted leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}
