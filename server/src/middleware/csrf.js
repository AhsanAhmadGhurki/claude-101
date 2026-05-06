import { ApiError } from "../utils/ApiError.js";
import { COOKIE_NAMES } from "../utils/cookies.js";
import { safeEqual } from "../utils/cryptoTokens.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Double-submit cookie CSRF check. The CSRF cookie is readable by the client
// (not HttpOnly); the client must echo it in the X-CSRF-Token header on
// state-changing requests. An attacker on a different origin cannot read the
// cookie, so they cannot forge a matching header.
export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Exempt unauthenticated entry points. These either establish the session
  // (signup/signin/refresh) or rely on a high-entropy single-use token in
  // the body (verify, reset, etc.) — CSRF adds nothing on top.
  const exempt = new Set([
    "/api/auth/signup",
    "/api/auth/signin",
    "/api/auth/refresh",
    "/api/auth/verify-email",
    "/api/auth/request-verify-email",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ]);
  const path = req.originalUrl.split("?")[0];
  if (exempt.has(path) || exempt.has(req.path)) return next();

  const cookie = req.cookies?.[COOKIE_NAMES.csrf];
  const header = req.get("x-csrf-token");

  if (!cookie || !header || !safeEqual(cookie, header)) {
    return next(new ApiError(403, "CSRF check failed", { code: "CSRF" }));
  }
  next();
}
