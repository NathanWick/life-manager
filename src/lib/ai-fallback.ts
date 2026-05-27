import { getLocationSuggestions } from "@/lib/location-suggestions";
import { questXpReward } from "@/lib/gamification";
import { buildActionableQuest } from "@/lib/quest-resources";
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

type SuggestedQuest = {
  title: string;
  description: string;
  type: QuestType;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  xpReward: number;
  goalId?: string;
  locationContext?: string;
  actionSteps?: string[];
  resourceUrl?: string;
  resourceLabel?: string;
  suggestedByAI: boolean;
};

function pushActionableQuest(
  list: SuggestedQuest[],
  goal: LifeGoal | null,
  opts?: { questType?: QuestType; difficulty?: "easy" | "medium" | "hard"; includeVideo?: boolean }
) {
  const draft = buildActionableQuest(goal?.title ?? "today", {
    goalTitle: goal?.title,
    category: goal?.category,
    questType: opts?.questType ?? "daily",
    difficulty: opts?.difficulty ?? "medium",
    includeVideo: opts?.includeVideo,
  });
  list.push({
    title: draft.title,
    description: draft.description,
    type: draft.questType,
    difficulty: draft.difficulty,
    estimatedMinutes: draft.estimatedMinutes,
    xpReward: questXpReward(draft.difficulty, draft.questType),
    goalId: goal?.id,
    actionSteps: draft.actionSteps,
    resourceUrl: draft.resourceUrl,
    resourceLabel: draft.resourceLabel,
    suggestedByAI: true,
  });
}

function looksLikeIntrospectiveQuery(msg: string): boolean {
  return /\b(what(?:'s| is| are) my|what (?:level|streak)|how am i|my progress|my stats|my level|my streak|show me my|tell me about my|summarize|summary|status|check.?in|how(?:'m| am) i doing)\b/i.test(msg);
}

function handleIntrospectiveQuery(input: GenerateReplyInput): string | null {
  const { message, goals, streak, level } = input;
  const lower = message.toLowerCase();

  if (/\bnorth\s*star\b/i.test(lower) && /\b(what|show|tell|my)\b/i.test(lower)) {
    const highPriority = goals.filter((g) => g.priority === "high");
    if (goals.length === 0) {
      return "You haven't set a north star yet. Tell me what you want most in life and I'll create it for you.";
    }
    const primary = highPriority[0] ?? goals[0];
    const others = goals.filter((g) => g.id !== primary.id);
    let reply = `Your north star is "${primary.title}" (${primary.category}, ${primary.progress}% progress). ${primary.whyItMatters}`;
    if (others.length > 0) {
      reply += `\n\nYou also have ${others.length} other goal${others.length > 1 ? "s" : ""}: ${others.map((g) => `"${g.title}" (${g.progress}%)`).join(", ")}.`;
    }
    return reply;
  }

  if (/\b(what(?:'s| is| are) my goal|my goals|show.*goals|list.*goals|tell me.*goals)\b/i.test(lower)) {
    if (goals.length === 0) {
      return "You don't have any goals yet. Tell me what you want to achieve — like \"I want to get fit\" or \"My north star is financial freedom\" — and I'll create it.";
    }
    const lines = goals.map(
      (g) => `• "${g.title}" — ${g.category}, ${g.priority} priority, ${g.progress}% done`
    );
    return `You have ${goals.length} goal${goals.length > 1 ? "s" : ""}:\n\n${lines.join("\n")}\n\nSay "give me quests for today" to take action on any of these.`;
  }

  if (/\b(how am i|how(?:'m| am) i doing|my progress|my stats|status|check.?in|summarize|summary)\b/i.test(lower)) {
    const completedGoals = goals.filter((g) => g.progress >= 100).length;
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
      : 0;
    let reply = `Here's your status:\n\n`;
    reply += `• Level ${level} · ${streak}-day streak\n`;
    reply += `• ${goals.length} goal${goals.length !== 1 ? "s" : ""} (${avgProgress}% average progress)\n`;
    if (completedGoals > 0) reply += `• ${completedGoals} goal${completedGoals > 1 ? "s" : ""} completed!\n`;
    if (streak >= 7) reply += `\n🔥 You're on fire with a ${streak}-day streak!`;
    else if (streak >= 3) reply += `\nNice consistency — ${streak} days in a row.`;
    else if (streak === 0) reply += `\nLet's start a streak today — complete one quest.`;
    if (goals.length > 0) {
      const topGoal = goals.reduce((best, g) => g.progress > best.progress ? g : best, goals[0]);
      reply += `\n\nClosest to completion: "${topGoal.title}" at ${topGoal.progress}%.`;
    }
    return reply;
  }

  if (/\b(my level|my xp|my streak|what level|what(?:'s| is) my level)\b/i.test(lower)) {
    return `You're Level ${level} with a ${streak}-day streak. ${streak > 0 ? "Keep it going!" : "Complete a quest today to start a streak."}`;
  }

  return null;
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
  suggestedQuests: SuggestedQuest[];
} {
  const { message, goals, streak, level, hasLocation } = input;
  const lower = message.toLowerCase();
  const suggestedQuests: SuggestedQuest[] = [];
  const suggestedGoals: NonNullable<
    ReturnType<typeof generateFallbackReply>["suggestedGoals"]
  > = [];

  if (looksLikeIntrospectiveQuery(message)) {
    const introspective = handleIntrospectiveQuery(input);
    if (introspective) {
      return { content: introspective, suggestedQuests: [] };
    }
  }

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
    const isNorthStar = /\bnorth\s*star\b/i.test(message);
    let content = isNorthStar
      ? `Your north star is set: "${parsedGoal.title}". It's on your Goals tab.`
      : `Created your goal "${parsedGoal.title}" — no form needed.`;
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
          actionSteps: q.actionSteps,
          resourceUrl: q.resourceUrl,
          resourceLabel: q.resourceLabel,
          suggestedByAI: true,
        });
      }
      if (quests.length > 0) {
        content += ` Added ${quests.length} actionable quest${quests.length > 1 ? "s" : ""} with steps and links.`;
      }
    } else {
      content +=
        ' Say "give me 2 quests for today" for follow-along tasks (with YouTube links).';
    }
    return { content, suggestedGoals, suggestedQuests };
  }

  if (goals.length === 0 && !looksLikeGoalIntent(message)) {
    return {
      content:
        'Tell me your north star in plain English — e.g. "I want a six pack" or "My north star is financial freedom" — and I\'ll create the goal for you.',
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
        actionSteps: q.actionSteps,
        resourceUrl: q.resourceUrl,
        resourceLabel: q.resourceLabel,
        suggestedByAI: true,
      });
    }
    return {
      content:
        quests.length > 0
          ? `Added ${quests.length} actionable quest${quests.length > 1 ? "s" : ""} — open Quests for steps and YouTube links.`
          : "Tell me what you'd like to do today.",
      suggestedQuests,
    };
  }

  if (!topGoal) {
    return {
      content:
        'Describe your north star — e.g. "My north star is to get a six pack" — and I\'ll add it as a goal.',
      suggestedQuests: [],
    };
  }

  let content = "";

  if (lower.includes("overwhelm") || lower.includes("stuck") || lower.includes("hard")) {
    content = `Level ${level}, ${streak}-day streak — you've got this. One small quest for "${topGoal.title}":`;
    pushActionableQuest(suggestedQuests, goals[0] ?? topGoal, {
      difficulty: "easy",
      includeVideo: false,
    });
  } else if (lower.includes("week") || lower.includes("plan")) {
    content = `Weekly plan for "${topGoal.title}":`;
    pushActionableQuest(suggestedQuests, goals[0] ?? topGoal, {
      questType: "weekly",
      includeVideo: false,
    });
  } else if (hasLocation || lower.includes("near") || lower.includes("location")) {
    const loc = getLocationSuggestions()[0];
    content = loc.message;
    suggestedQuests.push({
      title: loc.questTitle,
      description: loc.questDescription,
      type: "daily",
      difficulty: loc.difficulty,
      estimatedMinutes: loc.estimatedMinutes,
      xpReward: questXpReward(loc.difficulty, "daily"),
      locationContext: loc.context,
      goalId: goals[0]?.id,
      actionSteps: [
        "Head to the suggested spot or your nearest option.",
        "Spend the time block on your goal.",
        "Mark complete when done.",
      ],
      suggestedByAI: true,
    });
  } else {
    content = `Today's actionable quest for "${topGoal.title}":`;
    pushActionableQuest(suggestedQuests, goals[0] ?? topGoal);
  }

  content += " Check Quests for steps and links.";

  return { content, suggestedGoals, suggestedQuests };
}
