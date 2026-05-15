// Public entry point for AI trip generation.
//
// Pages and hooks should import from here. Internally this orchestrates:
//   1. Validate user inputs
//   2. Build the system + user prompt
//   3. Call Gemini (with optional retry on transient failures)
//   4. Parse + normalise the JSON response
//   5. Wrap the result with the original input + metadata
//
// The function NEVER throws on bad input: caller-facing errors come back
// inside a GeminiError so the UI can show a friendly retry path.

import { callGemini, GeminiError } from "./gemini.js";
import {
  buildTripPrompt,
  buildRevisionPrompt,
  buildCorrectivePrompt,
} from "./prompts.js";
import { parseAIResponse } from "./responseParser.js";
import { validateGeoConsistency, buildFallbackTitle } from "./geoValidator.js";
import { sanitizeText } from "../../lib/utils/sanitize.js";

// Errors worth retrying on the *same* model — transient network/server
// hiccups and the occasional malformed response.
const RETRYABLE_CODES = new Set([
  "NETWORK",
  "BAD_GATEWAY",
  "HTTP_ERROR",
  "MALFORMED_JSON",
  "INCOMPLETE_TRIP",
  "EMPTY_RESPONSE",
]);

// When the primary model is rate-limited we silently fall over to the
// lite variant so the user still gets a trip. The fallback chain runs
// only on RATE_LIMIT errors.
const MODEL_FALLBACK_CHAIN = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

const DEFAULT_MODEL = "gemini-flash-latest";

// Hard ceiling per attempt. Gemini Flash should respond in 5–30s; anything
// past 60s is almost certainly a stuck connection and the user is better
// served by a fresh attempt than waiting forever.
const PER_ATTEMPT_TIMEOUT_MS = 60_000;

function clampDuration(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 3;
  return Math.min(Math.max(Math.round(v), 1), 14);
}

function clampTravelers(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 2;
  return Math.min(Math.max(Math.round(v), 1), 20);
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normaliseInput(raw = {}) {
  return {
    // Sanitize free-text fields at the service boundary so even if a caller
    // skips the form validator, no HTML/script payload reaches the prompt
    // builder, storage, or any UI render.
    destination: sanitizeText(raw.destination),
    duration: clampDuration(raw.duration),
    budget: (raw.budget ?? "medium").toString().trim().toLowerCase(),
    travelStyle: (raw.travelStyle ?? "balanced").toString().trim().toLowerCase(),
    interests: Array.isArray(raw.interests)
      ? raw.interests
          .filter(Boolean)
          .map((s) => sanitizeText(s))
          .filter(Boolean)
      : [],
    travelers: clampTravelers(raw.travelers),
    transport: (raw.transport ?? "mixed").toString().trim().toLowerCase(),
    food: (raw.food ?? "any").toString().trim().toLowerCase(),
    season: raw.season ? sanitizeText(raw.season) : null,
    prompt: sanitizeText(raw.prompt),
  };
}

/**
 * Validate that the minimum required fields are present.
 * Throws a friendly GeminiError if not.
 */
function validateInput(input) {
  if (!input.destination) {
    throw new GeminiError(
      "Please tell us where you want to go.",
      { code: "MISSING_DESTINATION" }
    );
  }
  if (!input.duration || input.duration < 1) {
    throw new GeminiError(
      "Trip duration must be at least 1 day.",
      { code: "INVALID_DURATION" }
    );
  }
}

function modelsToTry() {
  const preferred = import.meta.env?.VITE_GEMINI_MODEL?.trim();
  // Put the user-configured model first; then append the fallback chain
  // minus any duplicates of that model.
  const chain = preferred ? [preferred] : [];
  for (const m of MODEL_FALLBACK_CHAIN) {
    if (!chain.includes(m)) chain.push(m);
  }
  return chain;
}

async function callWithRetry(messages, { signal, maxAttempts = 2 } = {}) {
  const models = modelsToTry();
  let lastErr;
  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Combine the caller's cancellation signal with a per-attempt timeout
      // so a hung connection doesn't leave the user staring at a loader.
      const attemptController = new AbortController();
      const timer = setTimeout(
        () => attemptController.abort(new DOMException("timeout", "TimeoutError")),
        PER_ATTEMPT_TIMEOUT_MS
      );
      const onParentAbort = () => attemptController.abort(signal?.reason);
      if (signal) {
        if (signal.aborted) onParentAbort();
        else signal.addEventListener("abort", onParentAbort, { once: true });
      }
      try {
        return await callGemini({
          ...messages,
          model,
          signal: attemptController.signal,
        });
      } catch (err) {
        lastErr = err;
        // User-initiated cancel — propagate immediately, no retry.
        if (signal?.aborted) throw err;
        // Per-attempt timeout — treat as retryable network error.
        const isTimeout =
          err?.name === "TimeoutError" || err?.name === "AbortError";
        const code = err instanceof GeminiError ? err.code : null;
        if (code === "RATE_LIMIT") break; // try next model
        const retry =
          attempt < maxAttempts &&
          (isTimeout || (code && RETRYABLE_CODES.has(code)));
        if (retry) {
          await new Promise((r) => setTimeout(r, 600 * attempt));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener?.("abort", onParentAbort);
      }
    }
  }
  // Whole fallback chain exhausted on overload/rate-limit — rewrite the error
  // so the UI shows a friendly message instead of Google's raw quota text.
  if (lastErr instanceof GeminiError && lastErr.code === "RATE_LIMIT") {
    throw new GeminiError("Couldn't reach Gemini. Please try again.", {
      code: "RATE_LIMIT",
      status: lastErr.status,
      cause: lastErr,
    });
  }
  throw lastErr;
}

/**
 * Generate a complete trip plan with Gemini.
 *
 * @param {object} rawInput  - see normaliseInput for the fields
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {number} [opts.maxAttempts]
 * @returns {Promise<object>} stored-trip shape (see SavedTrip schema)
 */
export async function generateTripPlan(rawInput, opts = {}) {
  const input = normaliseInput(rawInput);
  validateInput(input);

  const messages = buildTripPrompt(input);
  const raw = await callWithRetry(messages, opts);

  let parsed;
  try {
    parsed = parseAIResponse(raw, { expectedDays: input.duration });
  } catch (err) {
    // One last targeted retry if the JSON came back malformed — Gemini
    // occasionally has off days.
    if (err instanceof GeminiError && RETRYABLE_CODES.has(err.code)) {
      const second = await callWithRetry(messages, {
        ...opts,
        maxAttempts: 1,
      });
      parsed = parseAIResponse(second, { expectedDays: input.duration });
    } else {
      throw err;
    }
  }

  parsed = await enforceGeoConsistency(parsed, input, opts);

  return {
    tripId: makeId(),
    input,
    generatedAt: new Date().toISOString(),
    model: import.meta.env?.VITE_GEMINI_MODEL || DEFAULT_MODEL,
    isFavorite: false,
    ...parsed,
  };
}

function pickCityName(destination) {
  const dest = String(destination ?? "").trim();
  const city = dest.split(",")[0].trim();
  return city
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Catch the case where the AI generates an itinerary for the right destination
 * but brands it with another region's name (high severity), or with a generic
 * title that omits the destination (medium severity). We:
 *   1. Validate the title / summary against the actual itinerary geography.
 *   2. On a title-level failure (high or medium), retry ONCE with a corrective
 *      re-prompt that explicitly tells the model what went wrong.
 *   3. If the retry still fails, apply a programmatic fix:
 *      - high severity (foreign region in title): replace the title with a
 *        destination-anchored fallback so the bad region name disappears.
 *      - medium severity (destination missing): prepend "{City}:" to the AI's
 *        title so its branding survives but the city is guaranteed to appear.
 *
 * Returns the (possibly mutated) parsed trip object.
 */
async function enforceGeoConsistency(parsed, input, opts) {
  if (!parsed) return parsed;
  let check = validateGeoConsistency(parsed, input.destination);
  if (check.ok) return parsed;

  // Title-level failure → re-prompt with the failure reason so the model can
  // self-correct rather than rolling the dice on a second random sample.
  if (check.severity === "high" || check.severity === "medium") {
    try {
      const corrective = buildCorrectivePrompt(input, check.reason);
      const raw = await callWithRetry(corrective, {
        ...opts,
        maxAttempts: 1,
      });
      const second = parseAIResponse(raw, { expectedDays: input.duration });
      const secondCheck = validateGeoConsistency(second, input.destination);
      if (secondCheck.ok) return second;
      parsed = second;
      check = secondCheck;
    } catch {
      // Network / model failure on the retry — keep the original response
      // and rely on the programmatic title fix below.
    }
  }

  // High severity: title names a foreign region (e.g. "Karakoram" for a Lahore
  // trip). Replace the title entirely — prepending the city would still leave
  // the bad region name visible to the user.
  if (check.severity === "high") {
    const replacement =
      check.suggestedTitle ?? buildFallbackTitle(parsed, input.destination);
    return { ...parsed, tripTitle: replacement };
  }

  // Medium severity: title is generic / missing the destination. Prepend the
  // city so the AI's brand text survives but the city is guaranteed visible.
  if (check.severity === "medium") {
    const city = pickCityName(input.destination);
    const current = (parsed.tripTitle ?? "").trim();
    if (!current) {
      return { ...parsed, tripTitle: buildFallbackTitle(parsed, input.destination) };
    }
    if (current.toLowerCase().includes(city.toLowerCase())) {
      return parsed;
    }
    return { ...parsed, tripTitle: `${city}: ${current}` };
  }

  // Low severity (e.g. summary mentions a foreign region but title is fine):
  // leave the trip as-is.
  return parsed;
}

/**
 * Regenerate the whole trip with the same inputs. Returned trip carries a
 * new tripId but preserves the original trip's favourite flag so users
 * don't have to re-tap the heart after every regenerate.
 */
export async function regenerateTripPlan(savedTrip, opts) {
  const next = await generateTripPlan(savedTrip.input, opts);
  return { ...next, isFavorite: Boolean(savedTrip.isFavorite) };
}

/**
 * Apply a user-provided revision instruction to an existing trip. Used by
 * the AI chat assistant — e.g. "Make day 2 more relaxing".
 *
 * Returns the same shape as generateTripPlan, with a new tripId.
 */
export async function reviseTripPlan(savedTrip, instruction, opts = {}) {
  if (!instruction || !instruction.trim()) {
    throw new GeminiError("Tell us what to change.", {
      code: "EMPTY_INSTRUCTION",
    });
  }
  const messages = buildRevisionPrompt({
    currentTrip: {
      tripTitle: savedTrip.tripTitle,
      summary: savedTrip.summary,
      totalEstimatedBudget: savedTrip.totalEstimatedBudget,
      bestTimeToVisit: savedTrip.bestTimeToVisit,
      travelTips: savedTrip.travelTips,
      packingList: savedTrip.packingList,
      days: savedTrip.days,
      hotels: savedTrip.hotels,
      transportation: savedTrip.transportation,
    },
    instruction,
    input: savedTrip.input,
  });
  const raw = await callWithRetry(messages, opts);
  let parsed = parseAIResponse(raw, {
    expectedDays: savedTrip.input.duration,
  });
  // Same enforcement runs on revise — a refinement request shouldn't be
  // allowed to drift the title's geography either.
  parsed = await enforceGeoConsistency(parsed, savedTrip.input, opts);
  return {
    tripId: makeId(),
    input: savedTrip.input,
    generatedAt: new Date().toISOString(),
    model: import.meta.env?.VITE_GEMINI_MODEL || DEFAULT_MODEL,
    isFavorite: savedTrip.isFavorite ?? false,
    ...parsed,
  };
}

export { GeminiError };
