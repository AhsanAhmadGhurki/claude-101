import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message } from "antd";
import { Icon } from "@iconify/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WikiImage } from "../../../client/src/components/ui/WikiImage";
import { toWikiQuery } from "../../../client/src/lib/utils/toWikiQuery";

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

function readStoredTrip() {
  const stored = sessionStorage.getItem("lastTrip");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function TripDetailsPage() {
  const navigate = useNavigate();
  const [trip] = useState(readStoredTrip);
  const [activeDay, setActiveDay] = useState(1);
  const [saved, setSaved] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroImgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    if (!trip) navigate("/builder");
  }, [trip, navigate]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success({ content: "Link copied to clipboard!", duration: 2 });
    } catch {
      message.error("Could not copy link");
    }
  };

  const handleSave = () => {
    const stored = JSON.parse(localStorage.getItem("savedTrips") || "[]");
    stored.unshift(trip);
    localStorage.setItem("savedTrips", JSON.stringify(stored.slice(0, 20)));
    setSaved(true);
    message.success({ content: "Trip saved!", duration: 2 });
    setTimeout(() => setSaved(false), 2000);
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

  if (!trip) return null;

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
              {
                fn: handleSave,
                icon: saved ? "mdi:bookmark" : "mdi:bookmark-outline",
                label: saved ? "Saved" : "Save",
              },
              { fn: handleShare, icon: "mdi:share-outline", label: "Share" },
              { fn: handleEdit, icon: "mdi:pencil-outline", label: "Edit" },
              { fn: () => window.print(), icon: "mdi:printer-outline", label: "Print" },
            ].map((btn, i) => (
              <motion.div
                key={btn.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ scale: 1.08, y: -3 }}
                whileTap={{ scale: 0.92 }}
              >
                <Button
                  onClick={btn.fn}
                  icon={<Icon icon={btn.icon} />}
                  size="large"
                  className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
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
                  viewport={{ once: true, margin: "-100px" }}
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
                      viewport={{ once: true }}
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
                            viewport={{ once: true }}
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
            viewport={{ once: true, margin: "-80px" }}
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
                  viewport={{ once: true }}
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
            viewport={{ once: true, margin: "-80px" }}
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
                  viewport={{ once: true }}
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
    </div>
  );
}
