import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Input, Button, message } from "antd";
import { motion } from "framer-motion";

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

  const handleSubscribe = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      message.warning("Add your email first");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      message.error("That doesn't look like a valid email");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setEmail("");
    message.success("You're on the list. Trail notes coming soon.");
  };

  return (
    <motion.footer
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
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
          <form onSubmit={handleSubscribe} className="mt-3 flex gap-2">
            <Input
              type="email"
              size="large"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="!bg-surface-2"
            />
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={submitting}
                icon={<Icon icon="mdi:send-outline" />}
                className="!font-semibold"
              >
                Subscribe
              </Button>
            </motion.div>
          </form>
          <p className="text-[11px] text-fg-subtle mt-2">
            We don't share your email. Unsubscribe anytime.
          </p>
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
