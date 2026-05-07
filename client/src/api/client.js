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

// Loud, one-time misconfiguration check. The dev fallback above is great on a
// laptop but catastrophic on a deployed site: every request goes to a host
// that only exists on the developer's machine, the browser blocks it, and the
// only signal in the network tab is a generic "Failed to fetch". We surfapce a
// clear console.error so the cause is obvious in production builds.
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  const apiPointsAtLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(BASE_URL);
  if (!isLocalHost && apiPointsAtLocalhost) {
    console.error(
      "[api] VITE_API_URL is not set for this deployment.\n" +
        `The site is running on ${host} but is trying to reach ${BASE_URL}, ` +
        "which only exists on the developer's machine. Set VITE_API_URL in " +
        "your hosting provider's environment variables (e.g. " +
        "https://api.your-domain.com/api) and redeploy."
    );
  } else if (!import.meta.env.PROD) {
    console.info(`[api] Using API base URL: ${BASE_URL}`);
  }
}

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
  } catch (networkErr) {
    // fetch() rejects for both transport failures and CORS rejections — the
    // browser deliberately hides which one. The DevTools console will show
    // the underlying cause; we add a hint here so the user sees something
    // useful in the UI too.
    console.error(`[api] Request to ${BASE_URL}${path} failed:`, networkErr);
    throw new ApiError(
      "Cannot reach the server. Check that the API is running and that " +
        "CORS allows this origin.",
      { status: 0 }
    );
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

  // payload: { email, code }
  verifyEmail: (payload) =>
    request("/auth/verify-email", { method: "POST", body: payload }),
  requestVerifyEmail: (email) =>
    request("/auth/request-verify-email", { method: "POST", body: { email } }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  // payload: { email, code, password }
  resetPassword: (payload) =>
    request("/auth/reset-password", { method: "POST", body: payload }),

  // User (all behind auth)
  me: () => request("/users/me"),
  updateProfile: (payload) =>
    request("/users/me", { method: "PATCH", body: payload }),
  changePassword: (payload) =>
    request("/users/change-password", { method: "POST", body: payload }),

  // Dashboard summary — user + trip stats.
  dashboard: () => request("/dashboard"),

  // Trips — server-side persistence. Re-saving the same
  // (destination, duration, tripType) triple returns the existing record
  // with a refreshed timestamp instead of a duplicate (handled server-side).
  listTrips: () => request("/trips"),
  getTrip: (id) => request(`/trips/${encodeURIComponent(id)}`),
  // Public — does not require auth. Used by /trip/share/:shareId to render
  // an itinerary for any recipient with the share link.
  getSharedTrip: (shareId) =>
    request(`/trips/share/${encodeURIComponent(shareId)}`),
  saveTrip: (trip) => request("/trips", { method: "POST", body: trip }),
  deleteTrip: (id) =>
    request(`/trips/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
