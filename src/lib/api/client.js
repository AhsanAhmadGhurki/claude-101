// Cookie-based API client.
//
// Auth flow:
// - All requests use `credentials: "include"` so HttpOnly auth cookies travel.
// - State-changing requests echo the `csrf_token` cookie value in the
//   `X-CSRF-Token` header (double-submit pattern).
// - On 401 with a missing/expired access token, we transparently call the
//   refresh endpoint once and retry. If refresh fails we surface 401 so the
//   AuthProvider can drop the user back to /signin.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE = "csrf_token";

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// Hooks so the AuthProvider can react to refresh failures (sign user out).
let onAuthFailure = null;
export function setAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

let refreshInFlight = null;
async function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      // Allow the next 401 to trigger a fresh refresh attempt.
      setTimeout(() => (refreshInFlight = null), 0);
    });
  }
  const res = await refreshInFlight;
  return res.ok;
}

async function rawRequest(path, { method = "GET", body, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };

  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) finalHeaders["X-CSRF-Token"] = csrf;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", {
      status: 0,
    });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      code: data?.code,
      details: data?.details,
    });
  }
  return data;
}

async function request(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    // Try one silent refresh on access-token expiry, then retry the request.
    if (err instanceof ApiError && err.status === 401 && !opts._retried) {
      const skipRefresh = path.startsWith("/auth/"); // don't refresh on auth flows
      if (!skipRefresh) {
        const ok = await refreshOnce();
        if (ok) return rawRequest(path, { ...opts, _retried: true });
        if (onAuthFailure) onAuthFailure();
      }
    }
    throw err;
  }
}

export const api = {
  // Auth
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  signin: (payload) => request("/auth/signin", { method: "POST", body: payload }),
  signout: () => request("/auth/signout", { method: "POST" }),
  refresh: () => request("/auth/refresh", { method: "POST" }),

  verifyEmail: (token) =>
    request("/auth/verify-email", { method: "POST", body: { token } }),
  requestVerifyEmail: (email) =>
    request("/auth/request-verify-email", { method: "POST", body: { email } }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload) =>
    request("/auth/reset-password", { method: "POST", body: payload }),

  // User (all behind auth)
  me: () => request("/users/me"),
  updateProfile: (payload) =>
    request("/users/me", { method: "PATCH", body: payload }),
  changePassword: (payload) =>
    request("/users/change-password", { method: "POST", body: payload }),

  // Demo protected endpoint (kept for back-compat)
  dashboard: () => request("/dashboard"),
};
