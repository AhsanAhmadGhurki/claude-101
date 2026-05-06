import bcrypt from "bcryptjs";

const COST = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Validate strength server-side. Mirrors the client indicator so the two
// agree on what counts as "strong enough".
export function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include a letter and a number";
  }
  return null;
}
