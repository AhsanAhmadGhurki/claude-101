import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, DESTINATIONS } from "../../data/destinations";
import { DestinationImage } from "../../components/ui/DestinationImage";

export function ExplorePage() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const items = useMemo(() => {
    let list =
      active === "all"
        ? DESTINATIONS
        : DESTINATIONS.filter((d) => d.category === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q) ||
          d.tag.toLowerCase().includes(q)
      );
    }
    return list;
  }, [active, query]);

  const featured = items[0];
  const rest = items.slice(1);

  const goPlan = (name) =>
    navigate(`/builder?prompt=${encodeURIComponent(`3-day trip to ${name}`)}`);

  return (
    <div className="pt-32 pb-24">
      <section className="relative px-6 max-w-7xl mx-auto mb-12">
        <div className="grid lg:grid-cols-2 gap-10 items-end mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
            >
              Atlas · {DESTINATIONS.length} routes
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.08, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-5xl sm:text-7xl font-bold tracking-tight text-fg leading-[1.05]"
            >
              Find your
              <br />
              <span className="text-accent">terrain.</span>
            </motion.h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            <Input
              size="large"
              placeholder="Search destinations, regions, vibes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={
                <Icon
                  icon="mdi:magnify"
                  className="text-fg-subtle text-xl mr-2"
                />
              }
              className="!h-14 !rounded-2xl"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat, i) => {
                const isActive = active === cat.value;
                return (
                  <motion.button
                    key={cat.value}
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActive(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition ${
                      isActive
                        ? "bg-accent text-accent-fg border-accent"
                        : "bg-surface text-fg-muted border-line hover:border-line-strong hover:text-fg"
                    }`}
                  >
                    <Icon icon={cat.icon} /> {cat.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {featured && (
          <motion.button
            key={featured.id}
            initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02, y: -6, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => goPlan(featured.name)}
            className="relative w-full h-[420px] sm:h-[520px] rounded-3xl overflow-hidden group border border-line surface-shadow text-left"
          >
            <DestinationImage
              destination={featured}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/30 to-transparent" />
            <span className="absolute top-6 left-6 text-xs uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/30">
              {featured.tag}
            </span>
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-4 text-white">
              <div>
                <span className="text-xs uppercase tracking-widest text-white/80">
                  {featured.region}
                </span>
                <h2 className="text-4xl sm:text-6xl font-bold mt-1">
                  {featured.name}
                </h2>
                <p className="text-white/85 mt-3 max-w-xl text-lg">
                  {featured.short}
                </p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center gap-2 px-5 py-3 rounded-full bg-accent text-accent-fg font-semibold group-hover:scale-105 transition">
                Plan trip <Icon icon="mdi:arrow-right" />
              </div>
            </div>
          </motion.button>
        )}
      </section>

      <section className="px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {rest.length > 0 && (
            <motion.div
              layout
              className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:break-inside-avoid [&>*]:mb-5"
            >
              {rest.map((d, i) => (
                <motion.button
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05, y: -8, boxShadow: "0 25px 60px -15px rgba(0,0,0,0.4)", transition: { duration: 0.35, ease: "easeOut" } }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => goPlan(d.name)}
                  className={`relative w-full ${
                    i % 3 === 1 ? "h-[420px]" : "h-[320px]"
                  } rounded-2xl overflow-hidden group border border-line surface-shadow text-left block`}
                >
                  <DestinationImage
                    destination={d}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-white/15 backdrop-blur border border-white/30 text-white">
                    {d.tag}
                  </span>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] uppercase tracking-widest text-white/75">
                      {d.region}
                    </span>
                    <h3 className="text-2xl font-bold mt-0.5">{d.name}</h3>
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">
                      {d.short}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-24"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              <Icon
                icon="mdi:compass-off-outline"
                className="text-6xl mx-auto mb-4 text-fg-subtle"
              />
            </motion.div>
            <p className="text-lg text-fg-muted">Nothing matches that yet.</p>
            <button
              onClick={() => {
                setActive("all");
                setQuery("");
              }}
              className="mt-4 text-accent hover:underline font-medium"
            >
              Reset filters
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
