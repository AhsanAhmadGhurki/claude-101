import destinations from "../../../client/src/mocks/destinations.json";

const BUDGET_RULES = [
  { tier: "low", patterns: ["budget", "cheap", "low-cost", "shoestring", "backpack"] },
  { tier: "luxury", patterns: ["luxury", "premium", "5-star", "five star", "high-end", "upscale"] },
  { tier: "medium", patterns: ["mid", "moderate", "comfort", "standard"] },
];

const INTEREST_RULES = [
  { key: "adventure", patterns: ["adventure", "trek", "hike", "climb", "thrill", "raft", "ski"] },
  { key: "nature", patterns: ["nature", "scenic", "lake", "mountain", "forest", "wildlife", "view"] },
  { key: "culture", patterns: ["culture", "history", "fort", "museum", "heritage", "village"] },
  { key: "food", patterns: ["food", "cuisine", "eat", "foodie", "cafe", "restaurant", "tea"] },
  { key: "photography", patterns: ["photo", "shoot", "instagram", "drone", "sunrise", "sunset"] },
  { key: "family", patterns: ["family", "kids", "child", "easy"] },
  { key: "road-trip", patterns: ["road trip", "road-trip", "drive", "highway", "motor"] },
  { key: "festival", patterns: ["festival", "celebration"] },
];

const STYLE_RULES = [
  { style: "relaxed", patterns: ["relax", "chill", "easy", "slow", "lazy"] },
  { style: "packed", patterns: ["packed", "intense", "non-stop", "everything"] },
];

const SEASON_RULES = [
  { season: "spring", patterns: ["spring", "april", "may"] },
  { season: "summer", patterns: ["summer", "june", "july", "august"] },
  { season: "autumn", patterns: ["autumn", "fall", "september", "october", "november"] },
  { season: "winter", patterns: ["winter", "snow", "december", "january", "february"] },
];

function matchAny(text, patterns) {
  return patterns.some((p) => text.includes(p));
}

function extractDestination(prompt) {
  const text = prompt.toLowerCase();
  for (const key of Object.keys(destinations)) {
    const dest = destinations[key];
    const candidates = [key, dest.name.toLowerCase()].concat(
      key.split("-")
    );
    if (candidates.some((c) => text.includes(c))) {
      return key;
    }
  }
  return null;
}

function extractUnrecognizedDestination(prompt, knownKey) {
  if (knownKey) return null;
  if (!prompt.trim()) return null;
  const prepositional = prompt.match(
    /\b(?:to|in|at|visit(?:ing)?|for|exploring|trip\s+to)\s+([A-Z][a-zA-Z]+(?:[\s-][A-Z][a-zA-Z]+)?)/
  );
  if (prepositional) return prepositional[1];
  const stopwords = new Set(["I", "Im", "My", "We", "The", "A", "An", "Day", "Days", "Trip"]);
  const cap = prompt.match(/\b([A-Z][a-z]{2,})\b/g);
  if (cap) {
    const candidate = cap.find((w) => !stopwords.has(w));
    if (candidate) return candidate;
  }
  return null;
}

function extractDays(prompt) {
  const m = prompt.match(/(\d+)\s*-?\s*day/i);
  if (m) return Math.min(Math.max(parseInt(m[1], 10), 1), 10);
  const word = prompt.match(/\b(one|two|three|four|five|six|seven)\s*-?\s*day/i);
  if (word) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
    return map[word[1].toLowerCase()];
  }
  return null;
}

function extractBudget(text) {
  for (const rule of BUDGET_RULES) {
    if (matchAny(text, rule.patterns)) return rule.tier;
  }
  return null;
}

function extractInterests(text) {
  const found = new Set();
  for (const rule of INTEREST_RULES) {
    if (matchAny(text, rule.patterns)) found.add(rule.key);
  }
  return [...found];
}

function extractStyle(text) {
  for (const rule of STYLE_RULES) {
    if (matchAny(text, rule.patterns)) return rule.style;
  }
  return "balanced";
}

function extractSeason(text) {
  for (const rule of SEASON_RULES) {
    if (matchAny(text, rule.patterns)) return rule.season;
  }
  return null;
}

export function parseInput({ prompt = "", overrides = {} } = {}) {
  const text = prompt.toLowerCase();
  const destinationKey = overrides.destinationKey ?? extractDestination(prompt);
  const parsed = {
    destinationKey,
    unrecognizedDestination:
      overrides.destinationKey
        ? null
        : extractUnrecognizedDestination(prompt, destinationKey),
    days: overrides.days ?? extractDays(prompt) ?? 3,
    budget: overrides.budget ?? extractBudget(text) ?? "medium",
    interests: overrides.interests ?? extractInterests(text),
    style: overrides.style ?? extractStyle(text),
    season: overrides.season ?? extractSeason(text),
    rawPrompt: prompt.trim(),
  };

  if (!parsed.interests.length && parsed.destinationKey) {
    parsed.interests = destinations[parsed.destinationKey].tags.slice(0, 2);
  }

  parsed.confidence = computeConfidence(parsed);
  parsed.missing = collectMissing(parsed);
  return parsed;
}

function computeConfidence(p) {
  let score = 0;
  if (p.destinationKey) score += 40;
  if (p.days) score += 20;
  if (p.budget) score += 15;
  if (p.interests.length) score += 15;
  if (p.season) score += 10;
  return score;
}

function collectMissing(p) {
  const missing = [];
  if (!p.destinationKey) missing.push("destination");
  if (!p.interests.length) missing.push("interests");
  if (!p.season) missing.push("season");
  return missing;
}
