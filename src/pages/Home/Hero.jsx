import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useTypewriter } from "../../hooks/useTypewriter";

const HERO_BG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80";

const ACTIONS = ["Wander", "Climb", "Roam", "Trek", "Drift"];

const COORDS = [
  {
    name: "HUNZA",
    temp: 16,
    icon: "mdi:weather-sunny",
    condition: "Clear",
    alt: "2,438m",
  },
  {
    name: "SKARDU",
    temp: -2,
    icon: "mdi:weather-snowy",
    condition: "Snow",
    alt: "2,228m",
  },
  {
    name: "NARAN",
    temp: 8,
    icon: "mdi:weather-partly-cloudy",
    condition: "Cloudy",
    alt: "2,409m",
  },
  {
    name: "FAIRY MEADOWS",
    temp: -5,
    icon: "mdi:snowflake",
    condition: "Snow",
    alt: "3,300m",
  },
];

const CHIPS = [
  { icon: "mdi:mountain", label: "Hunza" },
  { icon: "mdi:hiking", label: "Skardu trek" },
  { icon: "mdi:car-traction-control", label: "Karakoram road trip" },
];

const ITINERARY_LINES = [
  { day: "01", text: "Karimabad arrival · sunset at Baltit Fort" },
  { day: "02", text: "Eagle's Nest hike · dinner in Altit village" },
  { day: "03", text: "Attabad Lake boat ride · Khunjerab pass" },
];

function TypedLine({ day, text, startDelay }) {
  const [typed, done] = useTypewriter(text, 22, startDelay);
  return (
    <div className="flex items-start gap-3 font-mono text-[13px] leading-relaxed">
      <span className="text-accent text-[10px] font-bold tracking-[0.2em] pt-1 shrink-0">
        DAY {day}
      </span>
      <span className="text-fg/85">
        {typed}
        {!done && (
          <span className="inline-block w-[2px] h-3.5 bg-accent align-middle animate-pulse ml-0.5" />
        )}
      </span>
    </div>
  );
}

export function Hero() {
  const [prompt, setPrompt] = useState("");
  const [actionIdx, setActionIdx] = useState(0);
  const [coordIdx, setCoordIdx] = useState(0);
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.55, 0.85]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const id = setInterval(
      () => setActionIdx((i) => (i + 1) % ACTIONS.length),
      2200
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setCoordIdx((i) => (i + 1) % COORDS.length),
      2800
    );
    return () => clearInterval(id);
  }, []);

  const start = (value) => {
    const q = (value ?? prompt).trim();
    if (!q) return;
    navigate(`/builder?prompt=${encodeURIComponent(q)}`);
  };

  const longestAction = ACTIONS.reduce((a, b) =>
    a.length > b.length ? a : b
  );

  return (
    <section
      ref={heroRef}
      className="relative h-screen min-h-[780px] w-full overflow-hidden"
    >
      <motion.div
        style={{
          backgroundImage: `url(${HERO_BG})`,
          y: bgY,
          scale: bgScale,
        }}
        className="absolute inset-0 -top-20 bg-cover bg-center will-change-transform"
      />

      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-bg"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />

      <svg
        className="absolute inset-0 w-full h-full opacity-[0.09] mix-blend-screen pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <pattern
            id="topo"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 60 Q30 35 60 60 T120 60"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
            <path
              d="M0 30 Q30 5 60 30 T120 30"
              stroke="white"
              strokeWidth="0.4"
              fill="none"
            />
            <path
              d="M0 90 Q30 65 60 90 T120 90"
              stroke="white"
              strokeWidth="0.4"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo)" />
      </svg>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full grid lg:grid-cols-12 gap-12 items-center px-6 sm:px-10 max-w-7xl mx-auto pt-24 pb-20"
      >
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5"
          >
            <div className="relative w-12 h-12 shrink-0 rounded-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`icon-${coordIdx}`}
                  initial={{ opacity: 0, scale: 0.3, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.3, rotate: 90 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    animate={
                      COORDS[coordIdx].icon === "mdi:weather-sunny"
                        ? { rotate: 360 }
                        : COORDS[coordIdx].icon === "mdi:snowflake"
                        ? { rotate: 360 }
                        : COORDS[coordIdx].icon === "mdi:weather-snowy"
                        ? { rotate: [-6, 6, -6] }
                        : { x: [-2, 2, -2] }
                    }
                    transition={{
                      duration:
                        COORDS[coordIdx].icon === "mdi:weather-sunny"
                          ? 14
                          : COORDS[coordIdx].icon === "mdi:snowflake"
                          ? 22
                          : 4,
                      repeat: Infinity,
                      ease:
                        COORDS[coordIdx].icon === "mdi:weather-sunny" ||
                        COORDS[coordIdx].icon === "mdi:snowflake"
                          ? "linear"
                          : "easeInOut",
                    }}
                    className="flex items-center justify-center"
                  >
                    <Icon
                      icon={COORDS[coordIdx].icon}
                      className="text-accent text-[28px] drop-shadow-[0_0_10px_rgb(var(--accent)/0.5)]"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-1 leading-none">
              <div className="relative">
                <span className="invisible block text-sm font-bold tabular-nums leading-none whitespace-nowrap">
                  +16°
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`temp-${coordIdx}`}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 text-white text-sm font-bold tabular-nums leading-none"
                  >
                    {COORDS[coordIdx].temp > 0 ? "+" : ""}
                    {COORDS[coordIdx].temp}°
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="relative">
                <span className="invisible block text-[9px] font-mono font-bold tracking-[0.25em] leading-none whitespace-nowrap">
                  FAIRY MEADOWS · LIVE
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`name-${coordIdx}`}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 text-[9px] font-mono font-bold tracking-[0.25em] leading-none whitespace-nowrap"
                  >
                    <span className="text-white/85">
                      {COORDS[coordIdx].name}
                    </span>
                    <span className="text-accent mx-1.5">·</span>
                    <span className="text-white/45">LIVE</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-bold tracking-tighter leading-[0.9] drop-shadow-2xl select-none"
          >
            <motion.span
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] uppercase"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.02em",
                WebkitTextStroke: "1.25px rgba(255,255,255,0.92)",
                color: "transparent",
              }}
            >
              Plan less.
            </motion.span>

            <div className="relative inline-block my-2 sm:my-3">
              <div className="relative text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] text-accent leading-[0.9]">
                <span className="invisible block">{longestAction}</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ACTIONS[actionIdx]}
                    initial={{ opacity: 0, y: 50, filter: "blur(10px)", scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0)", scale: 1 }}
                    exit={{ opacity: 0, y: -50, filter: "blur(10px)", scale: 0.9 }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute left-0 top-0 inline-block"
                  >
                    <span className="relative inline-block">
                      {ACTIONS[actionIdx]}
                      <svg
                        viewBox="0 0 200 10"
                        preserveAspectRatio="none"
                        aria-hidden
                        className="absolute -bottom-1 left-0 w-full h-2 sm:h-2.5 pointer-events-none"
                      >
                        <motion.path
                          d="M2 6 Q35 1 70 5 T140 5 Q175 2 198 6"
                          fill="none"
                          stroke="rgb(var(--accent))"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{
                            pathLength: {
                              duration: 0.7,
                              delay: 0.25,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: { duration: 0.2, delay: 0.25 },
                          }}
                        />
                      </svg>
                    </span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <motion.span
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] uppercase"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontWeight: 400,
                letterSpacing: "0.02em",
                WebkitTextStroke: "1.25px rgba(255,255,255,0.92)",
                color: "transparent",
              }}
            >
              more.
            </motion.span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
            className="mt-6 flex items-center gap-3 text-[11px] font-mono tracking-[0.3em] text-white/55 uppercase"
          >
            <span className="text-white/70">
              {String(actionIdx + 1).padStart(2, "0")}
              <span className="text-white/30 mx-0.5">/</span>
              {String(ACTIONS.length).padStart(2, "0")}
            </span>
            <span className="h-px flex-1 max-w-16 bg-gradient-to-r from-accent/60 to-transparent" />
            <div className="flex gap-1.5">
              {ACTIONS.map((a, i) => (
                <motion.button
                  key={a}
                  type="button"
                  onClick={() => setActionIdx(i)}
                  aria-label={`Show ${a}`}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.8 }}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === actionIdx
                      ? "w-7 bg-accent"
                      : "w-1.5 bg-white/25 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed"
          >
            Tell us where your heart is pulling you. AI builds a day-wise
            adventure with packing lists and safety tips in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 max-w-xl relative"
          >
            <motion.div
              whileHover={{ scale: 1.01, boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5)" }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-bg-elevated border border-line surface-shadow-lg pl-6 pr-2 py-2 flex flex-col sm:flex-row gap-2 items-stretch focus-within:ring-2 focus-within:ring-accent/40 transition"
            >
              <div className="flex-1 flex flex-col py-1.5">
                <span className="text-[10px] font-bold tracking-[0.3em] text-fg-subtle uppercase">
                  Destination
                </span>
                <Input
                  variant="borderless"
                  placeholder="A vibe, a name, a sentence..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPressEnter={() => start()}
                  className="!bg-transparent !text-fg !text-base !p-0 placeholder:!text-fg-subtle"
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => start()}
                  icon={<Icon icon="mdi:airplane-takeoff" />}
                  className="!h-12 !px-6 !font-semibold sm:!self-center"
                >
                  Depart
                </Button>
              </motion.div>
            </motion.div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-[10px] text-white/60 uppercase tracking-[0.3em] mr-1"
              >
                Or try
              </motion.span>
              {CHIPS.map((c, i) => (
                <motion.button
                  key={c.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.85 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => start(c.label)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/85 hover:bg-white/20 hover:border-white/40 transition backdrop-blur"
                >
                  <Icon icon={c.icon} /> {c.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex lg:col-span-5 justify-end items-center">
          <motion.div
            initial={{ opacity: 0, y: 80, rotate: -6, scale: 0.85, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, rotate: 2, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 1.2,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ rotate: 0, scale: 1.04, y: -8 }}
            className="relative w-full max-w-[420px]"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-10 bg-accent/15 blur-3xl rounded-full -z-10"
            />

            <div className="relative rounded-3xl bg-bg-elevated border border-line shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <motion.div
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 2, delay: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Icon
                      icon="mdi:airplane-takeoff"
                      className="text-accent text-base"
                    />
                  </motion.div>
                  <span className="font-bold text-fg tracking-wider">
                    FLIGHT AI-2206
                  </span>
                </div>
                <span className="text-[10px] font-mono text-fg-subtle tracking-[0.25em]">
                  ADVENTURE.AI
                </span>
              </div>

              <div className="px-6 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-dashed border-line-strong">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.3em] text-fg-subtle">
                    DEPART
                  </div>
                  <div className="text-2xl font-bold text-fg mt-1 leading-none">
                    ANY
                  </div>
                  <div className="text-[10px] text-fg-muted mt-1.5 font-mono">
                    where you are
                  </div>
                </div>
                <div className="flex flex-col items-center px-2">
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon
                      icon="mdi:airplane"
                      className="text-2xl text-accent rotate-90"
                    />
                  </motion.div>
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent mt-1" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold tracking-[0.3em] text-fg-subtle">
                    DESTINATION
                  </div>
                  <div className="text-2xl font-bold text-accent mt-1 leading-none">
                    HUNZA
                  </div>
                  <div className="text-[10px] text-fg-muted mt-1.5 font-mono">
                    36.3167°N
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 grid grid-cols-3 gap-2 text-center border-b border-line">
                <div>
                  <div className="text-[9px] font-bold tracking-[0.3em] text-fg-subtle">
                    DAYS
                  </div>
                  <div className="text-base font-bold text-fg mt-0.5">03</div>
                </div>
                <div className="border-x border-line">
                  <div className="text-[9px] font-bold tracking-[0.3em] text-fg-subtle">
                    TYPE
                  </div>
                  <div className="text-base font-bold text-fg mt-0.5">TREK</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-[0.3em] text-fg-subtle">
                    TEMP
                  </div>
                  <div className="text-base font-bold text-fg mt-0.5">12°</div>
                </div>
              </div>

              <div className="border-t border-dashed border-line-strong mx-6" />

              <div className="px-6 py-5 space-y-3 relative">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Icon
                      icon="mdi:sparkles"
                      className="text-accent text-sm"
                    />
                  </motion.div>
                  <span className="text-[10px] font-bold tracking-[0.3em] text-fg-subtle">
                    AI ITINERARY · LIVE
                  </span>
                </div>
                {ITINERARY_LINES.map((line, i) => (
                  <TypedLine
                    key={line.day}
                    day={line.day}
                    text={line.text}
                    startDelay={1500 + i * 1300}
                  />
                ))}
              </div>


              <div className="px-6 py-3.5 border-t border-line bg-surface-2 flex items-center justify-between gap-4">
                <div className="flex items-end gap-[2px] h-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 1.8 + i * 0.03, duration: 0.3 }}
                      className="bg-fg block origin-bottom"
                      style={{
                        width: i % 4 === 0 ? "2.5px" : "1.5px",
                        height: `${50 + ((i * 37) % 50)}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-fg-muted tracking-[0.2em]">
                  2206-HZA
                </span>
              </div>
            </div>

          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/55 font-mono">
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/60"
        >
          <Icon icon="mdi:chevron-down" className="text-xl" />
        </motion.div>
      </motion.div>
    </section>
  );
}
