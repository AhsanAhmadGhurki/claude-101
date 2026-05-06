import { useEffect, useMemo, useState } from "react";
import { generateTripSync } from "../services/ai/generateTrip";

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useTripPlanner({ prompt, overrides, debounceMs = 200, enabled = true } = {}) {
  const debouncedPrompt = useDebouncedValue(prompt ?? "", debounceMs);

  const trip = useMemo(() => {
    if (!enabled) return null;
    if (!debouncedPrompt.trim() && !overrides?.destinationKey) return null;
    return generateTripSync({ prompt: debouncedPrompt, overrides });
  }, [enabled, debouncedPrompt, overrides]);

  const pending = (prompt ?? "") !== debouncedPrompt;
  return { trip, pending };
}
