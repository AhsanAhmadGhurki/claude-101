import { motion } from "framer-motion";
import { scorePassword } from "../../services/auth/passwordStrength";

export function PasswordStrengthMeter({ password }) {
  const { label, color, percent } = scorePassword(password);
  const visible = Boolean(password);

  return (
    <div
      className="mt-1 transition-opacity"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
    >
      <div className="h-1.5 rounded-full bg-line/60 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${percent}%`, backgroundColor: color }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="h-full rounded-full"
        />
      </div>
      <div className="mt-1 text-xs text-fg-muted">
        {label && <span style={{ color }}>{label}</span>}
      </div>
    </div>
  );
}
