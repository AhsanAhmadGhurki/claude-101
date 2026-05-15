// Parse + normalise the raw JSON text returned by Gemini.
//
// Even in JSON-mode, Gemini occasionally:
//   - wraps the JSON in ```json fences
//   - prepends or appends a stray sentence
//   - returns a slightly off-schema structure (missing fields, wrong types)
//
// `parseAIResponse` is defensive: it extracts the JSON body, validates the
// required top-level keys, and coerces each field to the expected shape so
// the UI never crashes on a malformed response.

import { GeminiError } from "./gemini.js";

const REQUIRED_TOP_LEVEL = [
  "tripTitle",
  "summary",
  "totalEstimatedBudget",
  "bestTimeToVisit",
  "travelTips",
  "packingList",
  "days",
  "hotels",
  "transportation",
];

function stripFences(text) {
  let t = text.trim();
  // Remove leading/trailing markdown code fences if present.
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?/i, "").trim();
    if (t.endsWith("```")) t = t.slice(0, -3).trim();
  }
  return t;
}

function extractJsonBody(text) {
  const stripped = stripFences(text);
  // If the text is already pure JSON, JSON.parse will succeed below.
  try {
    JSON.parse(stripped);
    return stripped;
  } catch {
    // Fall back to extracting from first "{" to last "}".
  }
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new GeminiError(
      "Gemini did not return valid JSON. Please try again.",
      { code: "MALFORMED_JSON" }
    );
  }
  return stripped.slice(first, last + 1);
}

function asString(v, fallback = "") {
  if (v == null) return fallback;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => asString(item))
    .filter((item) => item && item.length > 0);
}

function asActivity(v, fallbackTime = "") {
  if (!v || typeof v !== "object") return null;
  const activity = asString(v.activity);
  if (!activity) return null;
  return {
    time: asString(v.time, fallbackTime),
    activity,
    location: asString(v.location),
    description: asString(v.description),
    estimatedCost: asString(v.estimatedCost),
  };
}

function asDay(v, index) {
  if (!v || typeof v !== "object") {
    return {
      day: index + 1,
      title: `Day ${index + 1}`,
      activities: [],
      foodRecommendations: [],
      estimatedCost: "",
    };
  }
  const activities = Array.isArray(v.activities)
    ? v.activities.map((a) => asActivity(a)).filter(Boolean)
    : [];
  return {
    day: Number.isFinite(v.day) ? Number(v.day) : index + 1,
    title: asString(v.title, `Day ${index + 1}`),
    activities,
    foodRecommendations: asStringArray(v.foodRecommendations),
    estimatedCost: asString(v.estimatedCost),
  };
}

function asHotel(v) {
  if (!v || typeof v !== "object") return null;
  const name = asString(v.name);
  if (!name) return null;
  return {
    name,
    type: asString(v.type),
    priceRange: asString(v.priceRange),
    reason: asString(v.reason),
  };
}

function asTransportation(v) {
  if (!v || typeof v !== "object") {
    return { localTransport: "", interCity: "", tips: [] };
  }
  return {
    localTransport: asString(v.localTransport),
    interCity: asString(v.interCity),
    tips: asStringArray(v.tips),
  };
}

/**
 * Parse a Gemini response string into a validated trip object.
 * Throws GeminiError if the response cannot be recovered.
 */
export function parseAIResponse(raw, { expectedDays } = {}) {
  if (!raw || typeof raw !== "string") {
    throw new GeminiError("Gemini returned no content.", {
      code: "EMPTY_RESPONSE",
    });
  }

  const body = extractJsonBody(raw);

  let json;
  try {
    json = JSON.parse(body);
  } catch (cause) {
    throw new GeminiError("Gemini returned malformed JSON.", {
      code: "MALFORMED_JSON",
      cause,
    });
  }

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new GeminiError("Gemini response was not an object.", {
      code: "BAD_STRUCTURE",
    });
  }

  // Spot-check: at least half of the required keys must be present. Anything
  // less is almost certainly a hallucinated response we shouldn't render.
  const presentKeys = REQUIRED_TOP_LEVEL.filter((k) => k in json);
  if (presentKeys.length < REQUIRED_TOP_LEVEL.length / 2) {
    throw new GeminiError(
      "Gemini returned an incomplete trip. Try generating again.",
      { code: "INCOMPLETE_TRIP" }
    );
  }

  const rawDays = Array.isArray(json.days) ? json.days : [];
  let days = rawDays.map(asDay);
  // Trim or pad to the requested duration so the UI always has the right
  // number of cards.
  if (Number.isFinite(expectedDays) && expectedDays > 0) {
    if (days.length > expectedDays) days = days.slice(0, expectedDays);
    while (days.length < expectedDays) {
      days.push({
        day: days.length + 1,
        title: `Day ${days.length + 1}`,
        activities: [],
        foodRecommendations: [],
        estimatedCost: "",
      });
    }
  }
  // Re-number so the day field always matches the index.
  days = days.map((d, i) => ({ ...d, day: i + 1 }));

  const hotels = Array.isArray(json.hotels)
    ? json.hotels.map(asHotel).filter(Boolean)
    : [];

  return {
    tripTitle: asString(json.tripTitle, "Your Trip"),
    summary: asString(json.summary),
    totalEstimatedBudget: asString(json.totalEstimatedBudget),
    bestTimeToVisit: asString(json.bestTimeToVisit),
    travelTips: asStringArray(json.travelTips),
    packingList: asStringArray(json.packingList),
    days,
    hotels,
    transportation: asTransportation(json.transportation),
  };
}
