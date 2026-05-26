import { QuestDifficulty } from "@/types";

export interface LocationSuggestion {
  message: string;
  questTitle: string;
  questDescription: string;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  context: string;
}

/** Heuristic suggestions when we only have coordinates (no Places API). */
export function getLocationSuggestions(
  hour: number = new Date().getHours()
): LocationSuggestion[] {
  const suggestions: LocationSuggestion[] = [];

  if (hour >= 6 && hour < 10) {
    suggestions.push({
      message: "Good morning! A short walk could energize your day.",
      questTitle: "Morning movement",
      questDescription: "Take a 10-minute walk outside and notice three things you appreciate.",
      difficulty: "easy",
      estimatedMinutes: 10,
      context: "morning",
    });
  }

  if (hour >= 11 && hour < 14) {
    suggestions.push({
      message: "Midday check-in — you're near places to refuel body and mind.",
      questTitle: "Mindful lunch break",
      questDescription: "Eat without screens for 15 minutes and plan one afternoon win.",
      difficulty: "easy",
      estimatedMinutes: 15,
      context: "midday",
    });
  }

  if (hour >= 15 && hour < 18) {
    suggestions.push({
      message: "Afternoon energy dip? A quick movement quest can reset your focus.",
      questTitle: "Quick movement burst",
      questDescription: "Do 20 squats, a short stretch, or a 5-minute walk near you.",
      difficulty: "easy",
      estimatedMinutes: 5,
      context: "afternoon",
    });
  }

  suggestions.push({
    message:
      "You're out in the world — perfect time for a micro-adventure toward your goals.",
    questTitle: "Explore nearby",
    questDescription:
      "Visit a nearby spot (park, café, library) and spend 10 minutes on a goal-related activity.",
    difficulty: "medium",
    estimatedMinutes: 20,
    context: "explore",
  });

  suggestions.push({
    message: "Near a gym or park? Movement quests boost health goals fast.",
    questTitle: "Movement quest",
    questDescription:
      "If you're near a gym or open space, do a 15-minute workout or brisk walk.",
    difficulty: "medium",
    estimatedMinutes: 15,
    context: "fitness-nearby",
  });

  return suggestions;
}

export function formatLocationLabel(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}
