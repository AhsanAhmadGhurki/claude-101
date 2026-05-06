import { motion } from "framer-motion";

// Animated SVG checkmark for post-success states (e.g. "Email verified").
export function SuccessCheck({ size = 64 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      initial="hidden"
      animate="visible"
      role="img"
      aria-label="Success"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-accent"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" },
          },
        }}
      />
      <motion.path
        d="M20 33 L29 42 L46 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { delay: 0.35, duration: 0.45, ease: "easeOut" },
          },
        }}
      />
    </motion.svg>
  );
}
