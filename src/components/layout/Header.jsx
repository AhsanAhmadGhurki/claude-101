import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const menuRef = useRef(null);

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      ref={menuRef}
      className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-fg"
          >
            Adventure<span className="text-accent">.AI</span>
          </Link>
        </motion.div>

        <nav className="hidden md:flex gap-7">
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
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <ThemeToggle />
          <Button
            type="primary"
            onClick={() => navigate("/builder")}
            className="!font-semibold !px-3 sm:!px-4 !whitespace-nowrap"
          >
            <span className="hidden sm:inline">Plan a trip</span>
            <span className="sm:hidden inline-flex items-center gap-1">
              <Icon icon="mdi:auto-fix" /> Plan
            </span>
          </Button>
          <motion.button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            whileTap={{ scale: 0.92 }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line bg-surface text-fg hover:bg-surface-hover transition"
          >
            <Icon
              icon={menuOpen ? "mdi:close" : "mdi:menu"}
              className="text-2xl"
            />
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-bg/95 backdrop-blur-md border-b border-line"
          >
            <nav className="flex flex-col px-4 py-3">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-3 rounded-lg text-base font-medium transition ${
                        isActive
                          ? "bg-accent/15 text-accent"
                          : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
