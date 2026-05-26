import { getLocationSuggestions } from "@/lib/location-suggestions";
import { questXpReward } from "@/lib/gamification";
import { LifeGoal, QuestType } from "@/types";

interface GenerateReplyInput {
  message: string;
  goals: LifeGoal[];
  streak: number;
  level: number;
  hasLocation: boolean;
}

export function generateFallbackReply(input: GenerateReplyInput): {
  content: string;
  suggestedQuests: Array<{
    title: string;
    description: string;
    type: QuestType;
    difficulty: "easy" | "medium" | "hard";
    estimatedMinutes: number;
    xpReward: number;
    goalId?: string;
    locationContext?: string;
    suggestedByAI: boolean;
  }>;
} {
  const { message, goals, streak, level, hasLocation } = input;
  const lower = message.toLowerCase();
  const suggestedQuests: ReturnType<typeof generateFallbackReply>["suggestedQuests"] =
    [];

  let content =
    "I'm your Life Agent — here to help you turn big dreams into small, winnable quests. ";

  if (goals.length === 0) {
    content +=
      "You haven't set any life goals yet. Head to **Goals** and add one or two that matter most. Then I can suggest daily quests tailored to you!";
    suggestedQuests.push({
      title: "Define your north star",
      description:
        "Write down one life goal and why it matters to you in the Goals section.",
      type: "daily",
      difficulty: "easy",
      estimatedMinutes: 10,
      xpReward: questXpReward("easy", "daily"),
      suggestedByAI: true,
    });
    return { content, suggestedQuests };
  }

  const topGoal =
    [...goals].sort((a, b) => {
      const p = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    })[0];

  if (lower.includes("overwhelm") || lower.includes("stuck") || lower.includes("hard")) {
    content += `Feeling stuck is normal — you're at **Level ${level}** with a **${streak}-day streak**, which already shows commitment. Let's shrink "${topGoal.title}" into one tiny step you can finish today.`;
    suggestedQuests.push({
      title: `5-minute step: ${topGoal.title}`,
      description: `Do the smallest possible action toward "${topGoal.title}" — even 5 minutes counts.`,
      type: "daily",
      difficulty: "easy",
      estimatedMinutes: 5,
      xpReward: questXpReward("easy", "daily"),
      goalId: topGoal.id,
      suggestedByAI: true,
    });
  } else if (lower.includes("week") || lower.includes("plan")) {
    content += `Here's a weekly plan angle for **${topGoal.category}** goal "${topGoal.title}" (${topGoal.progress}% done). Break it into 3 checkpoints this week.`;
    suggestedQuests.push({
      title: `Weekly checkpoint: ${topGoal.title}`,
      description: `Set one measurable milestone for "${topGoal.title}" and schedule it on your calendar.`,
      type: "weekly",
      difficulty: "medium",
      estimatedMinutes: 30,
      xpReward: questXpReward("medium", "weekly"),
      goalId: topGoal.id,
      suggestedByAI: true,
    });
  } else if (hasLocation || lower.includes("near") || lower.includes("location")) {
    const loc = getLocationSuggestions()[0];
    content += `${loc.message} Want to try a location-based quest?`;
    suggestedQuests.push({
      title: loc.questTitle,
      description: loc.questDescription,
      type: "daily",
      difficulty: loc.difficulty,
      estimatedMinutes: loc.estimatedMinutes,
      xpReward: questXpReward(loc.difficulty, "daily"),
      locationContext: loc.context,
      goalId: topGoal.id,
      suggestedByAI: true,
    });
  } else {
    content += `Based on your **${topGoal.category}** priority goal "${topGoal.title}" (${topGoal.progress}% complete), here's what I'd focus on today. Remember: ${topGoal.whyItMatters}`;
    suggestedQuests.push({
      title: `Daily win: ${topGoal.title}`,
      description: `Spend 15 focused minutes on "${topGoal.title}" — no perfection required.`,
      type: "daily",
      difficulty: "medium",
      estimatedMinutes: 15,
      xpReward: questXpReward("medium", "daily"),
      goalId: topGoal.id,
      suggestedByAI: true,
    });
    if (goals.length > 1) {
      const second = goals.find((g) => g.id !== topGoal.id);
      if (second) {
        suggestedQuests.push({
          title: `Bonus: ${second.title}`,
          description: `Quick 10-minute touch on "${second.title}" to keep momentum.`,
          type: "daily",
          difficulty: "easy",
          estimatedMinutes: 10,
          xpReward: questXpReward("easy", "daily"),
          goalId: second.id,
          suggestedByAI: true,
        });
      }
    }
  }

  content +=
    "\n\nTap **Add to quests** on any suggestion below, or ask me to break a specific goal into smaller steps!";

  return { content, suggestedQuests };
}
