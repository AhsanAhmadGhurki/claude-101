import { motion } from "framer-motion";

// Wraps content and shakes when `trigger` increments. We re-key on the trigger
// so framer-motion remounts the animation even for identical values.
export function Shake({ trigger = 0, children }) {
  return (
    <motion.div
      key={trigger}
      animate={
        trigger
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
