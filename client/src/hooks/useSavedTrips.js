import { useEffect, useState, useCallback } from "react";
import {
  listSavedTrips,
  removeTrip,
  clearAllTrips,
  setFavorite,
  subscribe,
} from "../services/trips/storage";

// Reactive view of the local trip library. Stays in sync with writes from
// other components in the same tab (TripBuilder save, TripDetails delete,
// favorite toggle) via the storage module's pub-sub, and with writes from
// other tabs via the native `storage` event.

export function useSavedTrips() {
  const [trips, setTrips] = useState(() => listSavedTrips());

  const refresh = useCallback(() => {
    setTrips(listSavedTrips());
  }, []);

  useEffect(() => {
    const unsub = subscribe(refresh);
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith("trips:")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return {
    trips,
    favorites: trips.filter((t) => t.isFavorite),
    deleteTrip: (id) => removeTrip(id),
    clearAll: () => clearAllTrips(),
    toggleFavorite: (id, value) => {
      const trip = trips.find((t) => t.tripId === id);
      const next = typeof value === "boolean" ? value : !trip?.isFavorite;
      setFavorite(id, next);
    },
    refresh,
  };
}
