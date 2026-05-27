import type { GoalCategory, QuestDifficulty, QuestType } from "@/types";

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/** Pick a helpful YouTube search query from goal/quest topic */
export function youtubeQueryForTopic(topic: string, category?: GoalCategory): string {
  const t = topic.toLowerCase();
  if (category === "health" || /\b(abs|6 pack|workout|fit|gym|run)\b/i.test(t)) {
    if (/6 pack|abs|core/i.test(t)) {
      return "10 minute beginner abs workout follow along";
    }
    return `${topic} beginner workout follow along`;
  }
  if (category === "learning" || /\blearn|study/i.test(t)) {
    return `how to ${topic} beginner tutorial`;
  }
  if (category === "finance" || /\bsave|money|budget/i.test(t)) {
    return `personal finance ${topic} beginner`;
  }
  if (category === "mindfulness" || /\bmeditat|calm|stress/i.test(t)) {
    return "10 minute guided meditation for beginners";
  }
  return `${topic} how to get started`;
}

export interface ActionableQuestDraft {
  title: string;
  description: string;
  questType: QuestType;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  actionSteps: string[];
  resourceUrl?: string;
  resourceLabel?: string;
}

export function buildActionableQuest(
  topic: string,
  options?: {
    goalTitle?: string;
    category?: GoalCategory;
    questType?: QuestType;
    difficulty?: QuestDifficulty;
    includeVideo?: boolean;
  }
): ActionableQuestDraft {
  const category = options?.category ?? "other";
  const questType = options?.questType ?? "daily";
  const difficulty = options?.difficulty ?? "medium";
  const goal = options?.goalTitle ?? topic;
  const includeVideo = options?.includeVideo !== false;

  const query = youtubeQueryForTopic(goal, category);
  const minutes = difficulty === "easy" ? 10 : difficulty === "hard" ? 25 : 15;

  const actionSteps: string[] = includeVideo
    ? [
        "Open the YouTube link and pick one video (10–20 min).",
        "Follow along for at least half the video.",
        "Write one takeaway in your notes app.",
      ]
    : [
        "Set a 15-minute timer.",
        `Do one concrete action toward "${goal}".`,
        "Mark what you'll repeat tomorrow.",
      ];

  if (category === "health") {
    actionSteps.push("Drink water before and after.");
  }

  let title: string;
  let description: string;

  if (includeVideo && /abs|6 pack|workout|fit|gym/i.test(topic + goal)) {
    title = "Follow-along workout";
    description = `Watch a beginner-friendly video and move with it for ${minutes} minutes toward "${goal}".`;
  } else if (includeVideo) {
    title = `Learn: ${capitalize(topic.slice(0, 40))}`;
    description = `Watch one focused video, then apply one thing immediately for "${goal}".`;
  } else {
    title = `Focus block: ${capitalize(topic.slice(0, 35))}`;
    description = `${minutes}-minute deep work toward "${goal}" — no distractions.`;
  }

  return {
    title,
    description,
    questType,
    difficulty,
    estimatedMinutes: minutes,
    actionSteps,
    resourceUrl: includeVideo ? youtubeSearchUrl(query) : undefined,
    resourceLabel: includeVideo ? "Find video on YouTube" : undefined,
  };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
