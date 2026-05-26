import { getLocationSuggestions } from "@/lib/location-suggestions";
import { questXpReward } from "@/lib/gamification";
import {
  parseGoalFromMessage,
  parseQuestsFromMessage,
  looksLikeGoalIntent,
  looksLikeQuestOnlyIntent,
} from "@/lib/parse-natural-language";
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
  suggestedGoals?: Array<{
    title: string;
    category: LifeGoal["category"];
    priority: LifeGoal["priority"];
    whyItMatters: string;
    progress: number;
  }>;
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
  const suggestedGoals: NonNullable<
    ReturnType<typeof generateFallbackReply>["suggestedGoals"]
  > = [];

  const parsedGoal = parseGoalFromMessage(message);
  if (parsedGoal) {
    suggestedGoals.push({
      title: parsedGoal.title,
      category: parsedGoal.category,
      priority: parsedGoal.priority,
      whyItMatters: parsedGoal.whyItMatters,
      progress: 0,
    });
  }

  const topGoal =
    goals[0] ??
    (suggestedGoals[0]
      ? ({
          id: "__pending__",
          title: suggestedGoals[0].title,
          category: suggestedGoals[0].category,
          priority: suggestedGoals[0].priority,
          whyItMatters: suggestedGoals[0].whyItMatters,
          progress: 0,
          createdAt: "",
          updatedAt: "",
        } as LifeGoal)
      : null);

  if (parsedGoal) {
    let content = `Done — I created your goal "${parsedGoal.title}" for you. No form needed.`;
    if (looksLikeQuestOnlyIntent(message) || /\b(quest|today)\b/i.test(message)) {
      const quests = parseQuestsFromMessage(message, topGoal ? [topGoal] : []);
      for (const q of quests) {
        if (q.type !== "create_quest") continue;
        suggestedQuests.push({
          title: q.title,
          description: q.description,
          type: q.questType,
          difficulty: q.difficulty,
          estimatedMinutes: q.estimatedMinutes,
          xpReward: q.xpReward,
          goalId: goals[0]?.id,
          suggestedByAI: true,
        });
      }
      if (quests.length > 0) {
        content += ` I also added ${quests.length} quest${quests.length > 1 ? "s" : ""} to get you started.`;
      }
    } else {
      content +=
        " Want a couple of short quests for this week? Just say something like “give me 2 quests for today.”";
    }
    return { content, suggestedGoals, suggestedQuests };
  }

  if (goals.length === 0 && !looksLikeGoalIntent(message)) {
    return {
      content:
        "Tell me what you're working toward in plain English — e.g. “I want to get fitter and have more energy” — and I'll create the goal for you automatically.",
      suggestedQuests: [],
    };
  }

  if (looksLikeQuestOnlyIntent(message) || /\d+\s*quest/i.test(message)) {
    const quests = parseQuestsFromMessage(message, goals);
    for (const q of quests) {
      if (q.type !== "create_quest") continue;
      suggestedQuests.push({
        title: q.title,
        description: q.description,
        type: q.questType,
        difficulty: q.difficulty,
        estimatedMinutes: q.estimatedMinutes,
        xpReward: q.xpReward,
        goalId: q.goalId,
        suggestedByAI: true,
      });
    }
    return {
      content:
        quests.length > 0
          ? `Added ${quests.length} short-term quest${quests.length > 1 ? "s" : ""} for you — check the Quests tab.`
          : "Tell me what you'd like to accomplish today and I'll add quests for you.",
      suggestedQuests,
    };
  }

  if (!topGoal) {
    return {
      content:
        "Describe a life goal in your own words and I'll add it — no forms required.",
      suggestedQuests: [],
    };
  }

  let content = "";

  if (lower.includes("overwhelm") || lower.includes("stuck") || lower.includes("hard")) {
    content = `You're at Level ${level} with a ${streak}-day streak — that counts. Here's a tiny quest for "${topGoal.title}".`;
    suggestedQuests.push({
      title: `5-minute step: ${topGoal.title}`,
      description: `Smallest possible action toward "${topGoal.title}".`,
      type: "daily",
      difficulty: "easy",
      estimatedMinutes: 5,
      xpReward: questXpReward("easy", "daily"),
      goalId: goals[0]?.id,
      suggestedByAI: true,
    });
  } else if (lower.includes("week") || lower.includes("plan")) {
    content = `Weekly plan for "${topGoal.title}" (${goals[0]?.progress ?? 0}% done):`;
    suggestedQuests.push({
      title: `Weekly checkpoint: ${topGoal.title}`,
      description: `One measurable milestone for "${topGoal.title}" on your calendar.`,
      type: "weekly",
      difficulty: "medium",
      estimatedMinutes: 30,
      xpReward: questXpReward("medium", "weekly"),
      goalId: goals[0]?.id,
      suggestedByAI: true,
    });
  } else if (hasLocation || lower.includes("near") || lower.includes("location")) {
    const loc = getLocationSuggestions()[0];
    content = `${loc.message}`;
    suggestedQuests.push({
      title: loc.questTitle,
      description: loc.questDescription,
      type: "daily",
      difficulty: loc.difficulty,
      estimatedMinutes: loc.estimatedMinutes,
      xpReward: questXpReward(loc.difficulty, "daily"),
      locationContext: loc.context,
      goalId: goals[0]?.id,
      suggestedByAI: true,
    });
  } else {
    content = `Here's a focus for today on "${topGoal.title}".`;
    suggestedQuests.push({
      title: `Daily win: ${topGoal.title}`,
      description: `15 focused minutes on "${topGoal.title}".`,
      type: "daily",
      difficulty: "medium",
      estimatedMinutes: 15,
      xpReward: questXpReward("medium", "daily"),
      goalId: goals[0]?.id,
      suggestedByAI: true,
    });
  }

  content += " (Added automatically — check Quests.)";

  return { content, suggestedGoals, suggestedQuests };
}
