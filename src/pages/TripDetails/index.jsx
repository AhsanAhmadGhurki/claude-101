import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message } from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const HERO_IMG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80";

const DAY_IMGS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80",
];

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

  useEffect(() => {
    if (!trip) navigate("/builder");
  }, [trip, navigate]);

  const handleShare = async () => {
    const url = `${window.location.origin}/builder?prompt=${encodeURIComponent(
      trip?.prompt ?? ""
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success("Trip link copied to clipboard");
    } catch {
      message.error("Could not copy link");
    }
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem("savedTrips") || "[]");
    saved.unshift(trip);
    localStorage.setItem("savedTrips", JSON.stringify(saved.slice(0, 20)));
    message.success("Trip saved");
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
      <section className="relative h-[68vh] min-h-[480px] w-full overflow-hidden">
        <div
          style={{ backgroundImage: `url(${HERO_IMG})` }}
          className="absolute inset-0 bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-bg" />

        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-20 max-w-7xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur self-start px-3 py-1.5 rounded-full border border-white/30"
          >
            {trip.tripType} · {trip.days.length}-Day Itinerary
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-5xl sm:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05] drop-shadow-2xl"
          >
            {trip.destination}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl leading-relaxed"
          >
            {trip.summary}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            <Button
              onClick={handleSave}
              icon={<Icon icon="mdi:bookmark-outline" />}
              size="large"
              className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
            >
              Save
            </Button>
            <Button
              onClick={handleShare}
              icon={<Icon icon="mdi:share-outline" />}
              size="large"
              className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
            >
              Share
            </Button>
            <Button
              onClick={() => window.print()}
              icon={<Icon icon="mdi:printer-outline" />}
              size="large"
              className="!bg-white/15 !border-white/30 !text-white hover:!bg-white/25 backdrop-blur !font-medium"
            >
              Print
            </Button>
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
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                  Itinerary
                </span>
                <h2 className="mt-2 text-2xl font-bold text-fg">
                  {trip.days.length} days
                </h2>
              </div>
              <nav className="flex lg:flex-col gap-2 overflow-x-auto">
                {trip.days.map((d) => (
                  <button
                    key={d.day}
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
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-12">
            {trip.days.map((d, i) => {
              const reverse = i % 2 === 1;
              return (
                <motion.section
                  key={d.day}
                  id={`day-${d.day}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  className={`grid md:grid-cols-2 gap-6 items-stretch ${
                    reverse ? "md:[&>:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative rounded-3xl overflow-hidden h-72 md:h-auto border border-line surface-shadow">
                    <img
                      src={DAY_IMGS[i % DAY_IMGS.length]}
                      alt={d.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-5 left-5 text-7xl font-bold text-white/95 drop-shadow-lg leading-none">
                      {String(d.day).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8">
                    <span className="text-xs font-bold tracking-[0.3em] text-accent">
                      DAY {String(d.day).padStart(2, "0")}
                    </span>
                    <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
                      {d.title}
                    </h2>
                    <ul className="mt-6 space-y-3.5">
                      {d.activities.map((a, k) => (
                        <li
                          key={k}
                          className="flex gap-3 items-start text-fg/90 leading-relaxed"
                        >
                          <Icon
                            icon="mdi:checkbox-marked-circle-outline"
                            className="text-accent text-xl mt-0.5 shrink-0"
                          />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto pb-24">
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon icon="mdi:bag-personal-outline" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-fg">Packing list</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {trip.packingList.map((p, k) => (
                <li
                  key={k}
                  className="flex gap-2 items-center text-fg-muted text-sm"
                >
                  <Icon
                    icon="mdi:check-circle"
                    className="text-accent shrink-0"
                  />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon icon="mdi:shield-alert-outline" className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-fg">Travel tips</h3>
            </div>
            <ul className="space-y-3">
              {trip.tips.map((t, k) => (
                <li
                  key={k}
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
        </div>
      </section>
    </div>
  );
}
