import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useAuth } from "../../../store/auth/authContext";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const buttonPop = {
  hidden: { opacity: 0, scale: 0.7, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function CTA() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.05]);
  const cardY = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const cardRotate = useTransform(scrollYProgress, [0, 0.5], [2, 0]);

  return (
    <section ref={ref} className="relative px-6 pb-24 sm:pb-28 max-w-7xl mx-auto">
      <motion.div
        style={{ y: cardY, rotate: cardRotate }}
        initial={{ opacity: 0, y: 80, scale: 0.92, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.01 }}
        className="relative rounded-3xl overflow-hidden bg-surface border border-line surface-shadow-lg"
      >
        <div className="grid lg:grid-cols-12 items-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-span-7 px-8 py-14 sm:px-14 sm:py-20"
          >
            <motion.span
              variants={fadeUp}
              className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent mb-5"
            >
              {user ? "Welcome back" : "Ready when you are"}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-4xl sm:text-5xl font-bold text-fg leading-tight tracking-tight"
            >
              {user ? (
                <>
                  Welcome back{firstName ? `, ${firstName}` : ""}.{" "}
                  <motion.span
                    className="text-accent inline-block"
                    whileInView={{ backgroundSize: ["0% 4px", "100% 4px"] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      backgroundImage:
                        "linear-gradient(rgb(var(--accent)), rgb(var(--accent)))",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "0 100%",
                      backgroundSize: "0% 4px",
                    }}
                  >
                    Ready for your next adventure?
                  </motion.span>
                </>
              ) : (
                <>
                  Your next adventure is{" "}
                  <motion.span
                    className="text-accent inline-block"
                    whileInView={{ backgroundSize: ["0% 4px", "100% 4px"] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      backgroundImage:
                        "linear-gradient(rgb(var(--accent)), rgb(var(--accent)))",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "0 100%",
                      backgroundSize: "0% 4px",
                    }}
                  >
                    one prompt away.
                  </motion.span>
                </>
              )}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-fg-muted text-lg max-w-lg leading-relaxed"
            >
              {user
                ? "Pick up where you left off, or start something new — your saved trips and dashboard are a click away."
                : "No accounts, no clutter. Type where you want to go and we'll handle the rest."}
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-wrap gap-3"
            >
              <motion.div
                variants={buttonPop}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.92 }}
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate("/builder")}
                  icon={<Icon icon="mdi:auto-fix" />}
                  className="!h-12 !px-7 !text-base !font-semibold"
                >
                  {user ? "Plan a new trip" : "Build my trip"}
                </Button>
              </motion.div>
              <motion.div
                variants={buttonPop}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.92 }}
              >
                <Button
                  size="large"
                  onClick={() => navigate(user ? "/saved-trips" : "/explore")}
                  icon={
                    user ? (
                      <Icon icon="mdi:bookmark-outline" />
                    ) : undefined
                  }
                  className="!h-12 !px-7 !text-base !font-semibold"
                >
                  {user ? "View saved trips" : "Explore routes"}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="hidden lg:block lg:col-span-5 relative h-full min-h-[420px] overflow-hidden">
            <motion.img
              src="https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?auto=format&fit=crop&w=1400&q=80"
              alt="Adventure ahead"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ y: imgY, scale: imgScale }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
