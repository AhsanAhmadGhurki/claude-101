import { fetchGooglePlacesPhoto } from "./providers/googlePlaces.js";
import { fetchWikipediaPhoto } from "./providers/wikipedia.js";
import { fetchUnsplashPhoto } from "./providers/unsplash.js";
import { pickCuratedPhoto } from "./providers/curated.js";

const STORAGE_KEY = "image-resolve-cache-v1";
const cache = new Map();
const inflight = new Map();

function loadCache() {
  if (cache.size > 0) return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.entries(stored).forEach(([k, v]) => cache.set(k, v));
  } catch {
    /* ignore */
  }
}

function persistCache() {
  try {
    const obj = {};
    cache.forEach((v, k) => {
      if (v?.image_url) obj[k] = v;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

function makeKey(input) {
  return JSON.stringify({
    place: input.place ?? null,
    city: input.city ?? null,
    queries: input.queries ?? null,
    category: input.category ?? null,
  });
}

function buildWikipediaTitles({ place, city, queries }) {
  if (Array.isArray(queries) && queries.length) return queries.filter(Boolean);
  if (!place) return city ? [city] : [];
  const titles = [place];
  if (city) titles.push(`${place}, ${city}`, city);
  return titles;
}

function buildPlacesQuery({ place, city }) {
  if (!place) return null;
  return city ? `${place} ${city}` : place;
}

function buildUnsplashQueries({ place, city, category }) {
  const out = [];
  if (place && city) out.push(`${place} ${city}`);
  else if (place) out.push(place);
  if (category && city) out.push(`${category} in ${city}`);
  return out;
}

export function peekCache(input) {
  loadCache();
  const key = makeKey(input);
  return cache.get(key) ?? null;
}

export async function resolveImage(input) {
  loadCache();
  const key = makeKey(input);
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    const placeName = input.place ?? input.queries?.[0] ?? input.city ?? null;

    // 1. Google Places — exact place
    const placesQ = buildPlacesQuery(input);
    if (placesQ) {
      const url = await fetchGooglePlacesPhoto(placesQ);
      if (url) {
        return {
          place_name: placeName,
          image_url: url,
          source: "google_places",
          type: "exact",
        };
      }
    }

    // 2. Wikipedia — authoritative for landmarks (free, no key)
    for (const title of buildWikipediaTitles(input)) {
      const url = await fetchWikipediaPhoto(title);
      if (url) {
        return {
          place_name: placeName,
          image_url: url,
          source: "wikipedia",
          type: "exact",
          query: title,
        };
      }
    }

    // 3. Unsplash search — "place + city"
    const unsplashQs = buildUnsplashQueries(input);
    for (let i = 0; i < unsplashQs.length; i++) {
      const url = await fetchUnsplashPhoto(unsplashQs[i]);
      if (url) {
        return {
          place_name: placeName,
          image_url: url,
          source: "unsplash",
          type: i === 0 ? "exact" : "category",
          query: unsplashQs[i],
        };
      }
    }

    // 4. Curated category fallback — never empty
    const url = pickCuratedPhoto({
      name: placeName,
      type: input.category,
      tags: input.tags,
    });
    return {
      place_name: placeName,
      image_url: url,
      source: "fallback",
      type: "placeholder",
    };
  })();

  inflight.set(key, promise);
  const result = await promise;
  cache.set(key, result);
  inflight.delete(key);
  persistCache();
  return result;
}
