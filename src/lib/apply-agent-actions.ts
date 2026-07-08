import type { AgentAction } from "@/lib/agent-tools";
import type {
  AgentActionSummary,
  GoalCategory,
  GoalPriority,
  QuestDifficulty,
  QuestType,
} from "@/types";

type AddGoal = (goal: {
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  whyItMatters: string;
  progress: number;
}) => void;

type AddQuest = (quest: {
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  goalId?: string;
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
        whyItMatters: action.whyItMatters,
        progress: action.progress,
      });
      applied.push({ type: "create_goal", title: action.title });
    } else {
      addQuest({
        title: action.title,
        description: action.description,
        type: action.questType,
        difficulty: action.difficulty,
        estimatedMinutes: action.estimatedMinutes,
        xpReward: action.xpReward,
        goalId: action.goalId,
      });
      applied.push({ type: "create_quest", title: action.title });
    }
  }

  return applied;
}
