import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const REVIEWS = [
  {
    name: "Ayesha R.",
    role: "Solo traveler · Karachi",
    avatar: "AR",
    rating: 5,
    quote:
      "Typed 'Skardu in autumn, mid-budget' and got a 4-day plan with Deosai timings, food stops, and a packing list. Saved me hours of Googling.",
    trip: "4 days · Skardu",
  },
  {
    name: "Hamza M.",
    role: "Family of four · Lahore",
    avatar: "HM",
    rating: 5,
    quote:
      "Used it to plan a Naran trip with kids. The pace setting was the difference — switched from packed to relaxed and the plan adjusted instantly.",
    trip: "5 days · Naran-Kaghan",
  },
  {
    name: "Sara K.",
    role: "Photographer · Islamabad",
    avatar: "SK",
    rating: 5,
    quote:
      "Best part: every spot had a real photo and the itinerary was actually walkable. The Hunza viewpoint timings were spot-on for golden hour.",
    trip: "6 days · Hunza Valley",
  },
  {
    name: "Bilal A.",
    role: "Road tripper · Multan",
    avatar: "BA",
    rating: 5,
    quote:
      "Asked for a Karakoram road trip and it routed me through Naran → Hunza → Khunjerab with sensible day stops. Felt like a friend who'd done the drive.",
    trip: "7 days · Road trip",
  },
];

const STATS = [
  { value: "12k+", label: "Trips planned" },
  { value: "60+", label: "Cities & valleys" },
  { value: "4.9", label: "Avg. rating" },
  { value: "<3s", label: "Plan time" },
];

const card = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  show: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Testimonials() {
  return (
    <section className="px-4 sm:px-8 max-w-7xl mx-auto py-16 sm:py-24 lg:py-28">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-xs font-bold uppercase tracking-[0.3em] text-accent"
          >
            From the trail
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 60, filter: "blur(5px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-4xl sm:text-5xl font-bold text-fg leading-tight tracking-tight"
          >
            What travelers are saying.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "-60px" }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-fg-muted text-lg mt-4 leading-relaxed"
          >
            Real itineraries, real trips. Here's what came back.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 lg:max-w-xl"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-surface border border-line px-4 py-3 text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-fg tabular-nums">
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={r.name}
            custom={i}
            variants={card}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1, margin: "-80px" }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="rounded-3xl bg-surface border border-line surface-shadow p-6 flex flex-col gap-4 relative overflow-hidden group"
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors" />
            <Icon
              icon="mdi:format-quote-open"
              className="text-accent text-3xl shrink-0"
            />
            <p className="text-sm leading-relaxed text-fg/90 flex-1">
              {r.quote}
            </p>
            <div className="flex items-center gap-0.5 text-accent">
              {Array.from({ length: r.rating }).map((_, idx) => (
                <Icon
                  key={idx}
                  icon="mdi:star"
                  className="text-base"
                />
              ))}
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-line">
              <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold tracking-wider shrink-0">
                {r.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-fg truncate">
                  {r.name}
                </div>
                <div className="text-[11px] text-fg-subtle truncate">
                  {r.role}
                </div>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono pt-1">
              {r.trip}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
