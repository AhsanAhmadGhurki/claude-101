import destinations from "../../mocks/destinations.json";

const DESTINATION_OPTIONS = Object.keys(destinations).map((key) => ({
  value: key,
  label: destinations[key].name,
}));

const QUESTIONS = {
  destination: {
    text: "Where would you like to go?",
    options: DESTINATION_OPTIONS,
  },
  budget: {
    text: "What's your budget level?",
    options: [
      { value: "low", label: "Backpacker" },
      { value: "medium", label: "Comfortable" },
      { value: "luxury", label: "Premium" },
    ],
  },
  interests: {
    text: "What interests you most?",
    options: [
      { value: "adventure", label: "Adventure" },
      { value: "nature", label: "Nature" },
      { value: "culture", label: "Culture" },
      { value: "food", label: "Food" },
      { value: "photography", label: "Photography" },
      { value: "family", label: "Family-friendly" },
    ],
    multi: true,
  },
  season: {
    text: "When are you traveling?",
    options: [
      { value: "spring", label: "Spring" },
      { value: "summer", label: "Summer" },
      { value: "autumn", label: "Autumn" },
      { value: "winter", label: "Winter" },
    ],
  },
  days: {
    text: "How many days do you have?",
    options: [
      { value: 2, label: "2 days" },
      { value: 3, label: "3 days" },
      { value: 5, label: "5 days" },
      { value: 7, label: "A week" },
    ],
  },
};

export function getFollowUps(parsed) {
  return parsed.missing.map((key) => ({ key, ...QUESTIONS[key] }));
}

export function getQuestion(key) {
  return QUESTIONS[key];
}
