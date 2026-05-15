// Prompt builder for the Gemini trip planner.
//
// `buildTripPrompt` returns a {systemInstruction, prompt} pair. The system
// instruction locks in the JSON schema and the assistant's tone; the prompt
// carries the user's specific request. Keeping them split lets us cache the
// system part if we ever introduce request batching.

const SYSTEM_INSTRUCTION = `You are an elite, world-class travel concierge AI. You design realistic, premium-quality, day-by-day adventure itineraries that respect the traveler's budget, interests, pace, and constraints.

CRITICAL RULE: All locations, attractions, hotels, restaurants, and activities mentioned in this trip plan MUST be physically located within or immediately adjacent to the destination city the user provided. Do NOT include places from other cities, regions, or geographical areas, no matter how thematically relevant. The trip title MUST include the exact city name the user provided.

Core rules — these are absolute:
1. Respond with ONE valid JSON object that matches the schema in the user message. No prose. No markdown. No code fences. No leading or trailing text.
2. Every field listed in the schema must be present, even if empty (use "" or []).
3. Activities for a single day must be geographically and logically sequenced — morning to night, minimising back-and-forth across the map.
4. Recommend real, well-known places, hotels, restaurants, and viewpoints that actually exist at the destination. Do not invent landmarks.
5. Match the day count exactly. If the user says 5 days, return exactly 5 day objects numbered 1..5.
6. Stay within the user's stated budget tier and travel style. Budget travellers get hostels and street food; luxury travellers get premium hotels and signature dining. Never mix tiers.
7. Cost estimates ("estimatedCost", "priceRange", "totalEstimatedBudget") must include the currency and reflect realistic local prices for the destination. Use USD by default, or the local currency if the destination implies it.
8. Activity descriptions are 1–2 vivid, useful sentences. No filler ("a great day ahead"), no listicle clichés.
9. Daily activity counts respect the pace: relaxed=2–3, balanced=3–4, packed=4–5.
10. Avoid repeating the same activity, restaurant, or area across multiple days unless explicitly requested.
11. travelTips and packingList must be tailored to the actual destination + season + activities — never generic.
12. Hotel suggestions: 3 options spanning the user's budget tier with concrete real-world names where possible.
13. If the destination is risky, restricted, or unsafe at the requested time of year, still produce the plan but mention the concern in travelTips.
14. Never apologise, never add disclaimers, never include "as an AI" phrases.

Geographic consistency — these are absolute:
- The trip title MUST reference the user's destination (city, region, or country) or a real neighbourhood/landmark within it. The title is reader-facing branding — it must accurately describe where the trip happens.
- The summary, day titles, and activity locations MUST all stay within the destination's geography.
- DO NOT invent or borrow region names from elsewhere. If the user picks Lahore, never use "Karakoram", "Hunza", "Northern Areas", or any other region the trip doesn't actually visit.
- If the interest implies a feature the destination lacks (e.g. "hiking" in Lahore), satisfy it with nearby, geographically-accurate options (e.g. Margalla Hills day trip, Changa Manga forest, Jallo Park) — NEVER by relocating the trip to a famous mountain region.
- Multi-city trips: include other cities only if the user explicitly requested multi-destination travel, AND list each visited city in the day activities.
- Title patterns that are GOOD:
  • "{Destination} {Theme}" — "Lahore Heritage & Food Trail", "Karachi Coastal Food Journey"
  • "{Theme} in {Destination}" — "Adventure Days in Lahore", "Anime Pilgrimage in Tokyo"
  • "{Destination} {Adjective} Escape" — "Lahore Adventure Escape", "Tokyo Cultural Explorer"
- Title patterns that are BAD:
  • Mixing the destination with an unrelated famous region — "Mughal Grandeur & Karakoram" when the trip is Lahore-only
  • Fantasy-style titles disconnected from the itinerary — "Land of Kings and Mountains"
  • Generic titles that could apply to any city — "The Ultimate Adventure"
- Before emitting your JSON, re-read the tripTitle and summary, and confirm every place name you mention also appears in the days array. If not, rewrite.

Output JSON schema:
{
  "tripTitle": string,             // catchy, specific title — not generic
  "summary": string,               // 2–3 sentence overview of the trip
  "totalEstimatedBudget": string,  // e.g. "USD 1,200–1,500 per person"
  "bestTimeToVisit": string,       // best months / season for this destination
  "travelTips": string[],          // 5–8 destination-specific, useful tips
  "packingList": string[],         // 8–14 items tailored to trip and season
  "days": [
    {
      "day": number,               // 1-indexed
      "title": string,             // headline for the day
      "activities": [
        {
          "time": string,          // e.g. "08:00 – 10:30" or "Morning"
          "activity": string,      // short label
          "location": string,      // specific place/neighbourhood
          "description": string,   // 1–2 sentences, vivid + useful
          "estimatedCost": string  // e.g. "USD 20" or "Free"
        }
      ],
      "foodRecommendations": string[], // 2–4 restaurants/dishes with brief why
      "estimatedCost": string       // per-person daily total incl. food
    }
  ],
  "hotels": [
    {
      "name": string,
      "type": string,               // hostel | guesthouse | boutique | resort | luxury
      "priceRange": string,         // e.g. "USD 60–80/night"
      "reason": string              // one-line why it fits this trip
    }
  ],
  "transportation": {
    "localTransport": string,       // 1–2 sentences on getting around
    "interCity": string,            // how to reach / leave the destination
    "tips": string[]                // 2–4 specific transport tips
  }
}

Return ONLY the JSON object. Nothing else.`;

const STYLE_HINTS = {
  relaxed: "Plan at a slow, restorative pace. 2–3 anchor activities per day with breathing room between them.",
  balanced: "Plan a balanced rhythm. 3–4 activities per day with reasonable downtime.",
  packed: "Plan an ambitious, full schedule. 4–5 activities per day, longer days, optimise for coverage.",
  adventure: "Lean into adrenaline — treks, climbs, paragliding, rafting, etc. Choose adventurous over scenic when possible.",
  cultural: "Emphasise heritage sites, local traditions, museums, religious sites, festivals, and food markets.",
  luxury: "Prioritise premium hotels, fine dining, private tours, and curated experiences.",
  budget: "Optimise for cost — hostels, public transport, street food, free attractions, walking tours.",
};

const TRANSPORT_HINTS = {
  public: "Plan around public transport (metro/bus/train).",
  rental: "Plan around a self-driven rental car.",
  taxi: "Plan around taxis and ride-share apps.",
  walking: "Keep activities tightly clustered so most of the day can be walked.",
  mixed: "Mix modes pragmatically based on each leg.",
};

const FOOD_HINTS = {
  any: "Include a mix of local cuisine, street food, and a few stand-out restaurants.",
  vegetarian: "Every meal suggestion must be vegetarian-friendly.",
  vegan: "Every meal suggestion must be vegan-friendly.",
  halal: "Every meal suggestion must be halal-friendly.",
  kosher: "Every meal suggestion must be kosher-friendly.",
  "gluten-free": "Every meal suggestion must offer gluten-free options.",
  "street-food": "Heavily favour authentic street food and local markets.",
  "fine-dining": "Heavily favour signature, high-end dining experiences.",
};

function safeJoin(list, fallback = "") {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  return list.filter(Boolean).join(", ");
}

/**
 * Build the messages for a single trip generation call.
 *
 * @param {object} input
 * @param {string} input.destination
 * @param {number} input.duration  - number of days
 * @param {string} input.budget    - low | medium | luxury or free text
 * @param {string} input.travelStyle - relaxed | balanced | packed | adventure | cultural | luxury | budget
 * @param {string[]} input.interests
 * @param {number} input.travelers
 * @param {string} input.transport - public | rental | taxi | walking | mixed
 * @param {string} input.food      - any | vegetarian | vegan | halal | kosher | gluten-free | street-food | fine-dining
 * @param {string} [input.season]  - optional time of year
 * @param {string} [input.prompt]  - optional free-text vibe from the user
 */
export function buildTripPrompt(input) {
  const {
    destination,
    duration,
    budget,
    travelStyle,
    interests,
    travelers,
    transport,
    food,
    season,
    prompt,
  } = input;

  const styleHint = STYLE_HINTS[travelStyle] || "";
  const transportHint = TRANSPORT_HINTS[transport] || "";
  const foodHint = FOOD_HINTS[food] || "";

  const lines = [
    "Plan a personalised trip with these inputs:",
    `- Destination: ${destination}`,
    `- Duration: ${duration} day${duration === 1 ? "" : "s"}`,
    `- Number of travelers: ${travelers}`,
    `- Budget tier: ${budget}`,
    `- Travel style / pace: ${travelStyle}`,
    `- Interests: ${safeJoin(interests, "general sightseeing")}`,
    `- Transport preference: ${transport}`,
    `- Food preference: ${food}`,
  ];
  if (season) lines.push(`- Time of year / season: ${season}`);
  if (prompt && prompt.trim()) {
    lines.push(`- Traveler's own description / vibe: "${prompt.trim()}"`);
  }

  lines.push("");
  lines.push("Style guidance:");
  if (styleHint) lines.push(`- ${styleHint}`);
  if (transportHint) lines.push(`- ${transportHint}`);
  if (foodHint) lines.push(`- ${foodHint}`);

  lines.push("");
  lines.push(
    `Return the trip as a single JSON object exactly matching the schema. The "days" array must contain exactly ${duration} day object${
      duration === 1 ? "" : "s"
    } numbered 1..${duration}.`
  );
  lines.push(
    `Geographic anchor: every single activity, hotel, restaurant, and place name in this trip MUST be located in or directly adjacent to "${destination}". The tripTitle MUST contain "${destination}" (or a specific neighbourhood within it) — do not substitute another region's name. If the interests don't naturally fit "${destination}", adapt them to local equivalents rather than relocating the trip. Output ONLY the JSON.`
  );

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: lines.join("\n"),
  };
}

/**
 * Build a corrective re-prompt for the case where the first response failed
 * the geographic-consistency validator. We feed back what was wrong so the
 * model can self-correct rather than rolling the dice again.
 *
 * @param {object} input             original user input
 * @param {string} reason            short explanation of the prior failure
 *                                    (e.g. "title mentioned Karakoram but
 *                                    no day visits that region")
 */
export function buildCorrectivePrompt(input, reason) {
  const original = buildTripPrompt(input);
  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: [
      `Your previous response failed geographic consistency: ${reason}.`,
      "",
      "Generate the plan again. This time:",
      `- The tripTitle MUST contain "${input.destination}" (case-insensitive) or a neighbourhood within it.`,
      "- Do NOT name any region, city, or landmark that does not appear in the day activities.",
      "- If the user's interests would normally suggest a famous distant region, satisfy them with realistic local equivalents at the destination.",
      "",
      original.prompt,
    ].join("\n"),
  };
}

/**
 * Build a prompt that asks Gemini to revise a generated trip given a user
 * note (used by the regenerate/chat-assistant features).
 */
export function buildRevisionPrompt({ currentTrip, instruction, input }) {
  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: [
      "You previously generated this trip plan:",
      "```json",
      JSON.stringify(currentTrip, null, 2),
      "```",
      "",
      `The traveler now asks: "${instruction}"`,
      "",
      `Original inputs — destination ${input.destination}, ${input.duration} days, ${input.budget} budget, ${input.travelStyle} pace, interests ${safeJoin(
        input.interests
      )}.`,
      "",
      "Return the FULL revised trip plan as a single JSON object matching the same schema. Preserve unrelated fields. Output ONLY the JSON.",
    ].join("\n"),
  };
}
