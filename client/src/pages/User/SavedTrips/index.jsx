import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { App, Modal } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useSavedTrips } from "../../../hooks/useSavedTrips";
import { usePageTitle } from "../../../hooks/usePageTitle";

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

const FILTERS = [
  { key: "all", label: "All trips" },
  { key: "favorites", label: "Favourites" },
];

export function SavedTripsPage() {
  usePageTitle("Saved trips");
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { trips, deleteTrip, clearAll, toggleFavorite } = useSavedTrips();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [clearOpen, setClearOpen] = useState(false);

  const visibleTrips = useMemo(() => {
    let list = trips;
    if (filter === "favorites") list = list.filter((t) => t.isFavorite);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) =>
        [t.tripTitle, t.input?.destination, t.summary]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
      );
    }
    return list;
  }, [trips, filter, query]);

  const handleClearAll = () => {
    clearAll();
    setClearOpen(false);
    message.success({ content: "All trips cleared", duration: 1.4 });
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4 mb-8"
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
              ? "Generated trips appear here automatically."
              : `${trips.length} ${trips.length === 1 ? "trip" : "trips"} in your library.`}
          </p>
        </div>
        {trips.length > 0 && (
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted hover:text-red-500 transition"
          >
            <Icon icon="mdi:trash-can-outline" className="text-base" />
            Clear all
          </button>
        )}
      </motion.header>

      {trips.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition ${
                  filter === f.key
                    ? "bg-accent text-accent-fg border-accent"
                    : "bg-surface border-line text-fg-muted hover:text-fg"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="rounded-full bg-surface border border-line px-4 py-2 flex items-center gap-2 focus-within:border-accent transition">
              <Icon icon="mdi:magnify" className="text-fg-subtle" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, destination, summary…"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <EmptyState onPlan={() => navigate("/builder")} />
      ) : visibleTrips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
          <Icon icon="mdi:filter-off-outline" className="text-3xl text-fg-subtle mx-auto" />
          <p className="mt-3 text-fg-muted">
            No trips match the current filter or search.
          </p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence>
            {visibleTrips.map((trip, index) => (
              <motion.li
                key={trip.tripId}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl bg-surface border border-line p-5 flex flex-col gap-4 hover:border-accent/60 transition surface-shadow"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/trip/${trip.tripId}`)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                    {trip.input?.travelStyle && <span>{trip.input.travelStyle}</span>}
                    {trip.input?.travelStyle && trip.days?.length ? <span>·</span> : null}
                    {trip.days?.length ? <span>{trip.days.length}-day</span> : null}
                    {trip.input?.budget ? <span>·</span> : null}
                    {trip.input?.budget && <span>{trip.input.budget}</span>}
                  </div>
                  <h2 className="mt-1.5 text-xl font-bold text-fg tracking-tight line-clamp-2 group-hover:text-accent transition">
                    {trip.tripTitle || trip.input?.destination || "Untitled trip"}
                  </h2>
                  {trip.input?.destination && trip.input.destination !== trip.tripTitle && (
                    <div className="mt-1 text-xs text-fg-muted flex items-center gap-1">
                      <Icon icon="mdi:map-marker-outline" />
                      {trip.input.destination}
                    </div>
                  )}
                  {trip.summary && (
                    <p className="mt-2 text-sm text-fg-muted line-clamp-3 leading-relaxed">
                      {trip.summary}
                    </p>
                  )}
                  {trip.totalEstimatedBudget && (
                    <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                      <Icon icon="mdi:wallet-outline" />
                      {trip.totalEstimatedBudget}
                    </div>
                  )}
                </button>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
                  <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                    <Icon icon="mdi:clock-outline" className="text-sm" />
                    {formatSavedAt(trip.savedAt || trip.generatedAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(trip.tripId)}
                      aria-label={trip.isFavorite ? "Unfavourite" : "Favourite"}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition ${
                        trip.isFavorite
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-fg-muted hover:text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <Icon
                        icon={trip.isFavorite ? "mdi:heart" : "mdi:heart-outline"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/trip/${trip.tripId}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition"
                    >
                      <Icon icon="mdi:open-in-new" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteTrip(trip.tripId);
                        message.success({ content: "Trip removed", duration: 1.4 });
                      }}
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

      <Modal
        open={clearOpen}
        title="Clear your library?"
        onOk={handleClearAll}
        onCancel={() => setClearOpen(false)}
        okText="Clear all"
        okButtonProps={{ danger: true }}
      >
        <p className="text-fg-muted">
          This permanently removes every saved trip from this device. You can't undo this.
        </p>
      </Modal>
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
      <h2 className="mt-5 text-xl font-bold text-fg">Nothing here yet</h2>
      <p className="mt-2 text-sm text-fg-muted max-w-md mx-auto leading-relaxed">
        Generate your first trip — it will be saved here automatically.
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
