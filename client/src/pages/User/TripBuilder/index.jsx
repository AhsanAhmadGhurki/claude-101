import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input, Slider, Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTripPlanner } from "../../../hooks/useTripPlanner";
import { useSavedTrips } from "../../../hooks/useSavedTrips";
import { useFormDraft, loadFormDraft, clearFormDraft } from "../../../hooks/useFormDraft";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { isConfigured } from "../../../services/ai/gemini";
import { GenerationLoader } from "../../../components/ui/GenerationLoader";
import { looksLikeInjection, sanitizeText } from "../../../lib/utils/sanitize";

const DRAFT_KEY = "tripBuilder:draft";
const TRAVELERS_MAX = 20;

const INTEREST_OPTS = [
  { key: "adventure", label: "Adventure", icon: "mdi:hiking" },
  { key: "nature", label: "Nature", icon: "mdi:tree-outline" },
  { key: "culture", label: "Culture", icon: "mdi:temple-buddhist-outline" },
  { key: "history", label: "History", icon: "mdi:castle" },
  { key: "food", label: "Food", icon: "mdi:silverware-fork-knife" },
  { key: "photography", label: "Photography", icon: "mdi:camera-outline" },
  { key: "nightlife", label: "Nightlife", icon: "mdi:glass-cocktail" },
  { key: "shopping", label: "Shopping", icon: "mdi:shopping-outline" },
  { key: "wellness", label: "Wellness", icon: "mdi:spa-outline" },
  { key: "wildlife", label: "Wildlife", icon: "mdi:paw" },
  { key: "beaches", label: "Beaches", icon: "mdi:beach" },
  { key: "road-trip", label: "Road Trip", icon: "mdi:car-traction-control" },
];

const BUDGET_OPTS = [
  {
    key: "low",
    label: "Budget",
    sub: "Backpacker · hostels, street food",
    icon: "mdi:wallet-outline",
  },
  {
    key: "medium",
    label: "Comfortable",
    sub: "Mid-range hotels, mix of dining",
    icon: "mdi:wallet-bifold-outline",
  },
  {
    key: "luxury",
    label: "Luxury",
    sub: "Premium stays, fine dining",
    icon: "mdi:diamond-stone",
  },
];

const STYLE_OPTS = [
  { key: "relaxed", label: "Relaxed", icon: "mdi:beach" },
  { key: "balanced", label: "Balanced", icon: "mdi:scale-balance" },
  { key: "packed", label: "Packed", icon: "mdi:run-fast" },
  { key: "adventure", label: "Adventure", icon: "mdi:hiking" },
  { key: "cultural", label: "Cultural", icon: "mdi:temple-buddhist-outline" },
  { key: "luxury", label: "Luxury", icon: "mdi:diamond-stone" },
];

const TRANSPORT_OPTS = [
  { key: "public", label: "Public transport", icon: "mdi:bus" },
  { key: "rental", label: "Rental car", icon: "mdi:car" },
  { key: "taxi", label: "Taxi / ride-share", icon: "mdi:taxi" },
  { key: "walking", label: "Walking", icon: "mdi:walk" },
  { key: "mixed", label: "Mixed", icon: "mdi:swap-horizontal" },
];

const FOOD_OPTS = [
  { key: "any", label: "Anything goes" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "gluten-free", label: "Gluten-free" },
  { key: "street-food", label: "Street food fan" },
  { key: "fine-dining", label: "Fine dining" },
];

const PROMPT_INSPIRATION = [
  "Mountain trekking with epic sunrise views",
  "Cultural city break with great food markets",
  "Relaxed beach escape with spa days",
  "Road trip stopping at hidden viewpoints",
];

function extractDaysFromPrompt(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*-?\s*day/i);
  if (m) return Math.min(Math.max(parseInt(m[1], 10), 1), 14);
  return null;
}

export function TripBuilderPage() {
  usePageTitle("Trip builder");
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const initialPrompt = params.get("prompt") || "";
  const initialDestination = params.get("destination") || "";

  // Hero search bar passes the user's full query as ?prompt. If the query
  // looks like a plain place name (short, no verbs), seed the destination
  // field too so the user doesn't have to retype it.
  const seededDestination =
    initialDestination ||
    (initialPrompt &&
    initialPrompt.length <= 40 &&
    !/\b(trek|trip|drive|hike|road|day|days|escape|tour|vibe|vacation)\b/i.test(
      initialPrompt
    )
      ? initialPrompt
      : "");

  // Hydrate from the saved draft only when no URL params override it — a
  // user arriving from "?prompt=Tokyo" expects Tokyo, not their last form.
  const draft = useMemo(
    () => (initialPrompt || initialDestination ? null : loadFormDraft(DRAFT_KEY)),
    [initialPrompt, initialDestination]
  );

  const [destination, setDestination] = useState(
    () => draft?.destination ?? seededDestination
  );
  const [prompt, setPrompt] = useState(
    () =>
      draft?.prompt ??
      (initialPrompt && seededDestination === initialPrompt ? "" : initialPrompt)
  );
  const [duration, setDuration] = useState(
    () => draft?.duration ?? extractDaysFromPrompt(initialPrompt) ?? 4
  );
  const [budget, setBudget] = useState(() => draft?.budget ?? "medium");
  const [travelStyle, setTravelStyle] = useState(
    () => draft?.travelStyle ?? "balanced"
  );
  const [interests, setInterests] = useState(() => draft?.interests ?? []);
  const [travelers, setTravelers] = useState(() => draft?.travelers ?? 2);
  const [transport, setTransport] = useState(() => draft?.transport ?? "mixed");
  const [food, setFood] = useState(() => draft?.food ?? "any");
  const [validationError, setValidationError] = useState(null);
  // Per-field validation errors (keyed by field name). Cleared as the user
  // edits so the UI doesn't keep yelling about a problem they've already
  // fixed.
  const [fieldErrors, setFieldErrors] = useState({});
  const [draftRestored, setDraftRestored] = useState(Boolean(draft));

  const destInputRef = useRef(null);

  // Auto-pull a destination out of the freeform prompt if we don't have one
  // yet (e.g. user clicked a hero chip like "Mountain trekking…" which is a
  // vibe, not a place — leave destination empty and prompt the user).
  useEffect(() => {
    if (!destination && initialPrompt) {
      destInputRef.current?.focus({ cursor: "end" });
    }
  }, [destination, initialPrompt]);

  const { isGenerating, progress, error, generate, cancel } = useTripPlanner();
  const { trips: savedTrips } = useSavedTrips();

  // Mirror the live form state into localStorage so a refresh doesn't wipe
  // the user's work-in-progress. Cleared when a trip generates successfully.
  // 250ms debounce so a quick "type-then-reload" still captures the input.
  const draftSnapshot = useMemo(
    () => ({
      destination,
      prompt,
      duration,
      budget,
      travelStyle,
      interests,
      travelers,
      transport,
      food,
    }),
    [destination, prompt, duration, budget, travelStyle, interests, travelers, transport, food]
  );
  useFormDraft(DRAFT_KEY, draftSnapshot, {
    debounceMs: 250,
    enabled: !isGenerating,
  });
  // Belt-and-braces: persist immediately on tab close/refresh in case the
  // debounce hasn't flushed yet. localStorage writes are synchronous so this
  // completes before unload.
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ value: draftSnapshot, savedAt: Date.now() })
        );
      } catch {
        // ignore quota / private-mode errors
      }
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [draftSnapshot]);

  const apiConfigured = isConfigured();

  const toggleInterest = (key) =>
    setInterests((curr) =>
      curr.includes(key) ? curr.filter((k) => k !== key) : [...curr, key]
    );

  const handleDestinationChange = (value) => {
    setDestination(value);
    // Clear stale errors as soon as the user starts typing again so the red
    // ring disappears on the next keystroke after a validation miss.
    setFieldErrors((prev) =>
      prev.destination ? { ...prev, destination: null } : prev
    );
    if (validationError) setValidationError(null);
  };

  const handlePromptChange = (value) => {
    setPrompt(value);
    setFieldErrors((prev) => (prev.prompt ? { ...prev, prompt: null } : prev));
  };

  // Run the full validation suite. Returns true when the form is safe to
  // submit; sets per-field errors as a side effect.
  const validateForm = () => {
    const errors = {};
    if (!destination.trim()) {
      errors.destination = "Please enter a destination to get started.";
    } else if (looksLikeInjection(destination)) {
      errors.destination = "Please enter a valid destination.";
    } else if (destination.trim().length > 80) {
      errors.destination = "Destination is too long. Keep it under 80 characters.";
    }
    if (prompt && looksLikeInjection(prompt)) {
      errors.prompt = "Please remove special characters from your vibe.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    setValidationError(null);
    if (!validateForm()) {
      // Scroll the destination card into view + focus the input so the user
      // sees the red ring and where to type.
      destInputRef.current?.focus();
      destInputRef.current?.input?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!apiConfigured) {
      setValidationError(
        "Gemini API key is missing. Set VITE_GEMINI_API_KEY in client/.env.local and restart the dev server."
      );
      return;
    }
    const result = await generate({
      destination: sanitizeText(destination),
      duration,
      budget,
      travelStyle,
      interests,
      travelers,
      transport,
      food,
      prompt: sanitizeText(prompt),
    });
    if (result?.tripId) {
      clearFormDraft(DRAFT_KEY);
      navigate(`/trip/${result.tripId}`);
    }
  };

  // Cmd/Ctrl + Enter generates from anywhere on the page. Skip inside textareas
  // where the user might still be composing — they'll Tab out first. Validation
  // happens inside handleGenerate so empty submissions still surface the
  // inline error rather than silently no-op'ing.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;
      const target = e.target;
      const isTextarea =
        target && target.tagName === "TEXTAREA" && target !== document.body;
      if (isTextarea) return;
      if (isGenerating) return;
      e.preventDefault();
      handleGenerate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, destination, duration, budget, travelStyle, interests, travelers, transport, food, prompt]);

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {isGenerating && (
          <GenerationLoader
            progress={progress}
            destination={destination.trim()}
          />
        )}
      </AnimatePresence>

      <div className="mb-10 max-w-3xl">
        <motion.span
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
        >
          AI Trip Studio
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-4xl sm:text-6xl font-bold text-fg leading-tight tracking-tight"
        >
          Plan your next escape.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-fg-muted text-lg leading-relaxed"
        >
          Tell us a few details — Gemini will design a day-by-day itinerary
          tailored to you.
        </motion.p>
      </div>

      {draftRestored && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-fg">
            <Icon icon="mdi:history" className="text-accent" />
            <span>We restored your last draft.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                clearFormDraft(DRAFT_KEY);
                setDestination("");
                setPrompt("");
                setDuration(4);
                setBudget("medium");
                setTravelStyle("balanced");
                setInterests([]);
                setTravelers(2);
                setTransport("mixed");
                setFood("any");
                setDraftRestored(false);
              }}
              className="text-xs font-semibold uppercase tracking-wider text-fg-muted hover:text-fg transition px-2 py-1 rounded"
            >
              Start fresh
            </button>
            <button
              type="button"
              onClick={() => setDraftRestored(false)}
              aria-label="Dismiss draft banner"
              title="Dismiss"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition"
            >
              <Icon icon="mdi:close" className="text-base" />
            </button>
          </div>
        </motion.div>
      )}

      {savedTrips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-fg-subtle">
              Continue from a recent trip
            </div>
            <button
              type="button"
              onClick={() => navigate("/saved-trips")}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {savedTrips.slice(0, 6).map((t) => (
              <motion.button
                key={t.tripId}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/trip/${t.tripId}`)}
                className="shrink-0 max-w-[240px] text-left rounded-xl bg-surface border border-line hover:border-accent/50 px-3.5 py-2.5 transition"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
                  {t.days?.length ?? "?"}-day · {t.input?.travelStyle ?? "trip"}
                </div>
                <div className="text-sm font-semibold text-fg truncate mt-0.5">
                  {t.tripTitle || t.input?.destination || "Untitled"}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {!apiConfigured && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-start gap-2"
        >
          <Icon icon="mdi:alert" className="text-lg mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Gemini API key not configured</div>
            <div className="opacity-90">
              Add <code className="font-mono">VITE_GEMINI_API_KEY</code> to{" "}
              <code className="font-mono">client/.env.local</code> and restart
              the dev server.
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl bg-surface border border-line surface-shadow p-6 sm:p-8 space-y-9"
      >
        {/* Destination + prompt */}
        <Section step="01" title="Where to?">
          <div className="grid sm:grid-cols-[1.2fr_1fr] gap-3">
            <div>
              <div
                className={`rounded-2xl border bg-surface-2 px-4 py-3 transition focus-within:border-accent ${
                  fieldErrors.destination
                    ? "border-red-500/70 ring-2 ring-red-500/30"
                    : "border-line"
                }`}
              >
                <label
                  htmlFor="trip-destination"
                  className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold"
                >
                  Destination
                </label>
                <Input
                  id="trip-destination"
                  ref={destInputRef}
                  variant="borderless"
                  placeholder="City, region, or country"
                  value={destination}
                  maxLength={80}
                  aria-invalid={Boolean(fieldErrors.destination)}
                  aria-describedby={
                    fieldErrors.destination ? "trip-destination-error" : undefined
                  }
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="!bg-transparent !text-fg !text-lg !p-0 placeholder:!text-fg-subtle"
                />
              </div>
              {fieldErrors.destination && (
                <p
                  id="trip-destination-error"
                  role="alert"
                  className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5"
                >
                  <Icon icon="mdi:alert-circle-outline" className="text-base" />
                  {fieldErrors.destination}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 transition">
              <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold">
                Days
              </label>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-fg tabular-nums">
                  {duration}
                </span>
                <span className="text-xs text-fg-subtle">
                  {duration === 1 ? "day" : "days"}
                </span>
              </div>
              <Slider
                min={1}
                max={14}
                value={duration}
                onChange={setDuration}
                tooltip={{ open: false }}
                className="!mt-1 !mb-0"
              />
            </div>
          </div>

          <div className="mt-4">
            <div
              className={`rounded-2xl border bg-surface-2 px-4 py-3 transition focus-within:border-accent ${
                fieldErrors.prompt
                  ? "border-red-500/70 ring-2 ring-red-500/30"
                  : "border-line"
              }`}
            >
              <label
                htmlFor="trip-vibe"
                className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold"
              >
                Your vibe (optional)
              </label>
              <Input.TextArea
                id="trip-vibe"
                variant="borderless"
                autoSize={{ minRows: 2, maxRows: 4 }}
                maxLength={280}
                placeholder="e.g. lots of viewpoints, hidden cafés, light hiking…"
                value={prompt}
                aria-invalid={Boolean(fieldErrors.prompt)}
                aria-describedby={fieldErrors.prompt ? "trip-vibe-error" : undefined}
                onChange={(e) => handlePromptChange(e.target.value)}
                className="!bg-transparent !text-fg !p-0 placeholder:!text-fg-subtle"
              />
            </div>
            {fieldErrors.prompt && (
              <p
                id="trip-vibe-error"
                role="alert"
                className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5"
              >
                <Icon icon="mdi:alert-circle-outline" className="text-base" />
                {fieldErrors.prompt}
              </p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROMPT_INSPIRATION.map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPrompt(p)}
                type="button"
                className="text-xs px-3 py-1.5 rounded-full bg-surface-2 border border-line text-fg-muted hover:text-fg hover:border-accent/40 transition"
              >
                {p}
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Travelers + budget */}
        <Section step="02" title="Travelers & budget">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-4">
              <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold">
                Travelers
              </label>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  disabled={travelers <= 1}
                  onClick={() =>
                    setTravelers((t) => Math.max(1, Number(t) - 1))
                  }
                  className="w-10 h-10 rounded-xl bg-surface border border-line text-fg hover:border-accent transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line"
                  aria-label="Decrease travelers"
                  title={travelers <= 1 ? "Minimum 1 traveler" : "Remove a traveler"}
                >
                  <Icon icon="mdi:minus" />
                </button>
                <div className="text-3xl font-bold text-fg tabular-nums">
                  {travelers}
                </div>
                <button
                  type="button"
                  disabled={travelers >= TRAVELERS_MAX}
                  onClick={() =>
                    setTravelers((t) => Math.min(TRAVELERS_MAX, Number(t) + 1))
                  }
                  className="w-10 h-10 rounded-xl bg-surface border border-line text-fg hover:border-accent transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line"
                  aria-label="Increase travelers"
                  title={
                    travelers >= TRAVELERS_MAX
                      ? `Maximum ${TRAVELERS_MAX} travelers`
                      : "Add a traveler"
                  }
                >
                  <Icon icon="mdi:plus" />
                </button>
              </div>
              {travelers >= TRAVELERS_MAX && (
                <p className="mt-2 text-[11px] text-fg-subtle text-center">
                  Maximum {TRAVELERS_MAX} travelers
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2 block">
                Budget tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUDGET_OPTS.map((b) => {
                  const active = budget === b.key;
                  return (
                    <motion.button
                      key={b.key}
                      type="button"
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setBudget(b.key)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        active
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      <Icon icon={b.icon} className="text-lg" />
                      <div className="text-sm font-semibold mt-1">
                        {b.label}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          active ? "text-accent-fg/80" : "text-fg-subtle"
                        }`}
                      >
                        {b.sub}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Travel style + interests */}
        <Section step="03" title="Style & interests">
          <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2 block">
            Travel style
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTS.map((s) => {
              const active = travelStyle === s.key;
              return (
                <motion.button
                  key={s.key}
                  type="button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTravelStyle(s.key)}
                  className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full border transition ${
                    active
                      ? "bg-accent text-accent-fg border-accent"
                      : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  <Icon icon={s.icon} className="text-base" /> {s.label}
                </motion.button>
              );
            })}
          </div>

          <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2 mt-6 block">
            Interests {interests.length > 0 && (
              <span className="text-accent/80 ml-1">({interests.length})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTS.map((i) => {
              const active = interests.includes(i.key);
              return (
                <motion.button
                  key={i.key}
                  type="button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
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
        </Section>

        {/* Transport + food */}
        <Section step="04" title="Transport & food">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2 block">
                Transport preference
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTS.map((t) => {
                  const active = transport === t.key;
                  return (
                    <motion.button
                      key={t.key}
                      type="button"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setTransport(t.key)}
                      className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full border transition ${
                        active
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      <Icon icon={t.icon} className="text-base" /> {t.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold mb-2 block">
                Food preference
              </label>
              <div className="flex flex-wrap gap-2">
                {FOOD_OPTS.map((f) => {
                  const active = food === f.key;
                  return (
                    <motion.button
                      key={f.key}
                      type="button"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setFood(f.key)}
                      className={`text-sm px-3.5 py-2 rounded-full border transition ${
                        active
                          ? "bg-accent text-accent-fg border-accent"
                          : "bg-surface-2 border-line text-fg-muted hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      {f.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2"
          >
            <Icon icon="mdi:alert-circle-outline" className="text-lg mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">We couldn't generate this trip</div>
              <div className="opacity-90">{error.message}</div>
            </div>
          </motion.div>
        )}

        {validationError && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-start gap-2"
          >
            <Icon icon="mdi:alert-circle-outline" className="text-lg mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <motion.div
            whileHover={{ scale: !isGenerating ? 1.02 : 1 }}
            whileTap={{ scale: !isGenerating ? 0.98 : 1 }}
            className="flex-1 min-w-[220px]"
          >
            <Button
              type="primary"
              size="large"
              block
              loading={isGenerating}
              // Stay clickable on invalid input so submitting surfaces the
              // per-field validation errors. The handler short-circuits with
              // `validateForm()` so the API is never called with bad input.
              disabled={isGenerating}
              onClick={handleGenerate}
              icon={!isGenerating && <Icon icon="mdi:auto-fix" />}
              className="!h-14 !text-base !font-semibold relative group"
            >
              {isGenerating ? "Generating your trip…" : "Generate trip with AI"}
              {!isGenerating && (
                <span className="hidden sm:inline-flex items-center gap-1 ml-3 text-[10px] font-mono opacity-70 tracking-wider">
                  ⌘
                  <Icon icon="mdi:keyboard-return" className="text-xs" />
                </span>
              )}
            </Button>
          </motion.div>
          {isGenerating && (
            <Button size="large" onClick={cancel} className="!h-14">
              Cancel
            </Button>
          )}
          {!isGenerating && (
            <Button
              size="large"
              onClick={() => navigate("/saved-trips")}
              icon={<Icon icon="mdi:bookmark-outline" />}
              className="!h-14"
            >
              My trips
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Section({ step, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-[0.3em] text-accent">
          STEP {step}
        </span>
        <span className="text-fg-subtle">·</span>
        <span className="text-sm font-semibold text-fg">{title}</span>
      </div>
      {children}
    </section>
  );
}
