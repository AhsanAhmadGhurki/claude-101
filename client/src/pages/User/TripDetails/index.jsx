import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Modal, App } from "antd";
import { Icon } from "@iconify/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WikiImage } from "../../../components/ui/WikiImage";
import { toWikiQuery } from "../../../lib/utils/toWikiQuery";
import { useAuth } from "../../../store/auth/authContext";
import { api, ApiError } from "../../../api/client";
import { PageLoader } from "../../../components/ui/PageLoader";
import { ErrorState } from "../../../components/ui/ErrorState";
import { usePageTitle } from "../../../hooks/usePageTitle";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function pickDayQueries(day, destination) {
  const queries = [];
  for (const name of day.activities ?? []) {
    const q = toWikiQuery(name);
    if (q && !queries.includes(q)) queries.push(q);
  }
  if (destination) {
    const city = destination.split(",")[0].trim();
    if (city && !queries.includes(city)) queries.push(city);
    if (destination !== city && !queries.includes(destination)) queries.push(destination);
  }
  return queries;
}

function pickDayPlace(day) {
  for (const name of day.activities ?? []) {
    const q = toWikiQuery(name);
    if (q) return q;
  }
  return day.title || null;
}

function pickCity(destination) {
  if (!destination) return null;
  return destination.split(",")[0].trim() || null;
}

function pickDayLabel(day) {
  return day.title || day.activities?.[0] || "";
}

// Synchronous local sources for the trip:
//   - localStorage["trip:<id>"]    written by TripBuilder on confirm
//   - sessionStorage["lastTrip"]   same-tab fallback
// Server-saved trips (24-char ObjectId) are loaded async via api.getTrip.
function loadLocalTrip(id) {
  if (id) {
    try {
      const direct = localStorage.getItem(`trip:${id}`);
      if (direct) return JSON.parse(direct);
    } catch {
      // Corrupt entry — fall through to next source.
    }
  }
  try {
    const session = sessionStorage.getItem("lastTrip");
    if (session) return JSON.parse(session);
  } catch {
    // ignore
  }
  return null;
}

export function TripDetailsPage({ mode = "owner" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();
  const { user } = useAuth();
  const { message } = App.useApp();
  const isShareView = mode === "share";

  const [trip, setTrip] = useState(null);
  // Page title tracks the loaded destination so the browser tab + history
  // entries are meaningful (otherwise every saved trip looks identical).
  usePageTitle(trip?.destination ? `${trip.destination} trip` : "Your trip");
  // Server identity for this trip — used to build the Share URL once
  // available. Populated from local cache, owner fetch, or save response.
  const [shareId, setShareId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Whether *this* trip exists on the server for the current user. True after
  // a successful api.saveTrip, or when we fetched it from the server by id.
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  // Open when an unauthenticated user clicks Save — prompts them to sign in
  // and preserves the current location so they return here afterwards.
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroImgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Resolves the trip from the URL. Three cases:
  //   - Share view (/trip/share/:shareId) → fetch the public endpoint, no auth.
  //   - ObjectId in /trip/:id              → owner fetch behind auth.
  //   - UUID / t_… in /trip/:id            → local builder draft.
  const loadTrip = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    if (isShareView) {
      try {
        const { trip: shared } = await api.getSharedTrip(routeId);
        setTrip(shared.payload ?? shared);
        setShareId(shared.shareId ?? routeId);
        // Recipients are not the owner — Save/Edit don't apply to them.
        setSaved(false);
        setLoading(false);
        return;
      } catch (err) {
        setLoadError(err);
        setLoading(false);
        return;
      }
    }

    const local = loadLocalTrip(routeId);
    if (local) {
      // Local-cached payload from /trip/<id> (often unwrapped from the
      // server response). Render immediately. If it carries a server id we
      // can mark it saved without an extra round-trip.
      setTrip(local.payload ?? local);
      setShareId(local.shareId ?? null);
      setSaved(Boolean(local.savedFromServer || local.serverId));
      setLoading(false);
      return;
    }

    if (routeId && OBJECT_ID_RE.test(routeId) && user) {
      try {
        const { trip: serverTrip } = await api.getTrip(routeId);
        setTrip(serverTrip.payload ?? serverTrip);
        setShareId(serverTrip.shareId ?? null);
        setSaved(true);
        setLoading(false);
        return;
      } catch (err) {
        setLoadError(err);
        setLoading(false);
        return;
      }
    }

    // No local cache and either anonymous or non-ObjectId id — nothing to
    // show. Treat as "not found" so the user gets a retry path back to the
    // builder rather than a blank page.
    setLoadError(
      new ApiError("We couldn't find this trip. It may have been removed.", {
        status: 404,
      })
    );
    setLoading(false);
  }, [routeId, user, isShareView]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleShare = async () => {
    // Recipients can only open a trip URL that maps to a server-stored
    // share token. Builder drafts and unsaved trips don't have one yet —
    // surface that explicitly instead of copying a URL nobody else can
    // open.
    if (!shareId) {
      message.warning(
        "Save this trip first to get a shareable link."
      );
      return;
    }
    const url = `${window.location.origin}/trip/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success({ content: "Share link copied to clipboard!", duration: 2 });
    } catch {
      message.error("Could not copy link");
    }
  };

  const handleSave = async () => {
    // Saving is gated behind sign-in. Anonymous users see a prompt with
    // a sign-in CTA; the post-signin redirect chain (signin → login-otp
    // → here) carries the trip URL via location.state.from so they land
    // right back on this page.
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }
    if (saved || saving || !trip) return;

    setSaving(true);
    try {
      const { trip: serverTrip } = await api.saveTrip({
        ...trip,
        duration: trip.days?.length,
      });
      setSaved(true);
      setShareId(serverTrip.shareId ?? null);
      // Cache server identity locally so a refresh on /trip/<localId> still
      // remembers this is saved — no extra round trip on next view.
      try {
        const cached = JSON.parse(
          localStorage.getItem(`trip:${routeId}`) || "null"
        );
        if (cached) {
          localStorage.setItem(
            `trip:${routeId}`,
            JSON.stringify({
              ...cached,
              serverId: serverTrip.id,
              shareId: serverTrip.shareId,
              savedFromServer: true,
            })
          );
        }
      } catch {
        // Storage write is best-effort.
      }
      message.success({ content: "Saved ✓", duration: 2 });
    } catch (err) {
      // Server enforces email verification for write operations. Send the
      // user to the verify-email flow instead of just toasting an error.
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        message.warning(
          "Verify your email to save trips. We'll send you to the verification page."
        );
        navigate("/verify-email", {
          state: { email: user?.email, returnTo: location.pathname },
        });
        return;
      }
      message.error(
        err instanceof ApiError && err.message
          ? `Save failed — ${err.message}`
          : "Save failed — try again"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    navigate(`/builder?prompt=${encodeURIComponent(trip?.prompt ?? "")}`);
  };

  const scrollToDay = (day) => {
    setActiveDay(day);
    document
      .getElementById(`day-${day}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <PageLoader label="Loading trip…" />;
  }

  if (loadError || !trip) {
    return (
      <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <ErrorState
          title="Couldn't load this trip"
          message={
            loadError?.message ||
            "We couldn't reach the server. Check your connection and try again."
          }
          onRetry={loadTrip}
          retrying={loading}
        />
        <div className="text-center mt-4">
          <Button type="link" onClick={() => navigate("/builder")}>
            Plan a new trip instead
          </Button>
        </div>
      </div>
    );
  }

  const goToSignIn = () => {
    setLoginPromptOpen(false);
    navigate("/signin", { state: { from: location } });
  };

  return (
    <div>
      <section ref={heroRef} className="relative h-[68vh] min-h-[560px] sm:min-h-[480px] w-full overflow-hidden">
        <motion.div
          style={{ y: heroImgY, scale: heroImgScale }}
          className="absolute inset-0 will-change-transform"
        >
          <WikiImage
            place={pickCity(trip.destination)}
            city={trip.region}
            queries={[
              trip.destination,
              pickCity(trip.destination),
              trip.region,
            ].filter(Boolean)}
            alt={trip.destination}
            label={trip.destination}
            category={trip.tripType?.toLowerCase()}
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="self-start flex flex-wrap gap-2"
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/30">
              {trip.tripType} · {trip.days.length}-Day Itinerary
            </span>
            {trip.budget && (
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-white bg-accent/30 backdrop-blur px-3 py-1.5 rounded-full border border-accent/50">
                {trip.budget.tier} · Rs {Math.round(trip.budget.total ?? trip.budget.totalUSD ?? 0).toLocaleString("en-PK")}
              </span>
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-5xl sm:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05] drop-shadow-2xl"
          >
            {trip.destination}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl leading-relaxed"
          >
            {trip.summary}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {[
              // Save/Edit are owner-only — hidden from recipients of a
              // share link, who don't own this trip.
              !isShareView && {
                key: "save",
                fn: handleSave,
                icon: saved ? "mdi:check-circle" : "mdi:bookmark-outline",
                label: saved ? "Saved ✓" : saving ? "Saving…" : "Save",
                disabled: saved || saving,
                loading: saving,
              },
              { key: "share", fn: handleShare, icon: "mdi:share-outline", label: "Share" },
              !isShareView && {
                key: "edit",
                fn: handleEdit,
                icon: "mdi:pencil-outline",
                label: "Edit",
              },
              { key: "print", fn: () => window.print(), icon: "mdi:printer-outline", label: "Print" },
            ].filter(Boolean).map((btn, i) => (
              <motion.div
                key={btn.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={btn.disabled ? undefined : { scale: 1.08, y: -3 }}
                whileTap={btn.disabled ? undefined : { scale: 0.92 }}
              >
                <Button
                  onClick={btn.fn}
                  disabled={btn.disabled}
                  loading={btn.loading}
                  icon={btn.loading ? undefined : <Icon icon={btn.icon} />}
                  size="large"
                  className={
                    saved && btn.key === "save"
                      ? "!bg-emerald-500/20 !border-emerald-400/50 !text-emerald-300 backdrop-blur !font-semibold disabled:!opacity-100 disabled:!cursor-default"
                      : "!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
                  }
                >
                  {btn.label}
                </Button>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64 }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
            >
              <Button
                onClick={() => navigate("/builder")}
                icon={<Icon icon="mdi:auto-fix" />}
                type="primary"
                size="large"
                className="!font-semibold"
              >
                New trip
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="px-6 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:sticky lg:top-28 space-y-6"
            >
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                  Itinerary
                </span>
                <h2 className="mt-2 text-2xl font-bold text-fg">
                  {trip.days.length} days
                </h2>
              </div>
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {trip.days.map((d, i) => (
                  <motion.button
                    key={d.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => scrollToDay(d.day)}
                    className={`text-left px-4 py-3 rounded-xl border transition shrink-0 lg:shrink ${
                      activeDay === d.day
                        ? "bg-accent text-accent-fg border-accent"
                        : "bg-surface text-fg-muted border-line hover:border-line-strong hover:text-fg"
                    }`}
                  >
                    <div
                      className={`text-xs font-bold tracking-[0.2em] ${
                        activeDay === d.day ? "text-accent-fg/80" : "text-accent"
                      }`}
                    >
                      DAY {String(d.day).padStart(2, "0")}
                    </div>
                    <div className="text-sm font-semibold mt-0.5 truncate max-w-[180px]">
                      {d.title}
                    </div>
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          </aside>

          <div className="lg:col-span-9 space-y-12">
            {trip.days.map((d, i) => {
              const reverse = i % 2 === 1;
              return (
                <motion.section
                  key={d.day}
                  id={`day-${d.day}`}
                  initial={{ opacity: 0, y: 80, scale: 0.94, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.1, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`grid md:grid-cols-2 gap-6 items-stretch ${
                    reverse ? "md:[&>:first-child]:order-2" : ""
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-3xl overflow-hidden h-72 md:h-auto border border-line surface-shadow"
                  >
                    <WikiImage
                      place={pickDayPlace(d)}
                      city={pickCity(trip.destination)}
                      queries={pickDayQueries(d, trip.destination)}
                      alt={d.title}
                      label={pickDayLabel(d)}
                      category={trip.tripType?.toLowerCase()}
                      width={1000}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="absolute inset-0 w-full h-full"
                      imgClassName="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="absolute top-5 left-5 text-7xl font-bold text-white/95 drop-shadow-lg leading-none"
                    >
                      {String(d.day).padStart(2, "0")}
                    </motion.div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
                  >
                    <span className="text-xs font-bold tracking-[0.3em] text-accent">
                      DAY {String(d.day).padStart(2, "0")}
                    </span>
                    <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
                      {d.title}
                    </h2>
                    {d.stay && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-muted">
                        <Icon icon="mdi:bed-outline" className="text-accent" />
                        <span>Stay · {d.stay}</span>
                      </div>
                    )}
                    <ul className="mt-6 space-y-3.5">
                      {(d.timeline ?? d.activities.map((a) => ({ time: "", label: a }))).map(
                        (t, k) => (
                          <motion.li
                            key={k}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ delay: 0.1 + k * 0.08, duration: 0.5 }}
                            className="flex gap-3 items-start text-fg/90 leading-relaxed"
                          >
                            <Icon
                              icon={
                                t.type === "meal"
                                  ? "mdi:silverware-fork-knife"
                                  : "mdi:checkbox-marked-circle-outline"
                              }
                              className="text-accent text-xl mt-0.5 shrink-0"
                            />
                            <div className="flex-1">
                              {t.time && (
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-subtle">
                                  {t.time}
                                  {t.duration ? ` · ${t.duration}` : ""}
                                </div>
                              )}
                              <span>{t.label}</span>
                            </div>
                          </motion.li>
                        )
                      )}
                    </ul>
                  </motion.div>
                </motion.section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto pb-24">
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                whileHover={{ rotate: -10, scale: 1.15 }}
                className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center"
              >
                <Icon icon="mdi:bag-personal-outline" className="text-2xl" />
              </motion.div>
              <h3 className="text-2xl font-bold text-fg">Packing list</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {trip.packingList.map((p, k) => (
                <motion.li
                  key={k}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: 0.05 + k * 0.04, duration: 0.4 }}
                  className="flex gap-2 items-center text-fg-muted text-sm"
                >
                  <Icon
                    icon="mdi:check-circle"
                    className="text-accent shrink-0"
                  />
                  {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.15 }}
                className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center"
              >
                <Icon icon="mdi:shield-alert-outline" className="text-2xl" />
              </motion.div>
              <h3 className="text-2xl font-bold text-fg">Travel tips</h3>
            </div>
            <ul className="space-y-3">
              {trip.tips.map((t, k) => (
                <motion.li
                  key={k}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: 0.05 + k * 0.04, duration: 0.4 }}
                  className="flex gap-3 items-start text-fg-muted text-sm leading-relaxed"
                >
                  <Icon
                    icon="mdi:lightbulb-outline"
                    className="text-accent shrink-0 mt-0.5 text-lg"
                  />
                  {t}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <Modal
        open={loginPromptOpen}
        title="Sign in to save trips"
        onOk={goToSignIn}
        onCancel={() => setLoginPromptOpen(false)}
        okText="Sign in"
        cancelText="Maybe later"
        okButtonProps={{ icon: <Icon icon="mdi:login" /> }}
      >
        <p className="text-fg-muted">
          You need an account to save trips to your library. Sign in and we&apos;ll
          bring you right back here.
        </p>
      </Modal>
    </div>
  );
}
