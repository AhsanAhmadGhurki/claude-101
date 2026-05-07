import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Input, Button } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToNewsletter } from "../../services/newsletter/subscribe";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Trip Builder", to: "/builder" },
];

const RESOURCE_LINKS = [
  { label: "Pakistan visa info", to: "/resources/visa" },
  { label: "Best time to visit", to: "/resources/best-time" },
  { label: "Packing checklist", to: "/resources/packing" },
  { label: "Travel safety", to: "/resources/safety" },
];

// Social icons are intentionally omitted until we have real account URLs —
// href="#" placeholders are an accessibility / link-integrity smell. Restore
// this block as a list of { icon, label, href } when the accounts exist.

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e) => {
    e?.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await subscribeToNewsletter(email);
      setEmail("");
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-dismiss the success message so the footer doesn't end up with a
  // permanent green badge after a single sign-up.
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(false), 4000);
    return () => clearTimeout(id);
  }, [success]);

  return (
    <motion.footer
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1, margin: "-40px" }}
      className="border-t border-line bg-surface/40"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 grid gap-10 md:grid-cols-12">
        <motion.div variants={fadeUp} className="md:col-span-4">
          <div className="flex items-center gap-2 text-fg font-bold tracking-tight text-lg">
            <span className="inline-flex w-9 h-9 rounded-lg bg-accent text-accent-fg items-center justify-center">
              <Icon icon="mdi:compass-outline" className="text-2xl" />
            </span>
            Adventure<span className="text-accent">.AI</span>
          </div>
          <p className="text-sm text-fg-muted mt-3 leading-relaxed max-w-xs">
            Personal AI travel planner for the mountains, valleys, and cities of Pakistan. From a one-line idea to a day-by-day itinerary in seconds.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-2">
          <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-fg-subtle">
            Navigate
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-fg-muted hover:text-fg transition"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-2">
          <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-fg-subtle">
            Resources
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            {RESOURCE_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-fg-muted hover:text-fg transition"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-4">
          <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-fg-subtle">
            Trail Notes
          </h4>
          <p className="text-sm text-fg-muted mt-2 leading-relaxed">
            One short email a month — new destinations, route updates, and seasonal tips.
          </p>
          <form onSubmit={handleSubscribe} className="mt-3 flex gap-2" noValidate>
            <Input
              type="email"
              size="large"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
                if (success) setSuccess(false);
              }}
              disabled={submitting}
              aria-label="Email address for newsletter"
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? "newsletter-error"
                  : success
                  ? "newsletter-success"
                  : undefined
              }
              className="!bg-surface-2"
            />
            <motion.div
              whileHover={submitting ? undefined : { scale: 1.04 }}
              whileTap={submitting ? undefined : { scale: 0.96 }}
            >
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={submitting}
                disabled={
                  submitting ||
                  !email.trim() ||
                  // Format gate — keeps the button greyed out for clearly
                  // invalid input ("notanemail"). The service still throws
                  // on submit as a backstop, but disabling the button is
                  // the affordance users actually notice.
                  !/\S+@\S+\.\S+/.test(email)
                }
                icon={!submitting && <Icon icon="mdi:send-outline" />}
                className="!font-semibold"
              >
                {submitting ? "Subscribing…" : "Subscribe"}
              </Button>
            </motion.div>
          </form>
          {/* aria-live so screen readers announce success / error without
              the user having to refocus the input. */}
          <div aria-live="polite" aria-atomic="true" className="min-h-[18px]">
            <AnimatePresence mode="wait" initial={false}>
              {error ? (
                <motion.p
                  key="error"
                  id="newsletter-error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-red-400 mt-2 flex items-center gap-1.5"
                >
                  <Icon icon="mdi:alert-circle-outline" className="text-sm" />
                  {error}
                </motion.p>
              ) : success ? (
                <motion.p
                  key="success"
                  id="newsletter-success"
                  role="status"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5"
                >
                  <Icon icon="mdi:check-circle-outline" className="text-sm" />
                  You're on the list — see you in your inbox soon.
                </motion.p>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-fg-subtle mt-2"
                >
                  We don't share your email. Unsubscribe anytime.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={fadeUp}
        className="border-t border-line/60"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fg-subtle">
          <p>
            &copy; {new Date().getFullYear()} Adventure.AI — plan your next journey.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-fg transition">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-fg transition">
              Terms
            </Link>
            <span className="flex items-center gap-1.5">
              Made with <Icon icon="mdi:heart" className="text-accent" /> in Pakistan
            </span>
          </div>
        </div>
      </motion.div>
    </motion.footer>
  );
}
