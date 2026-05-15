// localStorage-backed trip store.
//
// Schema:
//   - "trips:index"        → JSON array of tripIds, most-recent first
//   - "trips:item:<id>"    → full SavedTrip JSON
//
// We split the index from each trip blob so the SavedTrips page can list
// thumbnails cheaply (one parse) and TripDetails can hydrate a single trip
// without rehydrating the whole library. It also keeps each entry under
// localStorage's 5MB ceiling — large trips would otherwise compete with each
// other in a single big array.

const INDEX_KEY = "trips:index";
const ITEM_PREFIX = "trips:item:";

// Storage events from the browser fire on *other* tabs only; we manually
// notify same-tab subscribers via this small pub-sub so the SavedTrips page
// re-renders when TripBuilder saves a new trip.
const subscribers = new Set();
function notify() {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      /* subscriber crashes shouldn't break others */
    }
  });
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function safeJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed = safeJSON(raw, []);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  } catch {
    // Quota / private-mode failure — non-fatal, the UI keeps working with
    // whatever was already persisted.
  }
}

function itemKey(id) {
  return `${ITEM_PREFIX}${id}`;
}

/**
 * Save (or overwrite) a generated trip. Always reorders the index so this
 * trip moves to the front.
 *
 * @returns the SavedTrip with `savedAt` set.
 */
export function saveGeneratedTrip(trip) {
  if (!trip || !trip.tripId) return null;
  const stored = {
    ...trip,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(itemKey(stored.tripId), JSON.stringify(stored));
  } catch (err) {
    // If we hit quota, drop the oldest non-favorite trip and try once more.
    if (err?.name === "QuotaExceededError") {
      const ids = readIndex();
      for (let i = ids.length - 1; i >= 0; i--) {
        const candidate = getTripById(ids[i]);
        if (candidate && !candidate.isFavorite) {
          removeTripInternal(ids[i]);
          break;
        }
      }
      try {
        localStorage.setItem(itemKey(stored.tripId), JSON.stringify(stored));
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }
  const ids = readIndex().filter((id) => id !== stored.tripId);
  ids.unshift(stored.tripId);
  writeIndex(ids);
  notify();
  return stored;
}

/**
 * Return all trips in newest-first order.
 */
export function listSavedTrips() {
  const ids = readIndex();
  const trips = [];
  let indexNeedsCleanup = false;
  for (const id of ids) {
    const trip = getTripById(id);
    if (trip) trips.push(trip);
    else indexNeedsCleanup = true;
  }
  // Drop dangling ids whose trip blob is gone (e.g. user cleared partial
  // storage from devtools).
  if (indexNeedsCleanup) {
    writeIndex(trips.map((t) => t.tripId));
  }
  return trips;
}

export function getTripById(id) {
  if (!id) return null;
  try {
    const raw = localStorage.getItem(itemKey(id));
    if (!raw) return null;
    const trip = JSON.parse(raw);
    return migrateTrip(trip);
  } catch {
    return null;
  }
}

// Defensive migration for trips written by older versions of the app. The
// current schema expects { tripId, input, days[], hotels[], travelTips[],
// packingList[], transportation{} }. Anything missing gets a safe default
// so the UI never crashes on legacy entries — we'd rather render a stub
// than wipe the user's library on upgrade.
function migrateTrip(trip) {
  if (!trip || typeof trip !== "object") return null;
  const safe = { ...trip };
  if (!safe.tripId) return null;
  if (!safe.input || typeof safe.input !== "object") {
    safe.input = {
      destination: safe.destination || "",
      duration: Array.isArray(safe.days) ? safe.days.length : 1,
      budget: "medium",
      travelStyle: "balanced",
      interests: [],
      travelers: 1,
      transport: "mixed",
      food: "any",
      prompt: safe.prompt || "",
    };
  }
  safe.days = Array.isArray(safe.days) ? safe.days : [];
  safe.hotels = Array.isArray(safe.hotels) ? safe.hotels : [];
  safe.travelTips = Array.isArray(safe.travelTips) ? safe.travelTips : [];
  safe.packingList = Array.isArray(safe.packingList) ? safe.packingList : [];
  safe.transportation =
    safe.transportation && typeof safe.transportation === "object"
      ? safe.transportation
      : { localTransport: "", interCity: "", tips: [] };
  if (!Array.isArray(safe.transportation.tips)) safe.transportation.tips = [];
  safe.isFavorite = Boolean(safe.isFavorite);
  return safe;
}

function removeTripInternal(id) {
  try {
    localStorage.removeItem(itemKey(id));
  } catch {
    /* ignore */
  }
}

export function removeTrip(id) {
  if (!id) return;
  removeTripInternal(id);
  const next = readIndex().filter((existing) => existing !== id);
  writeIndex(next);
  notify();
}

export function clearAllTrips() {
  const ids = readIndex();
  ids.forEach((id) => removeTripInternal(id));
  writeIndex([]);
  notify();
}

export function setFavorite(id, isFavorite) {
  const trip = getTripById(id);
  if (!trip) return null;
  const next = { ...trip, isFavorite: Boolean(isFavorite) };
  try {
    localStorage.setItem(itemKey(id), JSON.stringify(next));
  } catch {
    return null;
  }
  notify();
  return next;
}

/**
 * Replace the full trip blob (used by edit + revise flows). The tripId is
 * preserved so the URL stays stable.
 */
export function updateTrip(id, patch) {
  const trip = getTripById(id);
  if (!trip) return null;
  const next = { ...trip, ...patch, tripId: id };
  try {
    localStorage.setItem(itemKey(id), JSON.stringify(next));
  } catch {
    return null;
  }
  // Bump to front of the index so recently-edited trips surface first.
  const ids = readIndex().filter((existing) => existing !== id);
  ids.unshift(id);
  writeIndex(ids);
  notify();
  return next;
}
