import destinations from "../../../client/src/mocks/destinations.json";

const STYLE_BUDGET = {
  relaxed: { activitiesPerDay: 2, includeMeal: true, includeRest: true },
  balanced: { activitiesPerDay: 3, includeMeal: true, includeRest: false },
  packed: { activitiesPerDay: 4, includeMeal: true, includeRest: false },
};

const TIMING_ORDER = ["morning", "midday", "afternoon", "evening", "fullday", "overnight"];

function rankSpot(spot, parsed) {
  let score = 0;
  if (parsed.interests.length) {
    const overlap = spot.tags.filter((t) => parsed.interests.includes(t)).length;
    score += overlap * 10;
  } else {
    score += 5;
  }
  if (parsed.style === "relaxed" && spot.type === "casual") score += 3;
  if (parsed.style === "packed" && (spot.type === "hike" || spot.type === "expedition")) score += 3;
  if (spot.timing === "fullday" && parsed.style !== "relaxed") score += 2;
  return score;
}

function pickActivitiesForDay(spotsPool, used, count) {
  const available = spotsPool.filter((s) => !used.has(s.name));
  const picks = available.slice(0, count);
  picks.forEach((p) => used.add(p.name));
  return picks;
}

function dayTitle(dayIndex, totalDays, picks) {
  if (dayIndex === 0) return "Arrival & First Light";
  if (dayIndex === totalDays - 1) return "Final Views & Departure";
  if (picks.some((p) => p.tags.includes("photography"))) return "Viewpoints & Vistas";
  if (picks.some((p) => p.tags.includes("culture"))) return "Heritage & Local Life";
  if (picks.some((p) => p.tags.includes("adventure"))) return "Trail & Adventure";
  return `Exploration · Day ${dayIndex + 1}`;
}

function buildTimeline(picks, food, budget) {
  const timeline = [];
  const sorted = [...picks].sort(
    (a, b) => TIMING_ORDER.indexOf(a.timing) - TIMING_ORDER.indexOf(b.timing)
  );
  sorted.forEach((p) => {
    timeline.push({
      time: timingLabel(p.timing),
      label: p.name,
      type: p.type,
      duration: p.duration,
    });
  });
  const meal = food.find((f) => f.tier === budget) || food[0];
  if (meal) {
    timeline.push({
      time: "Dinner",
      label: meal.name,
      type: "meal",
      duration: "1.5h",
    });
  }
  return timeline;
}

function timingLabel(timing) {
  return (
    {
      morning: "Morning",
      midday: "Midday",
      afternoon: "Afternoon",
      evening: "Evening",
      fullday: "Full day",
      overnight: "Overnight",
    }[timing] || "Anytime"
  );
}

export function planTrip(parsed) {
  const key = parsed.destinationKey;
  const dest = key ? destinations[key] : null;

  if (!dest) {
    return {
      unresolved: true,
      reason: key ? "unknown-destination" : "missing-destination",
      destinationKey: null,
      destination: null,
      requestedHint: parsed.unrecognizedDestination ?? null,
      days: [],
      estimatedCost: null,
    };
  }

  const config = STYLE_BUDGET[parsed.style] || STYLE_BUDGET.balanced;
  const rankedSpots = [...dest.spots]
    .map((s) => ({ spot: s, score: rankSpot(s, parsed) }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.spot);

  const used = new Set();
  const days = [];
  for (let i = 0; i < parsed.days; i++) {
    const picks = pickActivitiesForDay(rankedSpots, used, config.activitiesPerDay);
    if (!picks.length && rankedSpots.length) {
      used.clear();
      picks.push(...pickActivitiesForDay(rankedSpots, used, config.activitiesPerDay));
    }
    days.push({
      day: i + 1,
      title: dayTitle(i, parsed.days, picks),
      activities: picks.map((p) => p.name),
      timeline: buildTimeline(picks, dest.food, parsed.budget),
      stay: pickStay(dest, parsed.budget),
    });
  }

  validatePlan(days, dest);

  return {
    unresolved: false,
    destinationKey: key,
    destination: dest,
    days,
    estimatedCost: estimateCost(parsed, dest),
  };
}

function validatePlan(days, dest) {
  const validSpots = new Set(dest.spots.map((s) => s.name));
  const validFood = new Set(dest.food.map((f) => f.name));
  for (const day of days) {
    for (const a of day.activities) {
      if (!validSpots.has(a)) {
        throw new Error(
          `Plan validation failed: "${a}" is not a known spot in ${dest.name}`
        );
      }
    }
    for (const t of day.timeline) {
      if (t.type === "meal" && !validFood.has(t.label)) {
        throw new Error(
          `Plan validation failed: meal "${t.label}" is not in ${dest.name}'s food list`
        );
      }
    }
  }
}

function pickStay(dest, budget) {
  const tier = dest.stay[budget] || dest.stay.medium || dest.stay.low;
  return tier?.[0] || null;
}

function estimateCost(parsed, dest) {
  const perDay = dest.dailyCost?.[parsed.budget] ?? dest.dailyCost?.medium ?? 25000;
  return {
    perDay,
    total: perDay * parsed.days,
    currency: "PKR",
  };
}
