import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { usePageTitle } from "../../../hooks/usePageTitle";

// Catch-all 404. Tailwind-only per CLAUDE.md hybrid rule for new components.
// Aims to feel on-brand (compass icon, accent gradient, motion entry) rather
// than the generic "Page not found" — and gives the user three concrete next
// steps instead of leaving them stranded.
export function NotFoundPage() {
  usePageTitle("Page not found");
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 sm:px-6 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ rotate: -8, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.6, type: "spring", stiffness: 160, damping: 14 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 text-accent mb-6"
        >
          <Icon icon="mdi:compass-off-outline" className="text-4xl" />
        </motion.div>

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
          404 · off the trail
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-fg tracking-tight">
          We can&apos;t find that page.
        </h1>
        <p className="mt-4 text-fg-muted leading-relaxed">
          The link may be broken, the page may have moved, or you might have
          wandered somewhere we haven&apos;t mapped yet. Pick a direction below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-semibold hover:bg-accent-hover transition"
          >
            <Icon icon="mdi:home-outline" />
            Take me home
          </Link>
          <Link
            to="/builder"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-line text-fg font-semibold hover:border-accent/60 transition"
          >
            <Icon icon="mdi:auto-fix" />
            Plan a trip
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-fg-muted hover:text-fg font-medium transition"
          >
            <Icon icon="mdi:arrow-left" />
            Go back
          </button>
        </div>
      </motion.div>
    </section>
  );
}
