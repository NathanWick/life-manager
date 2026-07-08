import { questXpReward } from "@/lib/gamification";
import {
  GoalCategory,
  GoalPriority,
  QuestDifficulty,
  QuestType,
} from "@/types";

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_goal",
      description:
        "Create a long-term life goal / north star (months or years).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
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
          whyItMatters: { type: "string" },
        },
        required: ["title", "category", "priority", "whyItMatters"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_quest",
      description: "Create a short actionable quest for today or this week.",
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
            description: "Existing goal title to link, if any",
          },
        },
        required: [
          "title",
          "description",
          "type",
          "difficulty",
          "estimatedMinutes",
        ],
      },
    },
  },
];

export interface ParsedCreateGoal {
  type: "create_goal";
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
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
        category: (args.category as GoalCategory) || "other",
        priority: (args.priority as GoalPriority) || "medium",
        whyItMatters: String(args.whyItMatters || "It matters to you."),
        progress: 0,
      };
    }

    if (name === "create_quest") {
      const difficulty = (args.difficulty as QuestDifficulty) || "medium";
      const questType = (args.type as QuestType) || "daily";
      const goalTitle = args.goalTitle ? String(args.goalTitle) : undefined;
      return {
        type: "create_quest",
        title: String(args.title),
        description: String(args.description || args.title),
        questType,
        difficulty,
        estimatedMinutes: Number(args.estimatedMinutes) || 15,
        xpReward: questXpReward(difficulty, questType),
        goalId: goalTitle
          ? goalIdByTitle.get(goalTitle.toLowerCase())
          : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function toolResultMessage(action: AgentAction): string {
  if (action.type === "create_goal") {
    return `Created goal "${action.title}".`;
  }
  return `Created ${action.questType} quest "${action.title}" (+${action.xpReward} XP).`;
}
