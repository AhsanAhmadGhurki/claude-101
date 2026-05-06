import { parseInput } from "./parser.js";
import { planTrip } from "./planner.js";
import { formatTrip } from "./output.js";

export async function generateTrip({
  prompt = "",
  overrides = {},
  simulateLatencyMs = 600,
} = {}) {
  if (simulateLatencyMs) {
    await new Promise((r) => setTimeout(r, simulateLatencyMs));
  }
  const parsed = parseInput({ prompt, overrides });
  const plan = planTrip(parsed);
  return formatTrip(parsed, plan);
}

export function generateTripSync({ prompt = "", overrides = {} } = {}) {
  const parsed = parseInput({ prompt, overrides });
  const plan = planTrip(parsed);
  return formatTrip(parsed, plan);
}

export { parseInput, planTrip, formatTrip };
