import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { DESTINATIONS } from "../../data/destinations";
import { DestinationImage } from "../../components/ui/DestinationImage";

const [BIG, ...REST] = DESTINATIONS.slice(0, 5);

export function FeaturedDestinations() {
  const navigate = useNavigate();

  const goPlan = (name) =>
    navigate(`/builder?prompt=${encodeURIComponent(`3-day trip to ${name}`)}`);

  return (
    <section className="relative px-6 py-24 sm:py-28 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
          >
            Where to next
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="mt-3 text-4xl sm:text-5xl font-bold text-fg tracking-tight"
          >
            Hand-picked routes
          </motion.h2>
        </div>
        <button
          onClick={() => navigate("/explore")}
          className="text-sm text-fg-muted hover:text-accent transition flex items-center gap-1.5 font-medium"
        >
          See all destinations
          <Icon icon="mdi:arrow-right" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 h-auto md:h-[640px]">
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          onClick={() => goPlan(BIG.name)}
          className="md:col-span-6 md:row-span-2 relative rounded-3xl overflow-hidden group border border-line surface-shadow text-left"
        >
          <DestinationImage
            destination={BIG}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <span className="absolute top-5 left-5 text-xs uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/30">
            Featured
          </span>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
            <div>
              <span className="text-xs text-white/80 uppercase tracking-widest">
                {BIG.region}
              </span>
              <h3 className="text-3xl sm:text-5xl font-bold mt-1">
                {BIG.name}
              </h3>
              <p className="text-white/85 mt-2 max-w-md">{BIG.short}</p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-accent text-accent-fg items-center justify-center group-hover:scale-110 transition shrink-0">
              <Icon icon="mdi:arrow-top-right" className="text-2xl" />
            </div>
          </div>
        </motion.button>

        {REST.slice(0, 4).map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 + i * 0.06 }}
            onClick={() => goPlan(d.name)}
            className="md:col-span-3 relative rounded-3xl overflow-hidden group border border-line surface-shadow text-left aspect-video md:aspect-auto"
          >
            <DestinationImage
              destination={d}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] text-white/75 uppercase tracking-widest">
                {d.region}
              </span>
              <h3 className="text-xl font-bold">{d.name}</h3>
            </div>
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-white/15 backdrop-blur border border-white/30 text-[10px] text-white">
              {d.tag}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
