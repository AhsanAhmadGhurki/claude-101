import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { randomToken } from "./cryptoTokens.js";

// Short-lived access token — JWT so middleware can verify without a DB hit.
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, type: "access" },
    env.jwtSecret,
    { expiresIn: env.accessTtl }
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.type !== "access") throw new Error("Wrong token type");
  return payload;
}

// Refresh tokens are opaque random strings, not JWTs. We store a hash in DB
// so revocation is real (a compromised refresh can be invalidated server-side).
export function generateRefreshToken() {
  return randomToken(48);
}

export function refreshExpiryFromNow() {
  return new Date(Date.now() + env.refreshTtlDays * 24 * 60 * 60 * 1000);
}
