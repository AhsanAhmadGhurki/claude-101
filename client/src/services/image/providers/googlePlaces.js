// Google Places photo provider.
//
// Direct browser-to-Places-Web-Service calls fail CORS, so production
// integration needs ONE of:
//   1. A small server proxy that calls
//      https://maps.googleapis.com/maps/api/place/findplacefromtext/json
//      then https://maps.googleapis.com/maps/api/place/details/json (photo refs)
//      then https://maps.googleapis.com/maps/api/place/photo (binary image).
//      Set VITE_PLACES_PROXY_URL to that endpoint.
//   2. The Google Maps JavaScript SDK with the `places` library —
//      `new google.maps.places.PlacesService()` runs in the browser without
//      proxy.
//
// Until one of those is wired up this provider returns null so the resolver
// falls through to the next source.

const KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;
const PROXY = import.meta.env.VITE_PLACES_PROXY_URL;
const cache = new Map();
const inflight = new Map();

export async function fetchGooglePlacesPhoto(query) {
  if (!query || typeof query !== "string") return null;
  if (!KEY && !PROXY) return null;
  if (!PROXY) return null; // direct browser calls blocked by CORS

  const trimmed = query.trim();
  if (!trimmed) return null;
  if (cache.has(trimmed)) return cache.get(trimmed);
  if (inflight.has(trimmed)) return inflight.get(trimmed);

  const url = `${PROXY.replace(/\/$/, "")}/photo?query=${encodeURIComponent(
    trimmed
  )}`;

  const promise = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => data?.image_url ?? null)
    .catch(() => null)
    .then((result) => {
      cache.set(trimmed, result);
      inflight.delete(trimmed);
      return result;
    });

  inflight.set(trimmed, promise);
  return promise;
}

export const isGooglePlacesEnabled = Boolean(PROXY);
