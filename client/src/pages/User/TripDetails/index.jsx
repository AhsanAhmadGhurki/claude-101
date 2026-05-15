import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal, Input, Dropdown, App } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { WikiImage } from "../../../components/ui/WikiImage";
import { ErrorState } from "../../../components/ui/ErrorState";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useTripPlanner } from "../../../hooks/useTripPlanner";
import { useScrollSpy } from "../../../hooks/useScrollSpy";
import {
  getTripById,
  removeTrip,
  setFavorite,
  updateTrip,
  subscribe,
} from "../../../services/trips/storage";
import {
  downloadTripAsJSON,
  downloadTripAsMarkdown,
  copyTripAsMarkdown,
  mapsUrlFor,
} from "../../../services/trips/export";
import { GenerationLoader } from "../../../components/ui/GenerationLoader";

function pickCity(destination) {
  if (!destination) return null;
  return destination.split(",")[0].trim() || null;
}

// Pull a numeric value out of cost strings like "$120", "USD 1,200–1,500",
// "Rs 25k". Returns null if no number is present so the caller can decide
// how to handle missing data. We only need ordering, not exact accounting.
function parseCostNumber(value) {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function TripDetailsPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { message } = App.useApp();

  const [trip, setTrip] = useState(() => getTripById(routeId));
  const [trackedRouteId, setTrackedRouteId] = useState(routeId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const heroRef = useRef(null);

  // Reload when the URL id changes (e.g. revise generates a new tripId and
  // navigates here). Derived-state keeps render pure.
  if (routeId !== trackedRouteId) {
    setTrackedRouteId(routeId);
    setTrip(getTripById(routeId));
  }

  usePageTitle(trip?.tripTitle || trip?.input?.destination || "Your trip");

  const {
    isGenerating,
    progress,
    error: aiError,
    regenerate,
    revise,
    cancel,
  } = useTripPlanner();

  // Stay in sync with storage edits coming from other components.
  useEffect(() => {
    const unsub = subscribe(() => {
      const next = getTripById(routeId);
      if (next) setTrip(next);
    });
    return unsub;
  }, [routeId]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroImgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const destination = trip?.input?.destination || "";
  const city = pickCity(destination);

  const dayIds = useMemo(
    () => (trip?.days ?? []).map((d) => `day-${d.day}`),
    [trip]
  );
  const activeDayId = useScrollSpy(dayIds);

  const totalActivities = useMemo(
    () =>
      (trip?.days ?? []).reduce(
        (sum, d) => sum + (d.activities?.length ?? 0),
        0
      ),
    [trip]
  );

  const handleRegenerate = useCallback(async () => {
    if (!trip) return;
    const next = await regenerate(trip);
    if (next?.tripId && next.tripId !== trip.tripId) {
      navigate(`/trip/${next.tripId}`, { replace: true });
    }
  }, [trip, regenerate, navigate]);

  const handleRevise = useCallback(async () => {
    if (!trip || !chatInput.trim()) return;
    const next = await revise(trip, chatInput.trim());
    setChatInput("");
    setChatOpen(false);
    if (next?.tripId && next.tripId !== trip.tripId) {
      navigate(`/trip/${next.tripId}`, { replace: true });
    }
  }, [trip, chatInput, revise, navigate]);

  const handleDelete = () => {
    if (!trip) return;
    removeTrip(trip.tripId);
    setDeleteOpen(false);
    message.success({ content: "Trip deleted", duration: 1.6 });
    navigate("/saved-trips", { replace: true });
  };

  const handleFavorite = () => {
    if (!trip) return;
    const next = setFavorite(trip.tripId, !trip.isFavorite);
    if (next) {
      setTrip(next);
      message.success({
        content: next.isFavorite ? "Added to favourites" : "Removed from favourites",
        duration: 1.4,
      });
    }
  };

  const handleShare = async () => {
    if (!trip) return;
    const url = `${window.location.origin}/trip/${trip.tripId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.tripTitle,
          text: trip.summary,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      message.success({ content: "Trip link copied", duration: 1.6 });
    } catch (err) {
      // AbortError fires when the user cancels the native share sheet — that
      // is not a failure; treat as a silent no-op.
      if (err?.name !== "AbortError") {
        message.error("Couldn't share this trip");
      }
    }
  };

  const handleCopyMarkdown = async () => {
    if (!trip) return;
    const ok = await copyTripAsMarkdown(trip);
    if (ok) {
      message.success({ content: "Trip copied as markdown", duration: 1.6 });
    } else {
      message.error("Couldn't copy. Try the download instead.");
    }
  };

  const updateDayTitle = (dayIndex, newTitle) => {
    if (!trip) return;
    const next = {
      ...trip,
      days: trip.days.map((d, i) =>
        i === dayIndex ? { ...d, title: newTitle } : d
      ),
    };
    const saved = updateTrip(trip.tripId, next);
    if (saved) setTrip(saved);
  };

  const scrollToDay = (day) => {
    document
      .getElementById(`day-${day}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!trip) {
    return (
      <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <ErrorState
          title="Couldn't find this trip"
          message="This trip isn't in your library. It may have been deleted or generated on another device."
          onRetry={() => navigate("/builder")}
          retryLabel="Plan a new trip"
        />
      </div>
    );
  }

  const moreMenu = {
    items: [
      {
        key: "share",
        label: "Share link",
        icon: <Icon icon="mdi:share-outline" />,
      },
      {
        key: "copy-md",
        label: "Copy as markdown",
        icon: <Icon icon="mdi:clipboard-text-outline" />,
      },
      {
        key: "export-md",
        label: "Download .md",
        icon: <Icon icon="mdi:language-markdown-outline" />,
      },
      {
        key: "export-json",
        label: "Download .json",
        icon: <Icon icon="mdi:code-json" />,
      },
      {
        key: "print",
        label: "Print",
        icon: <Icon icon="mdi:printer-outline" />,
      },
      { type: "divider" },
      {
        key: "delete",
        label: "Delete trip",
        icon: <Icon icon="mdi:trash-can-outline" />,
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      switch (key) {
        case "share":
          handleShare();
          break;
        case "copy-md":
          handleCopyMarkdown();
          break;
        case "export-md":
          downloadTripAsMarkdown(trip);
          break;
        case "export-json":
          downloadTripAsJSON(trip);
          break;
        case "print":
          window.print();
          break;
        case "delete":
          setDeleteOpen(true);
          break;
      }
    },
  };

  return (
    <div className="trip-page">
      <AnimatePresence>
        {isGenerating && (
          <GenerationLoader progress={progress} destination={destination} />
        )}
      </AnimatePresence>

      {/* Hero */}
      <section
        ref={heroRef}
        className="trip-hero relative h-[68vh] min-h-[560px] sm:min-h-[480px] w-full overflow-hidden"
      >
        <motion.div
          style={{ y: heroImgY, scale: heroImgScale }}
          className="absolute inset-0 will-change-transform"
        >
          <WikiImage
            place={city}
            city={destination}
            queries={[destination, city, trip.tripTitle].filter(Boolean)}
            alt={destination}
            label={destination}
            width={1600}
            sizes="100vw"
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-bg" />

        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="relative z-10 h-full flex flex-col justify-end px-6 pt-28 sm:pt-32 pb-12 sm:pb-20 max-w-7xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap gap-2"
          >
            <Badge>{trip.days.length}-day itinerary</Badge>
            {trip.input?.budget && <Badge>{trip.input.budget}</Badge>}
            {trip.input?.travelStyle && <Badge>{trip.input.travelStyle}</Badge>}
            {trip.input?.travelers ? (
              <Badge>
                {trip.input.travelers}{" "}
                {trip.input.travelers === 1 ? "traveler" : "travelers"}
              </Badge>
            ) : null}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] drop-shadow-2xl line-clamp-3"
          >
            {trip.tripTitle || destination}
          </motion.h1>
          {destination && trip.tripTitle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-2 text-white/80 text-xs sm:text-sm uppercase tracking-[0.3em] font-bold flex items-center gap-2"
            >
              <Icon icon="mdi:map-marker-radius-outline" className="text-base" />
              <span className="truncate">{destination}</span>
            </motion.div>
          )}
          {trip.summary && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.7 }}
              className="mt-4 text-base sm:text-xl text-white/90 max-w-2xl leading-relaxed line-clamp-4"
            >
              {trip.summary}
            </motion.p>
          )}

          {/* Primary actions stay visible; secondary actions collapse into
              a dropdown so the mobile layout stays clean. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-2 trip-hero-actions"
          >
            <ActionButton
              onClick={handleFavorite}
              icon={trip.isFavorite ? "mdi:heart" : "mdi:heart-outline"}
              ariaPressed={trip.isFavorite}
              tone={trip.isFavorite ? "love" : "neutral"}
            >
              <span className="hidden sm:inline">
                {trip.isFavorite ? "Favourited" : "Favourite"}
              </span>
              <span className="sm:hidden sr-only">
                {trip.isFavorite ? "Remove favourite" : "Favourite"}
              </span>
            </ActionButton>
            <ActionButton
              onClick={() => setChatOpen(true)}
              icon="mdi:chat-processing-outline"
            >
              <span className="hidden sm:inline">Refine with AI</span>
              <span className="sm:hidden">Refine</span>
            </ActionButton>
            <ActionButton
              onClick={handleRegenerate}
              icon="mdi:refresh"
              disabled={isGenerating}
            >
              <span className="hidden sm:inline">Regenerate</span>
              <span className="sm:hidden sr-only">Regenerate</span>
            </ActionButton>
            <Dropdown menu={moreMenu} trigger={["click"]} placement="bottomRight">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  icon={<Icon icon="mdi:dots-horizontal" />}
                  size="large"
                  aria-label="More actions"
                  className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
                >
                  <span className="hidden sm:inline">More</span>
                </Button>
              </motion.div>
            </Dropdown>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/builder")}
                icon={<Icon icon="mdi:auto-fix" />}
                type="primary"
                size="large"
                className="!font-semibold"
              >
                <span className="hidden sm:inline">New trip</span>
                <span className="sm:hidden">New</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {aiError && (
        <div className="px-6 max-w-7xl mx-auto mt-8 trip-hide-print">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
            <Icon
              icon="mdi:alert-circle-outline"
              className="text-lg mt-0.5 shrink-0"
            />
            <div className="flex-1">
              <div className="font-semibold">AI request failed</div>
              <div className="opacity-90">{aiError.message}</div>
            </div>
            <Button size="small" onClick={cancel}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <section className="px-6 max-w-7xl mx-auto mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Stat
            icon="mdi:wallet-outline"
            label="Estimated budget"
            value={trip.totalEstimatedBudget || "—"}
          />
          <Stat
            icon="mdi:calendar-clock-outline"
            label="Best time to visit"
            value={trip.bestTimeToVisit || "—"}
          />
          <Stat
            icon="mdi:format-list-checks"
            label="Total activities"
            value={totalActivities}
          />
          <Stat
            icon="mdi:bed-outline"
            label="Hotel options"
            value={trip.hotels?.length ?? 0}
          />
        </div>
      </section>

      <CostBreakdown trip={trip} />

      {/* Itinerary */}
      <section className="px-6 max-w-7xl mx-auto py-12 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
          <aside className="lg:col-span-3 trip-hide-print">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-28 space-y-5"
            >
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-accent font-bold">
                  Itinerary
                </span>
                <h2 className="mt-1 text-2xl font-bold text-fg">
                  {trip.days.length} {trip.days.length === 1 ? "day" : "days"}
                </h2>
              </div>
              <nav
                aria-label="Itinerary navigation"
                className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide -mx-1 px-1"
              >
                {trip.days.map((d) => {
                  const isActive = activeDayId === `day-${d.day}`;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => scrollToDay(d.day)}
                      aria-current={isActive ? "true" : undefined}
                      className={`text-left px-4 py-3 rounded-xl border transition shrink-0 lg:shrink min-w-[160px] lg:min-w-0 ${
                        isActive
                          ? "bg-accent text-accent-fg border-accent shadow-lg"
                          : "bg-surface text-fg-muted border-line hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-bold tracking-[0.2em] ${
                          isActive ? "text-accent-fg/80" : "text-accent"
                        }`}
                      >
                        DAY {String(d.day).padStart(2, "0")}
                      </div>
                      <div className="text-sm font-semibold mt-0.5 truncate max-w-[200px]">
                        {d.title}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </aside>

          <div className="lg:col-span-9 space-y-8 sm:space-y-10">
            {trip.days.map((d, i) => (
              <DayBlock
                key={`${trip.tripId}-${d.day}`}
                day={d}
                index={i}
                destination={destination}
                onEditTitle={(t) => updateDayTitle(i, t)}
              />
            ))}
          </div>
        </div>
      </section>

      <HotelsSection hotels={trip.hotels} />

      <TransportationSection transportation={trip.transportation} />

      <PackingAndTipsSection
        packingList={trip.packingList}
        travelTips={trip.travelTips}
      />

      <ReviseModal
        open={chatOpen}
        loading={isGenerating}
        value={chatInput}
        onChange={setChatInput}
        onCancel={() => setChatOpen(false)}
        onSubmit={handleRevise}
      />

      <Modal
        open={deleteOpen}
        title="Delete this trip?"
        onOk={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p className="text-fg-muted">
          This will remove the trip from your library. You can&apos;t undo this.
        </p>
      </Modal>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/30">
      {children}
    </span>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
  tone = "neutral",
  disabled,
  ariaPressed,
}) {
  const toneClass =
    tone === "danger"
      ? "!bg-red-500/15 !border-red-400/40 !text-red-200 hover:!bg-red-500/25"
      : tone === "love"
      ? "!bg-pink-500/25 !border-pink-300/50 !text-pink-100 hover:!bg-pink-500/35"
      : "!bg-white/15 !border-white/30 !text-white hover:!bg-white/25";
  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.05, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        icon={<Icon icon={icon} />}
        size="large"
        aria-pressed={ariaPressed}
        className={`${toneClass} backdrop-blur !font-medium disabled:!opacity-50`}
      >
        {children}
      </Button>
    </motion.div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-surface border border-line p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
        <Icon icon={icon} className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
          {label}
        </div>
        <div className="text-sm font-bold text-fg leading-snug mt-1 line-clamp-2">
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, icon, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Icon icon={icon} className="text-2xl" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-accent font-bold">
            {eyebrow}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </div>
  );
}

function CostBreakdown({ trip }) {
  // Heuristic per-day cost bar. We can't compute the exact total without
  // knowing the currency, but plotting parsed numerics gives a useful sense
  // of where the spend is concentrated. Falls back to an empty-state card
  // when no day has a numeric cost so the section never appears blank.
  const data = useMemo(() => {
    if (!trip?.days?.length) return null;
    const rows = trip.days.map((d) => ({
      day: d.day,
      cost: parseCostNumber(d.estimatedCost),
      label: d.estimatedCost || "—",
    }));
    const hasData = rows.some((r) => r.cost && r.cost > 0);
    if (!hasData) return { rows, max: 0, hasData: false };
    const max = Math.max(...rows.map((r) => r.cost ?? 0), 1);
    return { rows, max, hasData: true };
  }, [trip]);

  if (!data) return null;

  return (
    <section className="px-6 max-w-7xl mx-auto mt-10 trip-hide-print">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl bg-surface border border-line p-5 sm:p-6 surface-shadow"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:chart-bar" className="text-accent text-xl" />
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-fg-muted">
              Daily cost breakdown
            </h3>
          </div>
          {trip.totalEstimatedBudget && (
            <div className="text-xs text-fg-subtle">
              Total ≈{" "}
              <span className="text-fg font-semibold">
                {trip.totalEstimatedBudget}
              </span>
            </div>
          )}
        </div>
        {data.hasData ? (
          <>
            {/* Bars are direct children of the height-bounded row so the
                `height: X%` percentages resolve against the chart height
                instead of a 0-height column wrapper. */}
            <div className="flex items-end gap-2 sm:gap-3 h-32">
              {data.rows.map((r) => {
                const pct = r.cost ? Math.max(8, (r.cost / data.max) * 100) : 5;
                return (
                  <motion.div
                    key={r.day}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: r.day * 0.04 }}
                    style={{ height: `${pct}%`, transformOrigin: "bottom" }}
                    className={`flex-1 min-w-0 rounded-t-lg bg-gradient-to-t ${
                      r.cost
                        ? "from-accent/60 to-accent"
                        : "from-line to-line-strong"
                    }`}
                    title={r.label}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-3">
              {data.rows.map((r) => (
                <div
                  key={r.day}
                  className="flex-1 min-w-0 text-center text-[10px] uppercase tracking-wider text-fg-subtle font-semibold tabular-nums"
                >
                  D{r.day}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-fg-subtle italic">
            Cost breakdown unavailable
          </div>
        )}
      </motion.div>
    </section>
  );
}

function HotelsSection({ hotels }) {
  if (!hotels?.length) return null;
  return (
    <section className="px-6 max-w-7xl mx-auto pb-12 sm:pb-16">
      <SectionHeader
        eyebrow="Where to stay"
        title="Hotel suggestions"
        icon="mdi:bed-outline"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotels.map((h, i) => (
          <motion.div
            key={`${h.name}-${i}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="rounded-3xl bg-surface border border-line p-6 surface-shadow hover:border-accent/50 transition flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                <Icon icon="mdi:bed-outline" className="text-xl" />
              </div>
              {h.type && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
                  {h.type}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-fg leading-snug">{h.name}</h3>
            {h.priceRange && (
              <div className="mt-1 text-sm text-accent font-semibold">
                {h.priceRange}
              </div>
            )}
            {h.reason && (
              <p className="mt-3 text-sm text-fg-muted leading-relaxed flex-1">
                {h.reason}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TransportationSection({ transportation }) {
  if (
    !transportation ||
    (!transportation.localTransport &&
      !transportation.interCity &&
      !transportation.tips?.length)
  ) {
    return null;
  }
  return (
    <section className="px-6 max-w-7xl mx-auto pb-12 sm:pb-16">
      <SectionHeader
        eyebrow="Getting around"
        title="Transportation"
        icon="mdi:bus-clock"
      />
      <div className="grid md:grid-cols-2 gap-4">
        {transportation.localTransport && (
          <InfoCard
            icon="mdi:bus"
            title="Local transport"
            body={transportation.localTransport}
          />
        )}
        {transportation.interCity && (
          <InfoCard
            icon="mdi:airplane"
            title="Inter-city"
            body={transportation.interCity}
          />
        )}
      </div>
      {transportation.tips?.length > 0 && (
        <div className="mt-4 rounded-3xl bg-surface border border-line p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-accent font-bold mb-3">
            Tips
          </div>
          <ul className="space-y-2.5">
            {transportation.tips.map((t, i) => (
              <li key={i} className="flex gap-3 items-start text-fg/90">
                <Icon
                  icon="mdi:lightbulb-outline"
                  className="text-accent mt-0.5 shrink-0"
                />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div className="rounded-3xl bg-surface border border-line p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={icon} className="text-accent text-xl" />
        <div className="text-xs uppercase tracking-[0.3em] text-accent font-bold">
          {title}
        </div>
      </div>
      <p className="text-fg/90 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function PackingAndTipsSection({ packingList, travelTips }) {
  const [packed, setPacked] = useState(() => new Set());
  if (!packingList?.length && !travelTips?.length) return null;

  const togglePacked = (i) => {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section className="px-6 max-w-7xl mx-auto pb-24">
      <div className="grid md:grid-cols-2 gap-5">
        {packingList?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon icon="mdi:bag-personal-outline" className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-fg">Packing list</h3>
                <p className="text-xs text-fg-subtle mt-0.5">
                  Tap to check items off
                </p>
              </div>
              {packed.size > 0 && (
                <div className="text-xs text-fg-muted tabular-nums">
                  {packed.size}/{packingList.length}
                </div>
              )}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {packingList.map((p, i) => {
                const checked = packed.has(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => togglePacked(i)}
                      aria-pressed={checked}
                      className={`w-full flex items-center gap-2 text-left text-sm py-1.5 rounded-md transition ${
                        checked
                          ? "text-fg-subtle line-through"
                          : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      <Icon
                        icon={
                          checked
                            ? "mdi:check-circle"
                            : "mdi:circle-outline"
                        }
                        className={`shrink-0 ${
                          checked ? "text-accent" : "text-fg-subtle"
                        }`}
                      />
                      <span>{p}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {travelTips?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon icon="mdi:shield-alert-outline" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-fg">Travel tips</h3>
            </div>
            <ul className="space-y-3">
              {travelTips.map((t, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-start text-fg-muted text-sm leading-relaxed"
                >
                  <Icon
                    icon="mdi:lightbulb-outline"
                    className="text-accent shrink-0 mt-0.5 text-lg"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function ReviseModal({ open, loading, value, onChange, onCancel, onSubmit }) {
  return (
    <Modal
      open={open}
      title={
        <span className="flex items-center gap-2">
          <Icon icon="mdi:robot-happy-outline" className="text-accent" />
          Refine with AI
        </span>
      }
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <p className="text-fg-muted text-sm">
        Describe what you&apos;d like to change — Gemini will rewrite the whole
        itinerary while keeping the destination and duration the same.
      </p>
      <Input.TextArea
        autoSize={{ minRows: 3, maxRows: 6 }}
        maxLength={400}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (value.trim() && !loading) onSubmit();
          }
        }}
        placeholder="e.g. Make day 2 more relaxing, swap one museum for a hike, add more vegetarian food options…"
        className="!mt-4"
        autoFocus
      />
      <div className="mt-3 text-[11px] text-fg-subtle">
        Tip: ⌘/Ctrl + Enter to submit
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          icon={<Icon icon="mdi:auto-fix" />}
        >
          Rewrite itinerary
        </Button>
      </div>
    </Modal>
  );
}

function DayBlock({ day, index, destination, onEditTitle }) {
  const reverse = index % 2 === 1;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(day.title);
  const [trackedTitle, setTrackedTitle] = useState(day.title);

  // Reset the inline-edit draft when the underlying day title changes
  // (e.g. AI revise replaced the trip). Derived-state pattern.
  if (day.title !== trackedTitle) {
    setTrackedTitle(day.title);
    setDraft(day.title);
  }

  const placeForImage =
    day.activities?.find((a) => a.location)?.location || day.title;

  return (
    <motion.section
      id={`day-${day.day}`}
      initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`grid md:grid-cols-2 gap-6 items-stretch trip-day ${
        reverse ? "md:[&>:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-3xl overflow-hidden h-64 md:h-auto md:min-h-[400px] border border-line surface-shadow trip-day-image"
      >
        <WikiImage
          place={placeForImage}
          city={destination}
          queries={[placeForImage, destination].filter(Boolean)}
          alt={day.title}
          label={day.title}
          width={1000}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 w-full h-full"
          imgClassName="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-5 left-5 text-7xl font-bold text-white/95 drop-shadow-lg leading-none">
          {String(day.day).padStart(2, "0")}
        </div>
        {day.estimatedCost && (
          <div className="absolute bottom-4 right-5 left-5 flex justify-end">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white bg-black/40 backdrop-blur px-3 py-1.5 rounded-full font-bold border border-white/20">
              ≈ {day.estimatedCost}
            </span>
          </div>
        )}
      </motion.div>

      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl bg-surface border border-line surface-shadow p-6 sm:p-7"
      >
        <span className="text-xs font-bold tracking-[0.3em] text-accent">
          DAY {String(day.day).padStart(2, "0")}
        </span>
        {editing ? (
          <Input
            value={draft}
            autoFocus
            maxLength={120}
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={() => {
              onEditTitle(draft.trim() || day.title);
              setEditing(false);
            }}
            onBlur={() => {
              onEditTitle(draft.trim() || day.title);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(day.title);
                setEditing(false);
              }
            }}
            className="!mt-1 !text-2xl !font-bold"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Click to rename"
            className="group w-full text-left mt-1 text-2xl sm:text-3xl font-bold text-fg tracking-tight hover:text-accent transition flex items-center gap-2"
          >
            <span className="truncate">{day.title}</span>
            <Icon
              icon="mdi:pencil-outline"
              className="text-base text-fg-subtle opacity-0 group-hover:opacity-100 transition shrink-0"
            />
          </button>
        )}

        <ol className="mt-6 space-y-3 trip-timeline">
          {day.activities?.length === 0 && (
            <li className="text-sm text-fg-subtle italic">
              No activities returned for this day.
            </li>
          )}
          {day.activities?.map((a, k) => (
            <ActivityRow
              key={k}
              activity={a}
              destination={destination}
              isLast={k === day.activities.length - 1}
            />
          ))}
        </ol>

        {day.foodRecommendations?.length > 0 && (
          <div className="mt-6 rounded-2xl bg-surface-2 border border-line/70 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon
                icon="mdi:silverware-fork-knife"
                className="text-accent text-lg"
              />
              <div className="text-xs uppercase tracking-[0.25em] text-accent font-bold">
                Eat here
              </div>
            </div>
            <ul className="space-y-1.5">
              {day.foodRecommendations.map((f, k) => (
                <li
                  key={k}
                  className="flex gap-2 items-start text-sm text-fg/90 leading-relaxed"
                >
                  <Icon
                    icon="mdi:circle-small"
                    className="text-accent shrink-0 text-xl -mt-0.5"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}

function ActivityRow({ activity, destination, isLast }) {
  const mapsUrl = mapsUrlFor(activity.location, destination);
  return (
    <li className="relative pl-10">
      {/* Vertical timeline */}
      <span
        aria-hidden
        className={`absolute left-[15px] top-7 bottom-0 w-px bg-line ${
          isLast ? "hidden" : ""
        }`}
      />
      <span
        aria-hidden
        className="absolute left-2 top-2.5 w-3 h-3 rounded-full bg-accent ring-4 ring-surface"
      />
      <div className="rounded-2xl bg-surface-2 border border-line/70 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {activity.time && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-subtle">
              {activity.time}
            </span>
          )}
          {activity.estimatedCost && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              · {activity.estimatedCost}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-base font-semibold text-fg">
          {activity.activity}
        </div>
        {activity.location && (
          <div className="text-xs text-fg-muted flex items-center gap-1 mt-1">
            <Icon icon="mdi:map-marker-outline" className="text-sm" />
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition flex items-center gap-1"
              >
                {activity.location}
                <Icon icon="mdi:open-in-new" className="text-[11px]" />
              </a>
            ) : (
              <span>{activity.location}</span>
            )}
          </div>
        )}
        {activity.description && (
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            {activity.description}
          </p>
        )}
      </div>
    </li>
  );
}
