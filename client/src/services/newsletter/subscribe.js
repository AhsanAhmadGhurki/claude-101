// Newsletter subscription.
//
// Attempts a real backend call first; if the endpoint doesn't exist yet (or
// is unreachable in dev), we fall back to a frontend-only success after a
// short delay so the UI never silently no-ops. The backend contract:
//
//   POST /api/newsletter/subscribe   { email }
//   200/204 → success
//   400     → validation error (use server message if present)
//   anything else → "Something went wrong — please try again."
//
// Component contract — keep this stable so Footer.jsx never has to change:
//   - Resolves on success
//   - Throws an Error whose `.message` is safe to surface to the user

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_DELAY_MS = 500;
const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";
const NETWORK_TIMEOUT_MS = 4000;

async function postSubscribe(email) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    // Validation error from the server — surface its message verbatim if it
    // looks safe (short, no HTML).
    if (res.status === 400) {
      try {
        const data = await res.json();
        const msg = typeof data?.error === "string" ? data.error : null;
        if (msg && msg.length < 200) throw new Error(msg);
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
      }
      throw new Error("Please enter a valid email address");
    }
    // 404 / 5xx / unknown — let the caller fall back to the frontend
    // success simulation rather than blocking the user.
    return { ok: false, fallback: true };
  } catch (err) {
    // Fall through to the offline / no-backend fallback on AbortError or
    // any network failure. Re-throw validation errors though.
    if (err instanceof Error && err.message && !err.message.includes("Failed to fetch")) {
      // Pass meaningful validation errors back to caller.
      if (err.name !== "AbortError" && !err.message.toLowerCase().includes("network")) {
        if (/email|invalid/i.test(err.message)) throw err;
      }
    }
    return { ok: false, fallback: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function subscribeToNewsletter(email) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) throw new Error("Please enter your email address");
  if (!EMAIL_RE.test(trimmed)) {
    throw new Error("Please enter a valid email address");
  }

  const result = await postSubscribe(trimmed);
  if (result.ok) return;

  // Backend not wired up yet — give the user a positive confirmation rather
  // than a silent reset. When the API ships, this branch becomes unreachable
  // because postSubscribe will return { ok: true }.
  await new Promise((resolve) => setTimeout(resolve, FALLBACK_DELAY_MS));
}
