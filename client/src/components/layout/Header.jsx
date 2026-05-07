import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Dropdown, Avatar, Modal } from "antd";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../store/auth/authContext";

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
  // Track Antd Dropdown open state so the trigger button can advertise
  // aria-expanded for screen readers.
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const menuRef = useRef(null);
  const { user, signout } = useAuth();
  // Controlled signout modal — replaces Modal.confirm so the actual signout
  // can only run from an explicit OK click. The dropdown menu item just
  // requests the modal; even if a stray keyboard event activates the item,
  // signout never fires without a deliberate confirmation.
  const [signoutModalOpen, setSignoutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const requestSignout = () => setSignoutModalOpen(true);

  const performSignout = async () => {
    setSigningOut(true);
    try {
      await signout();
      setSignoutModalOpen(false);
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  // Top-level menu.onClick with key dispatch is Antd's canonical and most
  // reliable pattern. Per-item onClick handlers can silently no-op in some
  // Antd versions when the menu is rendered via Dropdown's `menu` prop,
  // which is what was breaking the Dashboard item.
  const userMenu = {
    onClick: ({ key }) => {
      switch (key) {
        case "dashboard":
          navigate("/dashboard");
          break;
        case "saved-trips":
          navigate("/saved-trips");
          break;
        case "profile":
          navigate("/profile");
          break;
        case "signout":
          requestSignout();
          break;
      }
    },
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <Icon icon="mdi:view-dashboard-outline" />,
      },
      {
        key: "saved-trips",
        label: "Saved trips",
        icon: <Icon icon="mdi:bookmark-outline" />,
      },
      {
        key: "profile",
        label: "Profile",
        icon: <Icon icon="mdi:account-cog-outline" />,
      },
      { type: "divider" },
      {
        key: "signout",
        label: "Sign out",
        icon: <Icon icon="mdi:logout" />,
        danger: true,
      },
    ],
  };

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
          {user ? (
            <Dropdown
              menu={userMenu}
              placement="bottomRight"
              trigger={["click"]}
              open={accountMenuOpen}
              onOpenChange={setAccountMenuOpen}
            >
              <button
                type="button"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-1.5 py-1 hover:bg-surface-hover transition"
              >
                <Avatar size={28} className="!bg-accent !text-bg !font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
                <span className="hidden sm:inline pr-2 text-sm font-medium text-fg max-w-[8rem] truncate">
                  {user.name}
                </span>
              </button>
            </Dropdown>
          ) : (
            <Button
              onClick={() => navigate("/signin")}
              className="!font-semibold !whitespace-nowrap hidden sm:inline-flex"
            >
              Sign in
            </Button>
          )}
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
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
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
          <>
            {/* Click-outside backdrop. Stays under the panel and dims the
                page so the drawer reads as a modal layer. */}
            <motion.button
              key="mobile-backdrop"
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            />
            <motion.aside
              key="mobile-drawer"
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed top-0 right-0 z-50 h-full w-[min(20rem,85vw)] bg-bg border-l border-line shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-line">
                <span className="text-base font-bold tracking-tight text-fg">
                  Adventure<span className="text-accent">.AI</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-hover transition"
                >
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold px-3 mb-1">
                  Navigate
                </div>
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    // Start at 0.5 opacity (not 0) so the drawer's slide-in
                    // doesn't expose fully-invisible link labels for ~50ms
                    // before each one fades up. Stagger kept tight so the
                    // cascade still reads, just without the flicker.
                    initial={{ opacity: 0.5, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.18 }}
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

                <div className="my-3 border-t border-line" />

                <div className="text-[10px] uppercase tracking-[0.25em] text-fg-subtle font-semibold px-3 mb-1">
                  Account
                </div>
                {user ? (
                  <>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                      <Icon icon="mdi:view-dashboard-outline" /> Dashboard
                    </NavLink>
                    <NavLink
                      to="/saved-trips"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                      <Icon icon="mdi:bookmark-outline" /> Saved trips
                    </NavLink>
                    <NavLink
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                      <Icon icon="mdi:account-cog-outline" /> Profile
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        requestSignout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                      <Icon icon="mdi:logout" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/signin"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-3 rounded-lg text-base font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
                    >
                      Sign in
                    </NavLink>
                    <NavLink
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-3 rounded-lg text-base font-medium text-accent hover:bg-surface-hover"
                    >
                      Create account
                    </NavLink>
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Modal
        open={signoutModalOpen}
        title="Sign out?"
        onOk={performSignout}
        onCancel={() => setSignoutModalOpen(false)}
        okText="Sign out"
        cancelText="Stay signed in"
        okButtonProps={{ danger: true, loading: signingOut }}
        cancelButtonProps={{ disabled: signingOut }}
        mask={{ closable: !signingOut }}
      >
        You'll need to enter your credentials to sign back in.
      </Modal>
    </motion.header>
  );
}
