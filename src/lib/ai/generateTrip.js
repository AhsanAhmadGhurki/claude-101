import mockTrip from "../../mocks/trip.json";

const DAY_TITLES = [
  "Arrival & Acclimatization",
  "Trail & Discovery",
  "High Points & Sunsets",
  "Hidden Spots & Locals",
  "Final Push & Return",
];

function extractDestination(prompt) {
  const match = prompt.match(
    /(hunza|skardu|fairy meadows|naran|kaghan|swat|murree|chitral|gilgit|naltar|attabad|cholistan|kalash)/i
  );
  return match ? match[0].replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

function extractDays(prompt) {
  const match = prompt.match(/(\d+)\s*-?\s*day/i);
  return match ? Math.min(Math.max(parseInt(match[1], 10), 1), 5) : 3;
}

export async function generateTrip({ prompt = "", tripType } = {}) {
  await new Promise((r) => setTimeout(r, 1600));

  const destination = extractDestination(prompt) || mockTrip.destination;
  const dayCount = extractDays(prompt);
  const baseDays = mockTrip.days;
  const days = Array.from({ length: dayCount }, (_, i) => {
    const base = baseDays[i % baseDays.length];
    return {
      day: i + 1,
      title: DAY_TITLES[i] || base.title,
      activities: base.activities,
    };
  });

  return {
    ...mockTrip,
    id: `trip-${Date.now()}`,
    prompt: prompt || mockTrip.prompt,
    tripType: tripType ?? mockTrip.tripType,
    destination,
    summary: `A ${dayCount}-day adventure through ${destination} featuring local culture, scenic routes, and unforgettable views.`,
    days,
  };
}
