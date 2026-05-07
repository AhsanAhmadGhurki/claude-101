// Newsletter subscription — frontend-only placeholder.
//
// TODO(backend): wire this to a real endpoint once the newsletter pipeline
// exists. Two reasonable shapes for the real implementation:
//
//   1) Self-hosted: POST /api/newsletter/subscribe via the api client in
//      `client/src/api/client.js`, so cookies + CSRF are handled for free
//      and rate-limiting lives next to the rest of our endpoints.
//
//   2) Third-party (Mailchimp / ConvertKit / Beehiiv / Resend audiences):
//      proxy the call through the Express backend. Never embed the
//      provider's API key in the browser bundle.
//
// Component contract — keep this stable so Footer.jsx never has to change:
//   - Resolves on success
//   - Throws an Error whose `.message` is safe to surface to the user
const ARTIFICIAL_DELAY_MS = 600;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function subscribeToNewsletter(email) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) throw new Error("Add your email first");
  if (!EMAIL_RE.test(trimmed))
    throw new Error("That doesn't look like a valid email");

  // Frontend-only: deliberately no network call. The short delay lets the
  // submit animation breathe so the success state doesn't flash. Drop the
  // delay when this becomes a real network round-trip.
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
}
