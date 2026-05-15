import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

// Full-screen "cinematic" loading state shown while Gemini is generating.
// The phases cycle for narrative effect — they don't reflect server-side
// progress, but the bar's `progress` prop does (driven by the hook).

const PHASES = [
  { icon: "mdi:map-search-outline", label: "Researching your destination" },
  { icon: "mdi:sparkles", label: "Drafting your itinerary" },
  { icon: "mdi:silverware-fork-knife", label: "Choosing places to eat" },
  { icon: "mdi:bed-outline", label: "Picking hotels" },
  { icon: "mdi:bus-clock", label: "Mapping local transport" },
  { icon: "mdi:bag-personal-outline", label: "Building your packing list" },
];

export function GenerationLoader({ progress = 0, destination = "" }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const active = PHASES[phase];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md px-6">
        <div className="absolute -inset-6 bg-accent/15 blur-3xl rounded-full pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-line bg-surface/95 p-8 surface-shadow text-center"
        >
          <div className="relative mx-auto w-20 h-20">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-accent/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-accent/60 border-t-transparent"
              animate={{ rotate: -360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon="mdi:earth" className="text-3xl text-accent" />
            </motion.div>
          </div>

          <div className="mt-6 text-[11px] uppercase tracking-[0.3em] text-accent font-bold">
            Generating with Gemini
          </div>
          {destination && (
            <h2 className="mt-1 text-2xl font-bold text-fg tracking-tight">
              {destination}
            </h2>
          )}

          <div className="mt-6 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent/70 via-accent to-accent/70 rounded-full"
              style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <div className="mt-2 text-[10px] tabular-nums text-fg-subtle font-mono">
            {Math.round(progress)}%
          </div>

          <div className="mt-6 min-h-[40px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.label}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 text-sm text-fg-muted"
              >
                <Icon icon={active.icon} className="text-accent text-lg" />
                <span>{active.label}…</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-colors ${
                  i === phase ? "bg-accent" : "bg-line"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
