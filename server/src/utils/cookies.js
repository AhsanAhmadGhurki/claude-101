import { env } from "../config/env.js";

export const COOKIE_NAMES = Object.freeze({
  access: "auth_access",
  refresh: "auth_refresh",
  csrf: "csrf_token",
});

const baseOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  domain: env.cookieDomain,
  path: "/",
};

// Access token cookie — readable only by the server.
export const accessCookieOptions = (maxAgeMs) => ({
  ...baseOptions,
  maxAge: maxAgeMs,
});

// Refresh token cookie is scoped to /api/auth so it isn't sent on every API call.
export const refreshCookieOptions = (maxAgeMs) => ({
  ...baseOptions,
  path: "/api/auth",
  maxAge: maxAgeMs,
});

// CSRF cookie is intentionally NOT HttpOnly — the client reads it and echoes
// it back in the X-CSRF-Token header (double-submit pattern).
export const csrfCookieOptions = (maxAgeMs) => ({
  httpOnly: false,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  domain: env.cookieDomain,
  path: "/",
  maxAge: maxAgeMs,
});

export function clearAuthCookies(res) {
  res.clearCookie(COOKIE_NAMES.access, { ...baseOptions, maxAge: 0 });
  res.clearCookie(COOKIE_NAMES.refresh, {
    ...baseOptions,
    path: "/api/auth",
    maxAge: 0,
  });
  res.clearCookie(COOKIE_NAMES.csrf, {
    ...csrfCookieOptions(0),
    maxAge: 0,
  });
}
