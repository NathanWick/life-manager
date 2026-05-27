import { questXpReward } from "@/lib/gamification";
import {
  GoalCategory,
  GoalPriority,
  QuestDifficulty,
  QuestType,
} from "@/types";

/** OpenAI-compatible tool definitions for the Life Agent */
export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_goal",
      description:
        "Create a LONG-TERM life goal (north star): months/years horizon. Use when user describes a dream, north star, life direction, or says 'I want to…' for something big. NEVER create a quest that tells them to fill a form.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short goal title" },
          category: {
            type: "string",
            enum: [
              "health",
              "career",
              "relationships",
              "finance",
              "learning",
              "creativity",
              "mindfulness",
              "other",
            ],
          },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          deadline: {
            type: "string",
            description: "ISO date YYYY-MM-DD if mentioned",
          },
          whyItMatters: {
            type: "string",
            description: "Why this goal matters emotionally",
          },
          progress: {
            type: "number",
            description: "Current progress 0-100, default 0",
          },
        },
        required: ["title", "category", "priority", "whyItMatters"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_quest",
      description:
        "Create a SHORT-TERM quest: specific actionable task for today/this week. Include concrete steps and a YouTube search link when learning, fitness, or how-to applies. Never tell user to 'go to Goals section'.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["daily", "weekly"] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          estimatedMinutes: { type: "number" },
          goalTitle: {
            type: "string",
            description: "Existing goal title to link",
          },
          actionSteps: {
            type: "array",
            items: { type: "string" },
            description: "2-4 concrete steps",
          },
          resourceUrl: {
            type: "string",
            description: "YouTube search URL or helpful link",
          },
          resourceLabel: {
            type: "string",
            description: "e.g. 'Watch on YouTube'",
          },
        },
        required: ["title", "description", "type", "difficulty", "estimatedMinutes"],
        additionalProperties: false,
      },
    },
  },
];

export interface ParsedCreateGoal {
  type: "create_goal";
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  deadline?: string;
  whyItMatters: string;
  progress: number;
}

export interface ParsedCreateQuest {
  type: "create_quest";
  title: string;
  description: string;
  questType: QuestType;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  goalId?: string;
  actionSteps?: string[];
  resourceUrl?: string;
  resourceLabel?: string;
  suggestedByAI: true;
}

export type AgentAction = ParsedCreateGoal | ParsedCreateQuest;

export function parseToolCall(
  name: string,
  argsJson: string,
  goalIdByTitle: Map<string, string>
): AgentAction | null {
  try {
    const args = JSON.parse(argsJson) as Record<string, unknown>;

    if (name === "create_goal" || name === "create_north_star") {
      return {
        type: "create_goal",
        title: String(args.title),
        category: args.category as GoalCategory,
        priority: args.priority as GoalPriority,
        deadline: args.deadline ? String(args.deadline) : undefined,
        whyItMatters: String(args.whyItMatters),
        progress: typeof args.progress === "number" ? args.progress : 0,
      };
    }

    if (name === "create_quest") {
      const difficulty = args.difficulty as QuestDifficulty;
      const questType = args.type as QuestType;
      const goalTitle = args.goalTitle ? String(args.goalTitle) : undefined;
      const actionSteps = Array.isArray(args.actionSteps)
        ? args.actionSteps.map(String)
        : undefined;
      return {
        type: "create_quest",
        title: String(args.title),
        description: String(args.description),
        questType,
        difficulty,
        estimatedMinutes: Number(args.estimatedMinutes) || 15,
        xpReward: questXpReward(difficulty, questType),
        goalId: goalTitle ? goalIdByTitle.get(goalTitle.toLowerCase()) : undefined,
        actionSteps,
        resourceUrl: args.resourceUrl ? String(args.resourceUrl) : undefined,
        resourceLabel: args.resourceLabel ? String(args.resourceLabel) : undefined,
        suggestedByAI: true,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function toolResultMessage(action: AgentAction): string {
  if (action.type === "create_goal") {
    return `Created life goal "${action.title}" (${action.category}, ${action.priority} priority).`;
  }
  return `Created ${action.questType} quest "${action.title}" (+${action.xpReward} XP).`;
}
