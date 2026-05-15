// Node-runnable tests for the geographic-consistency validator.
// Run with: `node client/src/services/ai/__tests__/geoValidator.test.mjs`
// (or `pnpm test:geo` once that script is wired up).
//
// We intentionally keep these as plain `node:assert` + `node:test` so they
// run without adding a test framework to the project.

import test from "node:test";
import assert from "node:assert/strict";
import {
  validateGeoConsistency,
  buildFallbackTitle,
  __testing__,
} from "../geoValidator.js";

// Helper: build a parsed-trip shape with the minimum fields the validator
// reads. Override any field by passing it in.
function makeTrip(overrides = {}) {
  return {
    tripTitle: "Trip",
    summary: "A trip.",
    days: [],
    hotels: [],
    transportation: { localTransport: "", interCity: "", tips: [] },
    ...overrides,
  };
}

test("Lahore + Karakoram title is flagged as inconsistent", () => {
  const trip = makeTrip({
    tripTitle: "Mughal Grandeur & Karakoram",
    summary: "Explore Lahore's historic core over four days.",
    days: [
      {
        day: 1,
        title: "Old Lahore",
        activities: [
          { activity: "Badshahi Mosque visit", location: "Walled City, Lahore" },
        ],
      },
      {
        day: 2,
        title: "Anarkali Bazaar walk",
        activities: [
          { activity: "Bazaar tour", location: "Anarkali, Lahore" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Lahore");
  assert.equal(result.ok, false);
  assert.equal(result.severity, "high");
  assert.match(result.reason, /karakoram/i);
  assert.ok(result.suggestedTitle.toLowerCase().includes("lahore"));
});

test("Lahore + Lahore-only title passes", () => {
  const trip = makeTrip({
    tripTitle: "Lahore Heritage & Adventure Escape",
    summary: "Four days exploring Lahore's heritage and Margalla Hills nearby.",
    days: [
      {
        day: 1,
        title: "Walled City exploration",
        activities: [
          { activity: "Lahore Fort", location: "Walled City, Lahore" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Lahore");
  assert.equal(result.ok, true);
});

test("Karachi + food: passes when title aligns", () => {
  const trip = makeTrip({
    tripTitle: "Karachi Coastal Food Journey",
    summary: "Three days of street food and seafood in Karachi.",
    days: [
      {
        day: 1,
        title: "Burns Road biryani crawl",
        activities: [
          { activity: "Burns Road food tour", location: "Saddar, Karachi" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Karachi");
  assert.equal(result.ok, true);
});

test("Tokyo + Anime: passes when title is anchored", () => {
  const trip = makeTrip({
    tripTitle: "Tokyo Anime Explorer",
    summary: "Visit Akihabara and Nakano Broadway on this five-day Tokyo trip.",
    days: [
      {
        day: 1,
        title: "Akihabara electric town",
        activities: [
          { activity: "Mandarake shopping", location: "Akihabara, Tokyo" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Tokyo");
  assert.equal(result.ok, true);
});

test("Cultural-only trip with destination in title passes", () => {
  const trip = makeTrip({
    tripTitle: "Cultural Days in Istanbul",
    summary: "Mosques, palaces, and Bosphorus views over four days in Istanbul.",
    days: [
      {
        day: 1,
        title: "Sultanahmet morning",
        activities: [
          { activity: "Blue Mosque tour", location: "Sultanahmet, Istanbul" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Istanbul");
  assert.equal(result.ok, true);
});

test("Nearby excursion that's mentioned in days is allowed in title", () => {
  // Lahore-based trip that explicitly includes a Margalla Hills day trip —
  // the validator should NOT flag a title that references that excursion.
  const trip = makeTrip({
    tripTitle: "Lahore & Margalla Hills Adventure",
    summary: "A four-day Lahore trip with a day excursion to Margalla Hills.",
    days: [
      {
        day: 1,
        title: "Lahore old town",
        activities: [
          { activity: "Lahore Fort", location: "Walled City, Lahore" },
        ],
      },
      {
        day: 2,
        title: "Margalla Hills hike",
        activities: [
          { activity: "Trail 5 hike", location: "Margalla Hills" },
        ],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Lahore");
  // "Margalla Hills" isn't in the KNOWN_PLACES blacklist so the validator
  // doesn't flag it — and it IS in the day activities, so the allowed vocab
  // covers it anyway.
  assert.equal(result.ok, true);
});

test("Explicit multi-city itinerary is allowed when both cities appear in days", () => {
  const trip = makeTrip({
    tripTitle: "Lahore to Hunza — A Pakistan Grand Tour",
    summary: "Start in Lahore and travel north to Hunza valley over ten days.",
    days: [
      {
        day: 1,
        title: "Lahore arrival",
        activities: [{ activity: "Lahore Fort", location: "Lahore" }],
      },
      {
        day: 5,
        title: "Karimabad arrival",
        activities: [{ activity: "Baltit Fort", location: "Hunza" }],
      },
    ],
  });
  // Destination is "Lahore" but the itinerary explicitly visits Hunza, so
  // "Hunza" being in the title is fine — it appears in the day activities.
  const result = validateGeoConsistency(trip, "Lahore");
  assert.equal(result.ok, true);
});

test("Title that omits destination entirely is flagged (medium)", () => {
  const trip = makeTrip({
    tripTitle: "The Ultimate Adventure",
    summary: "A trip somewhere.",
    days: [
      {
        day: 1,
        title: "Day 1",
        activities: [{ activity: "Activity", location: "Lahore" }],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Lahore");
  assert.equal(result.ok, false);
  assert.equal(result.severity, "medium");
});

test("Summary mentioning foreign region is flagged (low)", () => {
  const trip = makeTrip({
    tripTitle: "Lahore Heritage Trip",
    summary:
      "Spend four days in Lahore with hints of Karakoram in the cuisine.",
    days: [
      {
        day: 1,
        title: "Lahore",
        activities: [{ activity: "Tour", location: "Lahore" }],
      },
    ],
  });
  const result = validateGeoConsistency(trip, "Lahore");
  assert.equal(result.ok, false);
  assert.equal(result.severity, "low");
});

test("buildFallbackTitle produces a destination-anchored title", () => {
  const trip = makeTrip({
    tripTitle: "Should not be used",
    days: [{ day: 1, title: "Heritage walk", activities: [] }],
  });
  const out = buildFallbackTitle(trip, "Lahore");
  assert.ok(out.toLowerCase().includes("lahore"));
  assert.ok(out.length > "Lahore".length);
});

test("buildFallbackTitle handles multi-word destinations", () => {
  const trip = makeTrip({ days: [{ day: 1, title: "Arrival", activities: [] }] });
  const out = buildFallbackTitle(trip, "New York, USA");
  assert.ok(out.toLowerCase().includes("new york"));
});

test("Validator tolerates missing parsed/destination", () => {
  assert.equal(validateGeoConsistency(null, "Lahore").ok, true);
  assert.equal(validateGeoConsistency(makeTrip(), "").ok, true);
});

test("extractKnownPlaces finds two-word landmarks", () => {
  const places = __testing__.extractKnownPlaces(
    "A trip to Fairy Meadows and Nanga Parbat."
  );
  assert.ok(places.includes("fairy meadows"));
  assert.ok(places.includes("nanga parbat"));
});

test("buildAllowedVocab includes destination + day-level content", () => {
  const trip = makeTrip({
    days: [
      {
        day: 1,
        title: "Margalla Hills",
        activities: [{ activity: "Trail 5 hike", location: "Margalla Hills" }],
      },
    ],
  });
  const vocab = __testing__.buildAllowedVocab("Lahore", trip);
  assert.ok(vocab.has("lahore"));
  assert.ok(vocab.has("margalla"));
  assert.ok(vocab.has("hills"));
  assert.ok(vocab.has("margalla hills"));
});
