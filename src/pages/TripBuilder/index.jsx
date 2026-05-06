import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input, Slider, Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTripPlanner } from "../../../client/src/hooks/useTripPlanner";
import destinations from "../../../client/src/mocks/destinations.json";

function extractDaysFromPrompt(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*-?\s*day/i);
  if (m) return Math.min(Math.max(parseInt(m[1], 10), 1), 10);
  const word = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*-?\s*day/i);
  if (word) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    return map[word[1].toLowerCase()];
  }
  return null;
}

const DESTINATION_CHOICES = Object.keys(destinations).map((key) => ({
  value: key,
  label: destinations[key].name,
  region: destinations[key].region,
}));

const INTEREST_OPTS = [
  { key: "adventure", label: "Adventure", icon: "mdi:hiking" },
  { key: "nature", label: "Nature", icon: "mdi:tree-outline" },
  { key: "culture", label: "Culture", icon: "mdi:temple-buddhist-outline" },
  { key: "food", label: "Food", icon: "mdi:silverware-fork-knife" },
  { key: "photography", label: "Photography", icon: "mdi:camera-outline" },
  { key: "family", label: "Family", icon: "mdi:account-group-outline" },
  { key: "road-trip", label: "Road Trip", icon: "mdi:car-traction-control" },
];

const BUDGET_OPTS = [
  { key: "low", label: "Budget", sub: "≈ Rs 7k–12k/day" },
  { key: "medium", label: "Comfortable", sub: "≈ Rs 22k–32k/day" },
  { key: "luxury", label: "Premium", sub: "≈ Rs 65k+/day" },
];

const STYLE_OPTS = [
  { key: "relaxed", label: "Relaxed" },
  { key: "balanced", label: "Balanced" },
  { key: "packed", label: "Packed" },
];

const SEASON_OPTS = [
  { key: "spring", label: "Spring", icon: "mdi:flower-outline" },
  { key: "summer", label: "Summer", icon: "mdi:weather-sunny" },
  { key: "autumn", label: "Autumn", icon: "mdi:leaf" },
  { key: "winter", label: "Winter", icon: "mdi:snowflake" },
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
  const initialPrompt = params.get("prompt") || "";
  const [prompt, setPrompt] = useState(initialPrompt);
  const [days, setDays] = useState(() => extractDaysFromPrompt(initialPrompt) ?? 3);
  const [budget, setBudget] = useState("medium");
  const [style, setStyle] = useState("balanced");
  const [interests, setInterests] = useState([]);
  const [season, setSeason] = useState(null);
  const [destinationKey, setDestinationKey] = useState(null);
  const [prevPrompt, setPrevPrompt] = useState(initialPrompt);
  const inputRef = useRef(null);

  if (prompt !== prevPrompt) {
    setPrevPrompt(prompt);
    const parsedDays = extractDaysFromPrompt(prompt);
    if (parsedDays && parsedDays !== days) setDays(parsedDays);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus({ cursor: "end" });
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const overrides = useMemo(
    () => ({
      destinationKey: destinationKey ?? undefined,
      days,
      budget,
      style,
      interests: interests.length ? interests : undefined,
      season: season ?? undefined,
    }),
    [destinationKey, days, budget, style, interests, season]
  );

  const { trip, pending } = useTripPlanner({ prompt, overrides });

  const toggleInterest = (key) =>
    setInterests((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const handleConfirm = () => {
    if (!trip || trip.unresolved) return;
    sessionStorage.setItem("lastTrip", JSON.stringify(trip));
    navigate("/trip/current");
  };

  const handleAnswer = (key, value) => {
    if (key === "destination") setDestinationKey(value);
    else if (key === "budget") setBudget(value);
    else if (key === "season") setSeason(value);
    else if (key === "days") setDays(value);
    else if (key === "interests") toggleInterest(value);
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="mb-10 max-w-3xl">
        <motion.span
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
        >
          Live Studio
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
          Type freely or tweak any control — the itinerary regenerates as you go.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
        >
          <SectionLabel step="01" title="Your idea" right={`${prompt.length} / 240`} />
          <motion.div
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-line bg-surface-2 px-4 py-3 focus-within:border-accent transition"
          >
            <Input.TextArea
              ref={inputRef}
              autoSize={{ minRows: 3, maxRows: 5 }}
              variant="borderless"
              maxLength={240}
              placeholder="e.g. 3-day Hunza adventure with Karakoram views and good food..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="!bg-transparent !text-fg !text-lg placeholder:!text-fg-subtle !p-0"
            />
          </motion.div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_INSPIRATION.map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setPrompt(p)}
                className="text-xs px-3 py-1.5 rounded-full bg-surface-2 text-fg-muted hover:bg-surface-hover hover:text-fg transition"
              >
                {p}
              </motion.button>
            ))}
          </div>

          <SectionLabel step="02" title="Days" className="mt-9" />
          <div className="rounded-2xl border border-line bg-surface-2 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-fg tabular-nums">{days}</span>
              <span className="text-xs text-fg-subtle uppercase tracking-[0.2em]">
                {days === 1 ? "day" : "days"}
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              value={days}
              onChange={setDays}
              tooltip={{ open: false }}
              className="!mt-2"
            />
          </div>

          <SectionLabel step="03" title="Budget" className="mt-8" />
          <div className="grid sm:grid-cols-3 gap-2.5">
            {BUDGET_OPTS.map((b) => {
              const active = budget === b.key;
              return (
                <motion.button
                  key={b.key}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBudget(b.key)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    active
                      ? "bg-accent text-accent-fg border-accent"
                      : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      active ? "text-accent-fg/80" : "text-fg-subtle"
                    }`}
                  >
                    {b.sub}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <SectionLabel step="04" title="Interests" className="mt-8" />
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTS.map((i) => {
              const active = interests.includes(i.key);
              return (
                <motion.button
                  key={i.key}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleInterest(i.key)}
                  className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full border transition ${
                    active
                      ? "bg-accent text-accent-fg border-accent"
                      : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  <Icon icon={i.icon} className="text-base" /> {i.label}
                </motion.button>
              );
            })}
          </div>

          <SectionLabel step="05" title="Pace & Season" className="mt-8" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-fg-subtle mb-2">
                Pace
              </div>
              <div className="flex gap-2">
                {STYLE_OPTS.map((s) => {
                  const active = style === s.key;
                  return (
                    <motion.button
                      key={s.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStyle(s.key)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm border transition ${
                        active
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface-2 border-line text-fg-muted hover:text-fg"
                      }`}
                    >
                      {s.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-fg-subtle mb-2">
                Season
              </div>
              <div className="flex gap-2">
                {SEASON_OPTS.map((s) => {
                  const active = season === s.key;
                  return (
                    <motion.button
                      key={s.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSeason(active ? null : s.key)}
                      className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition ${
                        active
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface-2 border-line text-fg-muted hover:text-fg"
                      }`}
                      title={s.label}
                    >
                      <Icon icon={s.icon} className="text-base" />
                      <span className="text-[10px] uppercase tracking-wider">
                        {s.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <div className="lg:sticky lg:top-28 rounded-3xl border border-line bg-surface surface-shadow overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.3em] text-accent font-bold flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${pending ? "bg-accent animate-pulse" : "bg-accent/70"}`} />
                {pending ? "Re-planning…" : "Live preview"}
              </span>
              {trip && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
                  Confidence {trip.confidence}%
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!trip && !pending && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <h3 className="text-2xl font-bold text-fg">
                    Tell me your idea
                  </h3>
                  <p className="text-fg-muted text-sm mt-2">
                    Type a sentence above or tap a city below — I'll plan it live.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {DESTINATION_CHOICES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDestinationKey(d.value)}
                        className="text-xs px-3 py-1.5 rounded-full bg-surface-2 hover:bg-surface-hover border border-line text-fg-muted hover:text-fg transition"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {!trip && pending && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <TripPreviewSkeleton />
                </motion.div>
              )}

              {trip && trip.unresolved && (
                <motion.div
                  key={`unresolved-${trip.id}`}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="px-6 pb-6"
                >
                  <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4 mb-4">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold mb-1.5 flex items-center gap-1.5">
                      <Icon icon="mdi:map-search-outline" /> Need clarification
                    </div>
                    <p className="text-sm text-fg/90 leading-relaxed">
                      {trip.summary}
                    </p>
                  </div>

                  <div className="text-[11px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2">
                    Available cities
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DESTINATION_CHOICES.map((d) => (
                      <motion.button
                        key={d.value}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDestinationKey(d.value)}
                        className="text-left p-3 rounded-xl bg-surface-2 hover:bg-surface-hover border border-line hover:border-accent/50 transition"
                      >
                        <div className="text-sm font-semibold text-fg">
                          {d.label}
                        </div>
                        <div className="text-[10px] text-fg-subtle mt-0.5">
                          {d.region}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {trip && !trip.unresolved && (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="px-6 pb-6"
                >
                  <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                    {trip.tripType} · {trip.days.length} days · {trip.budget.tier}
                  </span>
                  <h3 className="text-3xl font-bold text-fg mt-1">
                    {trip.destination}
                  </h3>
                  <p className="text-xs text-fg-subtle">{trip.region}</p>
                  <p className="text-fg-muted text-sm mt-3 leading-relaxed">
                    {trip.summary}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat label="Per day" value={formatPKR(trip.budget.perDay)} />
                    <Stat label="Total" value={formatPKR(trip.budget.total)} />
                    <Stat label="Activities" value={trip.days.reduce((n, d) => n + d.activities.length, 0)} />
                  </div>

                  {trip.followUps.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold mb-2 flex items-center gap-1.5">
                        <Icon icon="mdi:help-circle-outline" /> A few quick questions
                      </div>
                      <div className="space-y-3">
                        {trip.followUps.map((q) => (
                          <div key={q.key}>
                            <div className="text-sm text-fg/90">{q.text}</div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {q.options.map((o) => (
                                <button
                                  key={o.value}
                                  onClick={() => handleAnswer(q.key, o.value)}
                                  className="text-xs px-2.5 py-1 rounded-full bg-surface border border-line text-fg-muted hover:text-fg hover:border-line-strong transition"
                                >
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    {trip.days.map((d, i) => (
                      <motion.div
                        key={`${trip.id}-${d.day}`}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className="rounded-xl bg-surface-2 border border-line p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                            {d.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-fg truncate">
                              {d.title}
                            </p>
                            <p className="text-[11px] text-fg-subtle truncate">
                              {d.timeline.map((t) => t.label).join(" · ")}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleConfirm}
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
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({ step, title, right, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <label className="text-xs uppercase tracking-widest text-fg-subtle font-semibold">
        Step {step} · {title}
      </label>
      {right && <span className="text-xs text-fg-subtle">{right}</span>}
    </div>
  );
}

function formatPKR(n) {
  return `Rs ${Math.round(n).toLocaleString("en-PK")}`;
}

function Pulse({ className = "", delay = 0 }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.75, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay }}
      className={`bg-surface-2 ${className}`}
    />
  );
}

function TripPreviewSkeleton() {
  return (
    <div>
      <Pulse className="h-3 w-32 rounded-full" />
      <Pulse className="h-9 w-3/4 rounded-lg mt-3" delay={0.05} />
      <Pulse className="h-2.5 w-24 rounded-full mt-2" delay={0.08} />
      <Pulse className="h-3 w-full rounded-full mt-4" delay={0.1} />
      <Pulse className="h-3 w-5/6 rounded-full mt-1.5" delay={0.12} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Pulse key={i} className="h-14 rounded-xl" delay={0.15 + i * 0.04} />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {[0, 1, 2].map((i) => (
          <Pulse key={i} className="h-14 rounded-xl" delay={0.25 + i * 0.06} />
        ))}
      </div>
      <Pulse className="h-12 rounded-xl mt-6" delay={0.45} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-line px-3 py-2 text-center">
      <div className="text-base font-bold text-fg tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle mt-0.5">
        {label}
      </div>
    </div>
  );
}
