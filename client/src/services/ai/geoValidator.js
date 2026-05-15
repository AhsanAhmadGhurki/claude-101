// Geographic-consistency validator for AI trip responses.
//
// Goal: catch the failure mode where the AI generates an itinerary anchored
// to one destination but brands it with another region's name (e.g. Lahore
// itinerary titled "Mughal Grandeur & Karakoram"). The validator returns
// `{ ok, reason }` so the caller can either re-prompt or programmatically
// normalise the title before showing it to the user.
//
// Strategy:
//   1. Build an "allowed vocabulary" from the user's destination + the day
//      activities/locations in the AI response — anything actually present
//      in the itinerary is fair game for the title to reference.
//   2. Extract candidate place names from the title and summary (capitalised
//      tokens) — using a curated blacklist of well-known regions/landmarks
//      that shouldn't appear unless the itinerary visits them.
//   3. Flag any candidate that's NOT in the allowed vocabulary as a
//      geographic mismatch.
//
// The list is conservative — only globally recognisable regions where mixing
// would be obviously wrong. False negatives are preferable to false positives
// (re-running generation costs API quota; missing a subtle drift is fine).

// Well-known places that, if mentioned in title/summary, strongly imply the
// trip happens there. Sourced from common travel-blog hot-spots so the AI's
// frequent hallucinations get caught. Add more entries here when QA finds
// new failure modes.
const KNOWN_PLACES = [
  // Pakistan north
  "karakoram", "himalaya", "himalayas", "hindu kush", "hindukush",
  "hunza", "skardu", "gilgit", "baltistan", "fairy meadows",
  "nanga parbat", "k2", "naran", "kaghan", "swat", "chitral",
  "kalash", "kalasha", "gilgit-baltistan", "northern areas",
  "khunjerab", "shangrila", "deosai", "attabad",
  // Pakistan south/central
  "lahore", "karachi", "islamabad", "rawalpindi", "multan",
  "peshawar", "quetta", "faisalabad", "hyderabad", "bahawalpur",
  "punjab", "sindh", "balochistan", "kpk", "khyber",
  // India
  "delhi", "mumbai", "goa", "kerala", "rajasthan", "kashmir",
  "ladakh", "himachal", "manali", "rishikesh", "varanasi",
  "bangalore", "jaipur", "agra", "taj mahal",
  // Asia
  "tokyo", "kyoto", "osaka", "bangkok", "phuket", "chiang mai",
  "bali", "jakarta", "singapore", "kuala lumpur", "hanoi",
  "ho chi minh", "saigon", "seoul", "busan", "beijing",
  "shanghai", "hong kong", "taipei", "dubai", "abu dhabi",
  // Europe
  "paris", "london", "rome", "venice", "florence", "barcelona",
  "madrid", "lisbon", "amsterdam", "berlin", "prague", "vienna",
  "santorini", "athens", "istanbul", "swiss alps", "alps",
  "dolomites", "tuscany", "andalusia",
  // Americas
  "new york", "los angeles", "san francisco", "miami", "chicago",
  "vancouver", "toronto", "rio de janeiro", "buenos aires",
  "cusco", "machu picchu", "patagonia", "mexico city", "cancun",
  // Africa & Middle East
  "cairo", "marrakech", "fes", "casablanca", "cape town",
  "nairobi", "serengeti", "kilimanjaro", "petra",
  // Generic biomes / iconic features often hallucinated
  "amazon", "sahara", "everest", "andes", "rockies",
];

const KNOWN_PLACES_SET = new Set(KNOWN_PLACES.map((p) => p.toLowerCase()));

function normalise(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokens we treat as filler regardless of capitalisation. Catches generic
// title patterns like "The Ultimate Mughal Adventure" so we don't flag
// "Mughal" as a place when it's clearly an adjective.
const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "at", "to", "for",
  "with", "via", "from", "your", "trip", "tour", "escape", "adventure",
  "journey", "experience", "discovery", "explorer", "expedition",
  "getaway", "vacation", "holiday", "break", "days", "day", "weekend",
  "week", "ultimate", "best", "grand", "epic", "essential",
]);

function tokenise(text) {
  return normalise(text)
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t));
}

/**
 * Build the set of place tokens we consider "allowed" — i.e. tokens that
 * legitimately appear in the itinerary itself. Sources:
 *   - The user-selected destination (and each space-separated token from it)
 *   - Every day title
 *   - Every activity location, activity name, and description
 *   - Every food recommendation
 *   - Hotel names and the transportation copy
 */
function buildAllowedVocab(destination, parsed) {
  const all = new Set();
  const add = (text) => {
    for (const t of tokenise(text)) all.add(t);
    // Two-word combinations too — catches "fairy meadows", "new york".
    const tokens = normalise(text).split(" ").filter(Boolean);
    for (let i = 0; i < tokens.length - 1; i++) {
      all.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
  };

  add(destination);
  if (!parsed) return all;

  for (const d of parsed.days ?? []) {
    add(d.title);
    for (const a of d.activities ?? []) {
      add(a.activity);
      add(a.location);
      add(a.description);
    }
    for (const f of d.foodRecommendations ?? []) add(f);
  }
  for (const h of parsed.hotels ?? []) {
    add(h.name);
    add(h.reason);
  }
  if (parsed.transportation) {
    add(parsed.transportation.localTransport);
    add(parsed.transportation.interCity);
    for (const t of parsed.transportation.tips ?? []) add(t);
  }
  return all;
}

/**
 * Extract candidate place mentions from a piece of text. A "candidate" is
 * any known-place keyword (single-word or two-word) that appears in the
 * text. Returns lowercase tokens so the caller can dedupe / format.
 */
function extractKnownPlaces(text) {
  const norm = normalise(text);
  const hits = new Set();
  for (const place of KNOWN_PLACES_SET) {
    // Whole-word boundary — "ladakh" must not match inside "ladakhi village"
    // shouldn't matter (ladakhi is also a hit), but "asia" inside "stasiun"
    // would be wrong. We anchor to word boundaries via spaces / start / end.
    const padded = ` ${norm} `;
    const needle = ` ${place} `;
    if (padded.includes(needle)) hits.add(place);
  }
  return [...hits];
}

/**
 * Main entry. Returns { ok: true } when the response is geographically
 * consistent, or { ok: false, reason, suggestedTitle } otherwise.
 *
 * @param {object} parsed       Parsed AI response (from responseParser)
 * @param {string} destination  User-selected destination
 */
export function validateGeoConsistency(parsed, destination) {
  if (!parsed || !destination) {
    return { ok: true }; // Nothing to validate against.
  }
  const dest = normalise(destination);
  if (!dest) return { ok: true };

  const allowed = buildAllowedVocab(destination, parsed);

  // Rule 1: Title must reference the destination (or a sub-token of it).
  const titleNorm = normalise(parsed.tripTitle);
  const destTokens = dest.split(" ").filter(Boolean);
  const titleMentionsDestination =
    titleNorm.includes(dest) ||
    destTokens.some((t) => t.length >= 3 && titleNorm.includes(t));

  // Rule 2: Title must not name a known foreign region absent from the
  // itinerary.
  const titlePlaces = extractKnownPlaces(parsed.tripTitle);
  const titleForeignPlaces = titlePlaces.filter((p) => {
    // Place is "foreign" if it's not in the destination string and not in
    // the allowed vocab built from the itinerary.
    if (dest.includes(p)) return false;
    if (allowed.has(p)) return false;
    return true;
  });

  // Rule 3: Summary must not name a known foreign region absent from the
  // itinerary (softer — we tolerate this but flag for retry on first pass).
  const summaryPlaces = extractKnownPlaces(parsed.summary);
  const summaryForeignPlaces = summaryPlaces.filter((p) => {
    if (dest.includes(p)) return false;
    if (allowed.has(p)) return false;
    return true;
  });

  if (titleForeignPlaces.length > 0) {
    return {
      ok: false,
      severity: "high",
      reason: `tripTitle mentions "${titleForeignPlaces.join(", ")}" but the itinerary does not visit ${titleForeignPlaces.length > 1 ? "those regions" : "that region"}`,
      foreignPlaces: titleForeignPlaces,
      suggestedTitle: buildFallbackTitle(parsed, destination),
    };
  }

  if (!titleMentionsDestination) {
    return {
      ok: false,
      severity: "medium",
      reason: `tripTitle does not mention the destination "${destination}"`,
      foreignPlaces: [],
      suggestedTitle: buildFallbackTitle(parsed, destination),
    };
  }

  if (summaryForeignPlaces.length > 0) {
    return {
      ok: false,
      severity: "low",
      reason: `summary mentions "${summaryForeignPlaces.join(", ")}" but the itinerary stays in ${destination}`,
      foreignPlaces: summaryForeignPlaces,
      suggestedTitle: null,
    };
  }

  return { ok: true };
}

/**
 * Build a sensible programmatic title from the destination + first day's
 * theme when we have to override the AI's bad output. Title-case the
 * destination so "tokyo, japan" becomes "Tokyo, Japan".
 */
export function buildFallbackTitle(parsed, destination) {
  const dest = String(destination ?? "").trim();
  const city = dest.split(",")[0].trim();
  const cityTitle = city
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
  // Pull a thematic word from the first day's title if it looks descriptive.
  const firstDayTitle = parsed?.days?.[0]?.title ?? "";
  const themeWord = tokenise(firstDayTitle).find(
    (t) =>
      t.length >= 5 &&
      !KNOWN_PLACES_SET.has(t) &&
      !cityTitle.toLowerCase().includes(t)
  );
  if (themeWord) {
    const themed = themeWord[0].toUpperCase() + themeWord.slice(1);
    return `${cityTitle} ${themed} Trip`;
  }
  return `${cityTitle} Explorer`;
}

// Exported for tests.
export const __testing__ = {
  buildAllowedVocab,
  extractKnownPlaces,
  normalise,
  tokenise,
  KNOWN_PLACES,
};
