import { questXpReward } from "@/lib/gamification";
import type { AgentAction, ParsedCreateGoal } from "@/lib/agent-tools";
import type { GoalCategory, GoalPriority, LifeGoal } from "@/types";

const GOAL_INTENT =
  /\b(goal|dream|aspir|north star|i want to|i'd like to|i would like to|help me become|help me get|working toward|focus on|improve my|build a habit|life goal|long.?term)\b/i;

const QUEST_INTENT =
  /\b(quest|today|tonight|this week|right now|quick win|small step|daily|weekly task|what should i do)\b/i;

const CATEGORY_RULES: { category: GoalCategory; pattern: RegExp }[] = [
  { category: "health", pattern: /\b(fit|health|gym|run|weight|sleep|energy|workout|eat|nutrition)\b/i },
  { category: "career", pattern: /\b(career|job|work|promot|business|interview|salary)\b/i },
  { category: "finance", pattern: /\b(save|money|debt|budget|invest|financial)\b/i },
  { category: "learning", pattern: /\b(learn|study|course|degree|read|skill|language)\b/i },
  { category: "relationships", pattern: /\b(family|friend|partner|relationship|marriage|social)\b/i },
  { category: "creativity", pattern: /\b(create|art|music|write|guitar|paint|design)\b/i },
  { category: "mindfulness", pattern: /\b(meditat|mindful|calm|stress|anxiety|peace)\b/i },
];

function inferCategory(text: string): GoalCategory {
  for (const { category, pattern } of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }
  return "other";
}

function inferPriority(text: string): GoalPriority {
  if (/\b(urgent|asap|critical|top priority|most important)\b/i.test(text)) return "high";
  if (/\b(someday|eventually|nice to have)\b/i.test(text)) return "low";
  return "medium";
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^(?:a|an|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Extract a life goal from conversational text */
export function parseGoalFromMessage(message: string): ParsedCreateGoal | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const patterns = [
    /(?:^|\n)(?:please\s+)?(?:create|add|set|make)\s+(?:a\s+)?(?:new\s+)?goal(?:\s+to|\s+for|:)?\s*(.+)/i,
    /(?:^|\n)(?:my|a)\s+goal\s+is\s+(?:to\s+)?(.+)/i,
    /(?:^|\n)i\s+want\s+(?:a\s+)?(?:new\s+)?goal(?:\s+to|\s+for|:)?\s*(.+)/i,
    /(?:^|\n)i\s+want\s+to\s+(.+)/i,
    /(?:^|\n)i(?:'d| would)\s+like\s+to\s+(.+)/i,
    /(?:^|\n)help\s+me\s+(.+)/i,
    /(?:^|\n)i(?:'m| am)\s+trying\s+to\s+(.+)/i,
    /(?:^|\n)i\s+need\s+to\s+(.+)/i,
  ];

  let extracted: string | null = null;
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1]) {
      extracted = m[1].replace(/[.!?]+$/, "").trim();
      break;
    }
  }

  if (!extracted && looksLikeGoalIntent(trimmed) && !looksLikeQuestOnlyIntent(trimmed)) {
    extracted = trimmed.replace(/[.!?]+$/, "").trim();
  }

  if (!extracted || extracted.length < 4) return null;

  const title = capitalize(cleanTitle(extracted));
  const category = inferCategory(trimmed);
  const priority = inferPriority(trimmed);

  const whyItMatters =
    trimmed.length > 60
      ? trimmed.slice(0, 200)
      : `This matters to me because I want to ${extracted.toLowerCase()}.`;

  return {
    type: "create_goal",
    title,
    category,
    priority,
    whyItMatters,
    progress: 0,
  };
}

export function looksLikeGoalIntent(message: string): boolean {
  if (GOAL_INTENT.test(message)) return true;
  return (
    /\bi want to\b/i.test(message) ||
    /\bi'd like to\b/i.test(message) ||
    /\bhelp me\b/i.test(message)
  );
}

export function looksLikeQuestOnlyIntent(message: string): boolean {
  return QUEST_INTENT.test(message) && !/\b(goal|dream|life)\b/i.test(message);
}

export function parseQuestsFromMessage(
  message: string,
  goals: LifeGoal[]
): AgentAction[] {
  const lower = message.toLowerCase();
  const actions: AgentAction[] = [];
  const topGoal = goals[0];

  const wantsQuests =
    /\b(quest|today|quick|small step|what should i do|give me)\b/i.test(message);
  if (!wantsQuests) return actions;

  const countMatch = message.match(/(\d+)\s*(?:quest|task)/i);
  const count = countMatch ? Math.min(3, parseInt(countMatch[1], 10)) : 1;

  for (let i = 0; i < count; i++) {
    const title = topGoal
      ? `Today's step: ${topGoal.title}`
      : "Quick win for today";
    actions.push({
      type: "create_quest",
      title: count > 1 ? `${title} (${i + 1})` : title,
      description: topGoal
        ? `15 focused minutes on "${topGoal.title}" — small progress counts.`
        : "Pick one meaningful action you can finish in 15 minutes.",
      questType: "daily",
      difficulty: "easy",
      estimatedMinutes: 15,
      xpReward: questXpReward("easy", "daily"),
      goalId: topGoal?.id,
      suggestedByAI: true,
    });
  }

  if (lower.includes("week")) {
    actions.push({
      type: "create_quest",
      title: topGoal ? `Weekly checkpoint: ${topGoal.title}` : "Weekly checkpoint",
      description: "Set one measurable milestone and put it on your calendar.",
      questType: "weekly",
      difficulty: "medium",
      estimatedMinutes: 30,
      xpReward: questXpReward("medium", "weekly"),
      goalId: topGoal?.id,
      suggestedByAI: true,
    });
  }

  return actions;
}

/** Merge NL-parsed actions when the model didn't tool-call */
export function enrichActionsFromNaturalLanguage(
  message: string,
  goals: LifeGoal[],
  existing: AgentAction[]
): AgentAction[] {
  const result = [...existing];
  const hasGoal = existing.some((a) => a.type === "create_goal");
  const hasQuest = existing.some((a) => a.type === "create_quest");

  if (!hasGoal && looksLikeGoalIntent(message) && !looksLikeQuestOnlyIntent(message)) {
    const goal = parseGoalFromMessage(message);
    if (goal) result.unshift(goal);
  }

  if (!hasQuest && (looksLikeQuestOnlyIntent(message) || /\d+\s*quest/i.test(message))) {
    result.push(...parseQuestsFromMessage(message, goals));
  }

  return result;
}
