import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "savedTrips";

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSaved(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatSavedAt(ts) {
  if (!ts) return "Saved";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Saved";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
  });
}

function tripKey(trip, index) {
  return trip?.savedId ?? `${trip?.destination ?? "trip"}-${index}`;
}

export function SavedTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState(() => readSaved());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setTrips(readSaved());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const openTrip = (trip) => {
    sessionStorage.setItem("lastTrip", JSON.stringify(trip));
    const id = trip?.savedId ?? "saved";
    navigate(`/trip/${id}`);
  };

  const deleteTrip = (trip, index) => {
    const next = trips.filter((t, i) =>
      trip?.savedId ? t.savedId !== trip.savedId : i !== index
    );
    setTrips(next);
    writeSaved(next);
  };

  const clearAll = () => {
    if (!window.confirm("Remove all saved trips? This cannot be undone.")) return;
    setTrips([]);
    writeSaved([]);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-12"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            Your library
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
            Saved trips
          </h1>
          <p className="mt-2 text-fg-muted text-sm sm:text-base">
            {trips.length === 0
              ? "Trips you save will appear here."
              : `${trips.length} ${trips.length === 1 ? "trip" : "trips"} saved on this device.`}
          </p>
        </div>
        {trips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted hover:text-red-500 transition"
          >
            <Icon icon="mdi:trash-can-outline" className="text-base" />
            Clear all
          </button>
        )}
      </motion.header>

      {trips.length === 0 ? (
        <EmptyState onPlan={() => navigate("/builder")} />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence>
            {trips.map((trip, index) => (
              <motion.li
                key={tripKey(trip, index)}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl bg-surface border border-line p-5 flex flex-col gap-4 hover:border-accent/60 transition surface-shadow"
              >
                <button
                  type="button"
                  onClick={() => openTrip(trip)}
                  className="text-left flex-1 min-w-0 group"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                    {trip.tripType && <span>{trip.tripType}</span>}
                    {trip.tripType && trip.days?.length && <span>·</span>}
                    {trip.days?.length && <span>{trip.days.length}-day</span>}
                  </div>
                  <h2 className="mt-1.5 text-xl font-bold text-fg tracking-tight line-clamp-2 group-hover:text-accent transition">
                    {trip.destination ?? "Untitled trip"}
                  </h2>
                  {trip.summary && (
                    <p className="mt-2 text-sm text-fg-muted line-clamp-3 leading-relaxed">
                      {trip.summary}
                    </p>
                  )}
                </button>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
                  <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                    <Icon icon="mdi:bookmark-outline" className="text-sm" />
                    {formatSavedAt(trip.savedAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openTrip(trip)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition"
                    >
                      <Icon icon="mdi:open-in-new" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTrip(trip, index)}
                      aria-label="Delete saved trip"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      <Icon icon="mdi:trash-can-outline" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function EmptyState({ onPlan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="rounded-3xl border border-dashed border-line bg-surface/40 px-6 py-16 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
        <Icon icon="mdi:bookmark-outline" className="text-2xl" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-fg">Nothing saved yet</h2>
      <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
        Plan a trip and tap <span className="font-semibold text-fg">Save</span> on
        the itinerary page to keep it here.
      </p>
      <button
        type="button"
        onClick={onPlan}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-fg font-semibold hover:bg-accent-hover transition"
      >
        <Icon icon="mdi:auto-fix" />
        Plan a trip
      </button>
    </motion.div>
  );
}
