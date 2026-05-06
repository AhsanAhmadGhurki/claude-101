// Unsplash search-photos endpoint. Browser-friendly with a Client-ID header.
// Set VITE_UNSPLASH_KEY in `.env.local` to enable. Without a key this provider
// no-ops and the resolver falls through to the next source.
//
// Get a key: https://unsplash.com/developers (Demo apps allow up to 50 req/hour)

const KEY = import.meta.env.VITE_UNSPLASH_KEY;
const cache = new Map();
const inflight = new Map();

export async function fetchUnsplashPhoto(query) {
  if (!KEY || !query || typeof query !== "string") return null;
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (cache.has(trimmed)) return cache.get(trimmed);
  if (inflight.has(trimmed)) return inflight.get(trimmed);

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    trimmed
  )}&per_page=1&orientation=landscape&content_filter=high`;

  const promise = fetch(url, {
    headers: { Authorization: `Client-ID ${KEY}` },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => data?.results?.[0]?.urls?.regular ?? null)
    .catch(() => null)
    .then((result) => {
      cache.set(trimmed, result);
      inflight.delete(trimmed);
      return result;
    });

  inflight.set(trimmed, promise);
  return promise;
}

export const isUnsplashEnabled = Boolean(KEY);
