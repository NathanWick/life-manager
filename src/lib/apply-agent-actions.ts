import type { AgentAction } from "@/lib/agent-tools";
import type { AgentActionSummary } from "@/types";

type AddGoal = (goal: {
  title: string;
  category: import("@/types").GoalCategory;
  priority: import("@/types").GoalPriority;
  deadline?: string;
  whyItMatters: string;
  progress: number;
}) => void;

type AddQuest = (quest: {
  title: string;
  description: string;
  type: import("@/types").QuestType;
  difficulty: import("@/types").QuestDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  goalId?: string;
  suggestedByAI?: boolean;
}) => void;

export function applyAgentActions(
  actions: AgentAction[],
  addGoal: AddGoal,
  addQuest: AddQuest
): AgentActionSummary[] {
  const applied: AgentActionSummary[] = [];

  for (const action of actions) {
    if (action.type === "create_goal") {
      addGoal({
        title: action.title,
        category: action.category,
        priority: action.priority,
        deadline: action.deadline,
        whyItMatters: action.whyItMatters,
        progress: action.progress,
      });
      applied.push({ type: "create_goal", title: action.title });
    } else if (action.type === "create_quest") {
      addQuest({
        title: action.title,
        description: action.description,
        type: action.questType,
        difficulty: action.difficulty,
        estimatedMinutes: action.estimatedMinutes,
        xpReward: action.xpReward,
        goalId: action.goalId,
        suggestedByAI: true,
      });
      applied.push({ type: "create_quest", title: action.title });
    }
  }

  return applied;
}
