import crypto from "crypto";

// Random URL-safe token, returned to the user (in email link / cookie).
export const randomToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// SHA-256 — fast, deterministic. We hash before storing so a DB leak
// doesn't reveal valid reset / verify / refresh tokens. We don't need
// bcrypt's slowness here because the token itself is high-entropy.
export const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

// Constant-time string compare (use when verifying a CSRF or token value).
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
