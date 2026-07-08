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
  {
    type: "function" as const,
    function: {
      name: "update_quest",
      description:
        "Modify an existing active quest (title, XP, difficulty, duration, etc). Use this instead of creating a duplicate when the user says change/update/modify/make it worth more XP.",
      parameters: {
        type: "object",
        properties: {
          questTitle: {
            type: "string",
            description: "Current title of the quest to update",
          },
          title: { type: "string", description: "New title, if renaming" },
          description: { type: "string" },
          type: { type: "string", enum: ["daily", "weekly"] },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          estimatedMinutes: { type: "number" },
          xpReward: {
            type: "number",
            description:
              "Set XP explicitly (e.g. double current XP). Prefer this when user asks for more/double XP.",
          },
          goalTitle: {
            type: "string",
            description: "Link to an existing goal by title",
          },
        },
        required: ["questTitle"],
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

export interface ParsedUpdateQuest {
  type: "update_quest";
  questId: string;
  questTitle: string;
  title: string;
  updates: {
    title?: string;
    description?: string;
    type?: QuestType;
    difficulty?: QuestDifficulty;
    estimatedMinutes?: number;
    xpReward?: number;
    goalId?: string;
  };
}

export type AgentAction =
  | ParsedCreateGoal
  | ParsedCreateQuest
  | ParsedUpdateQuest;

function findQuestId(
  questTitle: string,
  questIdByTitle: Map<string, string>
): string | undefined {
  const key = questTitle.toLowerCase().trim();
  if (questIdByTitle.has(key)) return questIdByTitle.get(key);
  for (const [title, id] of questIdByTitle) {
    if (title.includes(key) || key.includes(title)) return id;
  }
  return undefined;
}

export function parseToolCall(
  name: string,
  argsJson: string,
  goalIdByTitle: Map<string, string>,
  questIdByTitle: Map<string, string>
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

    if (name === "update_quest") {
      const questTitle = String(args.questTitle || "");
      const questId = findQuestId(questTitle, questIdByTitle);
      if (!questId) return null;

      const updates: ParsedUpdateQuest["updates"] = {};
      if (args.title) updates.title = String(args.title);
      if (args.description) updates.description = String(args.description);
      if (args.type) updates.type = args.type as QuestType;
      if (args.difficulty) updates.difficulty = args.difficulty as QuestDifficulty;
      if (args.estimatedMinutes != null) {
        updates.estimatedMinutes = Number(args.estimatedMinutes);
      }
      if (args.xpReward != null) {
        updates.xpReward = Number(args.xpReward);
      } else if (updates.difficulty || updates.type) {
        const difficulty = updates.difficulty || "medium";
        const questType = updates.type || "daily";
        updates.xpReward = questXpReward(difficulty, questType);
      }
      if (args.goalTitle) {
        updates.goalId = goalIdByTitle.get(
          String(args.goalTitle).toLowerCase()
        );
      }

      if (Object.keys(updates).length === 0) return null;

      return {
        type: "update_quest",
        questId,
        questTitle,
        title: updates.title || questTitle,
        updates,
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
  if (action.type === "update_quest") {
    const bits = Object.entries(action.updates)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return `Updated quest "${action.title}" (${bits}).`;
  }
  return `Created ${action.questType} quest "${action.title}" (+${action.xpReward} XP).`;
}
