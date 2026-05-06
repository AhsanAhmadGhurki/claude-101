import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { DESTINATIONS } from "../../../client/src/data/destinations";
import { DestinationImage } from "../../../client/src/components/ui/DestinationImage";

const [BIG, ...REST] = DESTINATIONS.slice(0, 5);

const cardHover = {
  rest: { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
  hover: {
    scale: 1.03,
    y: -8,
    boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const smallCardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.06,
    y: -6,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const arrowHover = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: 45, scale: 1.3, transition: { type: "spring", stiffness: 400, damping: 12 } },
};

export function FeaturedDestinations() {
  const navigate = useNavigate();

  const goPlan = (name) =>
    navigate(`/builder?prompt=${encodeURIComponent(`3-day trip to ${name}`)}`);

  return (
    <section className="relative px-6 py-24 sm:py-28 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
          >
            Where to next
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-4xl sm:text-5xl font-bold text-fg tracking-tight"
          >
            Hand-picked routes
          </motion.h2>
        </div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onClick={() => navigate("/explore")}
          whileHover={{ x: 8, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-sm text-fg-muted hover:text-accent transition flex items-center gap-1.5 font-medium"
        >
          See all destinations
          <Icon icon="mdi:arrow-right" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 h-auto md:h-[640px]">
        <motion.button
          initial={{ opacity: 0, y: 60, scale: 0.92, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          variants={cardHover}
          whileHover="hover"
          whileTap={{ scale: 0.97 }}
          onClick={() => goPlan(BIG.name)}
          className="md:col-span-6 md:row-span-2 relative rounded-3xl overflow-hidden group border border-line surface-shadow text-left"
        >
          <DestinationImage
            destination={BIG}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            className="absolute top-5 left-5 text-xs uppercase tracking-[0.3em] text-white bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/30"
          >
            Featured
          </motion.span>
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
            <motion.div
              variants={arrowHover}
              className="hidden sm:flex w-12 h-12 rounded-full bg-accent text-accent-fg items-center justify-center shrink-0"
            >
              <Icon icon="mdi:arrow-top-right" className="text-2xl" />
            </motion.div>
          </div>
        </motion.button>

        {REST.slice(0, 4).map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0, y: 60, scale: 0.9, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            variants={smallCardHover}
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            onClick={() => goPlan(d.name)}
            className="md:col-span-3 relative rounded-3xl overflow-hidden group border border-line surface-shadow text-left aspect-video md:aspect-auto"
          >
            <DestinationImage
              destination={d}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[10px] text-white/75 uppercase tracking-widest">
                {d.region}
              </span>
              <h3 className="text-xl font-bold">{d.name}</h3>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 300 }}
              className="absolute top-4 right-4 px-2 py-1 rounded-full bg-white/15 backdrop-blur border border-white/30 text-[10px] text-white"
            >
              {d.tag}
            </motion.div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
