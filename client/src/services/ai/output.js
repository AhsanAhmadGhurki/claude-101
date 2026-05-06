import { getFollowUps } from "./followups.js";

const TYPE_FROM_INTERESTS = [
  { type: "Adventure", interests: ["adventure", "trekking"] },
  { type: "Road Trip", interests: ["road-trip"] },
  { type: "Culture", interests: ["culture", "festival"] },
  { type: "Relax", interests: ["family"] },
];

function deriveTripType(parsed) {
  for (const rule of TYPE_FROM_INTERESTS) {
    if (rule.interests.some((i) => parsed.interests.includes(i))) return rule.type;
  }
  return "Adventure";
}

function buildSummary(parsed, plan) {
  const interests = parsed.interests.length
    ? parsed.interests.slice(0, 3).join(", ")
    : "scenic exploration";
  const budgetLabel =
    { low: "budget-friendly", medium: "comfortable", luxury: "premium" }[
      parsed.budget
    ] || "well-paced";
  return `A ${parsed.days}-day ${budgetLabel} trip through ${plan.destination.name} focused on ${interests}.`;
}

function buildPackingList(parsed, plan) {
  const base = plan.destination.packing.slice();
  if (parsed.interests.includes("photography")) base.push("Camera + extra batteries");
  if (parsed.interests.includes("adventure")) base.push("First-aid kit", "Trekking poles");
  if (parsed.season === "winter") base.push("Insulated gloves", "Thermal base layer");
  if (parsed.season === "summer") base.push("Light breathable clothing");
  return [...new Set(base)];
}

function buildTips(parsed, plan) {
  const tips = plan.destination.tips.slice();
  if (parsed.budget === "low") {
    tips.push("Use shared jeeps and PTDC stops to keep costs down");
  }
  if (parsed.budget === "luxury") {
    tips.push("Pre-book premium hotels — high season fills up fast");
  }
  if (parsed.season === "winter" && !plan.destination.seasons.includes("winter")) {
    tips.push("This destination is best avoided in deep winter — many roads close");
  }
  return tips;
}

export function formatTrip(parsed, plan) {
  if (plan.unresolved) {
    const hint = plan.requestedHint;
    const summary = hint
      ? `I don't have detailed data for "${hint}" yet. Pick one of the cities below to plan your trip.`
      : "Tell me which Pakistani city or region you'd like to visit and I'll plan it.";
    return {
      id: `trip-${Date.now()}`,
      prompt: parsed.rawPrompt,
      unresolved: true,
      reason: plan.reason,
      requestedHint: hint,
      destination: null,
      region: null,
      tripType: null,
      summary,
      parsedInput: parsed,
      days: [],
      packingList: [],
      tips: [],
      budget: null,
      followUps: getFollowUps(parsed),
      confidence: parsed.confidence,
    };
  }

  return {
    id: `trip-${Date.now()}`,
    prompt: parsed.rawPrompt,
    unresolved: false,
    destination: plan.destination.name,
    region: plan.destination.region,
    tripType: deriveTripType(parsed),
    summary: buildSummary(parsed, plan),
    parsedInput: parsed,
    days: plan.days,
    packingList: buildPackingList(parsed, plan),
    tips: buildTips(parsed, plan),
    budget: {
      tier: parsed.budget,
      perDay: plan.estimatedCost.perDay,
      total: plan.estimatedCost.total,
      currency: plan.estimatedCost.currency,
    },
    followUps: getFollowUps(parsed),
    confidence: parsed.confidence,
  };
}
