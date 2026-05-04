import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Trip Builder", to: "/builder" },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Footer() {
  return (
    <motion.footer
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="border-t border-line bg-surface/40"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-2 text-fg font-bold tracking-tight"
        >
          <span className="inline-flex w-8 h-8 rounded-lg bg-accent text-accent-fg items-center justify-center">
            <Icon icon="mdi:compass-outline" className="text-xl" />
          </span>
          Adventure<span className="text-accent">.AI</span>
        </motion.div>
        <motion.nav variants={fadeUp} className="flex items-center gap-6 text-sm text-fg-muted">
          {LINKS.map((l) => (
            <motion.div
              key={l.to}
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                to={l.to}
                className="hover:text-fg transition"
              >
                {l.label}
              </Link>
            </motion.div>
          ))}
        </motion.nav>
        <motion.p variants={fadeUp} className="text-xs text-fg-subtle">
          &copy; {new Date().getFullYear()} Adventure.AI — plan your next journey.
        </motion.p>
      </div>
    </motion.footer>
  );
}
