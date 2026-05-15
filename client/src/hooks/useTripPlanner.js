import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateTripPlan,
  regenerateTripPlan,
  reviseTripPlan,
  GeminiError,
} from "../services/ai/generateTripPlan";
import { saveGeneratedTrip } from "../services/trips/storage";

// Drives AI trip generation from the builder/details pages. Owns:
//   - status: idle | generating | success | error
//   - the currently-generating request (cancelled if the hook unmounts)
//   - retry / regenerate / revise affordances
//
// Generated trips are persisted via the trip storage module so the UI can
// navigate to the details view by tripId and reopen them later.

export function useTripPlanner() {
  const [status, setStatus] = useState("idle");
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);
  const progressTimer = useRef(null);

  // Cleanup any in-flight request when the component using the hook
  // unmounts mid-generation so we don't update state on a dead tree.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const startProgressAnimation = () => {
    // Fake progress bar that crawls up to 95% while the request is in
    // flight, then snaps to 100% on success. Pure UI nicety — Gemini does
    // not stream progress events for this kind of call.
    setProgress(2);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        const delta = p < 40 ? 3 : p < 70 ? 1.5 : 0.6;
        return Math.min(95, p + delta);
      });
    }, 180);
  };

  const stopProgressAnimation = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const runGeneration = useCallback(async (runner) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("generating");
    setError(null);
    startProgressAnimation();
    try {
      const result = await runner({ signal: controller.signal });
      const saved = saveGeneratedTrip(result) ?? {
        ...result,
        savedAt: new Date().toISOString(),
      };
      setTrip(saved);
      setProgress(100);
      setStatus("success");
      return saved;
    } catch (err) {
      if (err?.name === "AbortError") return null;
      setError(err);
      setStatus("error");
      return null;
    } finally {
      stopProgressAnimation();
    }
  }, []);

  const generate = useCallback(
    (input) => runGeneration(({ signal }) => generateTripPlan(input, { signal })),
    [runGeneration]
  );

  const regenerate = useCallback(
    (savedTrip) =>
      runGeneration(({ signal }) =>
        regenerateTripPlan(savedTrip, { signal })
      ),
    [runGeneration]
  );

  const revise = useCallback(
    (savedTrip, instruction) =>
      runGeneration(({ signal }) =>
        reviseTripPlan(savedTrip, instruction, { signal })
      ),
    [runGeneration]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    stopProgressAnimation();
    setStatus("idle");
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopProgressAnimation();
    setStatus("idle");
    setTrip(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    status,
    isGenerating: status === "generating",
    trip,
    error,
    progress,
    generate,
    regenerate,
    revise,
    cancel,
    reset,
  };
}

export { GeminiError };
