import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ThemeToggle } from "../ui/ThemeToggle";

const linkClass = ({ isActive }) =>
  `relative text-sm font-medium transition ${
    isActive
      ? "text-fg after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-accent after:rounded-full"
      : "text-fg-muted hover:text-fg"
  }`;

const headerVariants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/builder", label: "Trip Builder" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-8 py-4">
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg"
          >
            Adventure<span className="text-accent">.AI</span>
          </Link>
        </motion.div>

        <nav className="hidden sm:flex gap-7">
          {NAV_LINKS.map((link, i) => (
            <motion.div
              key={link.to}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <NavLink to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          <ThemeToggle />
          <Button
            type="primary"
            onClick={() => navigate("/builder")}
            className="!hidden sm:!inline-flex !font-semibold"
          >
            Plan a trip
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
