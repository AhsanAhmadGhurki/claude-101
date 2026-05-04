import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input, Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { generateTrip } from "../../lib/ai/generateTrip";

const LOADER_MESSAGES = [
  "Reading the wind direction...",
  "Mapping the trails...",
  "Picking the best viewpoints...",
  "Packing your dream itinerary...",
];

const TYPES = [
  { value: "Adventure", icon: "mdi:hiking" },
  { value: "Relax", icon: "mdi:beach" },
  { value: "Culture", icon: "mdi:temple-buddhist-outline" },
  { value: "Road Trip", icon: "mdi:car-traction-control" },
];

const PROMPT_INSPIRATION = [
  "3-day Hunza adventure with Karakoram views",
  "Skardu trekking trip, mid-budget",
  "Naran-Kaghan road trip in autumn",
  "Quiet Chitral cultural escape",
];

export function TripBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(params.get("prompt") || "");
  const [tripType, setTripType] = useState("Adventure");
  const [status, setStatus] = useState("idle");
  const [trip, setTrip] = useState(null);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % LOADER_MESSAGES.length),
      1200
    );
    return () => clearInterval(id);
  }, [status]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus("loading");
    setTrip(null);
    try {
      const result = await generateTrip({ prompt, tripType });
      sessionStorage.setItem("lastTrip", JSON.stringify(result));
      setTrip(result);
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="mb-12 max-w-3xl">
        <motion.span
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
        >
          Studio
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-5xl sm:text-6xl font-bold text-fg leading-tight tracking-tight"
        >
          Where to next?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-fg-muted text-lg leading-relaxed"
        >
          Describe your trip in a sentence. The AI handles itinerary, packing,
          and tips.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase tracking-widest text-fg-subtle font-semibold">
              Step 1 · Your idea
            </label>
            <span className="text-xs text-fg-subtle">
              {prompt.length} / 240
            </span>
          </div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-line bg-surface-2 px-4 py-3 focus-within:border-accent transition"
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 5 }}
              variant="borderless"
              maxLength={240}
              placeholder="e.g. 3-day trip to Hunza with hiking and good food..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="!bg-transparent !text-fg !text-lg placeholder:!text-fg-subtle !p-0"
            />
          </motion.div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_INSPIRATION.map((p, i) => (
              <motion.button
                key={p}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setPrompt(p)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-2 text-fg-muted hover:bg-surface-hover hover:text-fg transition"
              >
                {p}
              </motion.button>
            ))}
          </div>

          <div className="mt-9">
            <label className="text-xs uppercase tracking-widest text-fg-subtle font-semibold">
              Step 2 · Trip type
            </label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TYPES.map((t, i) => {
                const isActive = tripType === t.value;
                return (
                  <motion.button
                    key={t.value}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setTripType(t.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border font-medium transition ${
                      isActive
                        ? "bg-accent text-accent-fg border-accent"
                        : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                    }`}
                  >
                    <Icon icon={t.icon} className="text-2xl" />
                    <span className="text-sm">{t.value}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="primary"
              size="large"
              block
              loading={status === "loading"}
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              icon={<Icon icon="mdi:auto-fix" />}
              className="!h-14 !mt-9 !text-base !font-semibold"
            >
              {status === "loading" ? "Generating..." : "Generate plan"}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <div className="lg:sticky lg:top-28 rounded-3xl border border-line bg-surface surface-shadow overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <motion.img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80"
                alt="Live preview"
                animate={status === "loading" ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute top-4 left-4 text-xs uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/30"
              >
                Live Preview
              </motion.span>
            </div>

            <div className="p-6 -mt-12 relative">
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-2xl font-bold text-fg">
                      Awaiting your prompt
                    </h3>
                    <p className="text-fg-muted text-sm mt-2">
                      Once you generate, your itinerary outline appears here.
                    </p>
                    <div className="mt-6 space-y-3">
                      {[1, 2, 3].map((n) => (
                        <motion.div
                          key={n}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + n * 0.1, duration: 0.5 }}
                          className="p-4 rounded-xl border border-dashed border-line"
                        >
                          <div className="h-3 w-16 bg-surface-2 rounded mb-2" />
                          <div className="h-4 w-3/4 bg-surface-2 rounded" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-10"
                  >
                    <div className="inline-flex items-center gap-3 mb-4">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-3 h-3 rounded-full bg-accent"
                          animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: i * 0.25,
                          }}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={msgIndex}
                        initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                        transition={{ duration: 0.4 }}
                        className="text-fg-muted"
                      >
                        {LOADER_MESSAGES[msgIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                )}

                {status === "done" && trip && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                      {trip.tripType} · {trip.days.length} days
                    </span>
                    <h3 className="text-3xl font-bold text-fg mt-1">
                      {trip.destination}
                    </h3>
                    <p className="text-fg-muted text-sm mt-2 line-clamp-3 leading-relaxed">
                      {trip.summary}
                    </p>

                    <div className="mt-5 space-y-2">
                      {trip.days.map((d, i) => (
                        <motion.div
                          key={d.day}
                          initial={{ opacity: 0, x: 30, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ x: 4, scale: 1.02 }}
                          className="flex gap-3 p-3 rounded-xl bg-surface-2 border border-line"
                        >
                          <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                            {d.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-fg truncate">
                              {d.title}
                            </p>
                            <p className="text-xs text-fg-muted truncate">
                              {d.activities.length} activities
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={() => navigate("/trip/current")}
                        icon={<Icon icon="mdi:arrow-right" />}
                        iconPosition="end"
                        className="!h-12 !mt-6 !font-semibold"
                      >
                        View full trip
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
