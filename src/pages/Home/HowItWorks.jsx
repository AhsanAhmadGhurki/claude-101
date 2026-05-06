import { useRef } from "react";
import { Icon } from "@iconify/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { DestinationImage } from "../../../client/src/components/ui/DestinationImage";
import { DESTINATIONS } from "../../../client/src/data/destinations";

const SKARDU = DESTINATIONS.find((d) => d.id === "skardu");

const STEPS = [
  {
    num: "01",
    icon: "mdi:lightbulb-on-outline",
    title: "Whisper your dream",
    text: "A destination, a vibe, or a sentence. AI reads between the lines.",
  },
  {
    num: "02",
    icon: "mdi:robot-happy-outline",
    title: "Get a real itinerary",
    text: "Day-wise plans, packing lists, safety tips — tailored to you.",
  },
  {
    num: "03",
    icon: "mdi:map-search-outline",
    title: "Refine, save, go",
    text: "Tweak any day, save it for later, share it with your crew.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const textReveal = {
  hidden: { opacity: 0, y: 60, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.92, filter: "blur(8px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      delay: i * 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
};

const iconHover = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: -12, scale: 1.25, transition: { type: "spring", stiffness: 400, damping: 12 } },
};

export function HowItWorks() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  return (
    <section ref={sectionRef} className="relative px-6 py-28 sm:py-32">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        <div className="lg:sticky lg:top-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.span
              variants={textReveal}
              className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent"
            >
              The Journey
            </motion.span>
            <motion.h2
              variants={textReveal}
              className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold text-fg leading-tight tracking-tight"
            >
              From a thought
              <br />
              to a trail.
            </motion.h2>
            <motion.p
              variants={textReveal}
              className="mt-5 text-fg-muted text-lg max-w-md leading-relaxed"
            >
              Three steps. No spreadsheets, no endless tabs, no decision fatigue.
            </motion.p>
          </motion.div>

          <motion.div
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            whileHover={{ scale: 1.04, rotate: -1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="hidden lg:block mt-10 relative w-full aspect-[5/4] rounded-3xl overflow-hidden border border-line surface-shadow"
          >
            <motion.div style={{ y: bgY }} className="absolute inset-0 -top-[10%] -bottom-[10%]">
              <DestinationImage
                destination={SKARDU}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-xs uppercase tracking-[0.3em] text-white/80 mb-1"
              >
                Most planned this month
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl font-bold"
              >
                Skardu Valley
              </motion.h3>
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 30px 80px -20px rgba(0,0,0,0.3)",
                transition: { duration: 0.35, ease: "easeOut" },
              }}
              className="group relative p-7 sm:p-8 rounded-3xl bg-surface border border-line hover:border-line-strong surface-shadow transition-colors overflow-hidden"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
                className="absolute -right-3 -top-6 text-[9rem] font-bold text-fg/[0.04] leading-none pointer-events-none select-none"
              >
                {step.num}
              </motion.span>

              <div className="relative flex items-start gap-5">
                <motion.div
                  variants={iconHover}
                  initial="rest"
                  whileHover="hover"
                  className="shrink-0 w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-fg transition"
                >
                  <Icon icon={step.icon} className="text-2xl" />
                </motion.div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-fg-subtle mb-2">
                    STEP {step.num}
                    <motion.span
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-px flex-1 bg-line origin-left"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-fg leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-fg-muted leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
