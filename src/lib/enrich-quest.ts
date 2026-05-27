import type { ParsedCreateQuest } from "@/lib/agent-tools";
import { buildActionableQuest } from "@/lib/quest-resources";
import type { LifeGoal } from "@/types";

export function enrichQuestAction(
  action: ParsedCreateQuest,
  goals: LifeGoal[]
): ParsedCreateQuest {
  const goal = goals.find((g) => g.id === action.goalId);
  const topic = goal?.title ?? action.title;

  if (
    action.resourceUrl &&
    action.actionSteps &&
    action.actionSteps.length >= 2
  ) {
    return action;
  }

  const draft = buildActionableQuest(topic, {
    goalTitle: goal?.title,
    category: goal?.category,
    questType: action.questType,
    difficulty: action.difficulty,
  });

  return {
    ...action,
    title: action.title || draft.title,
    description:
      action.description.length > 20
        ? action.description
        : draft.description,
    actionSteps:
      action.actionSteps && action.actionSteps.length > 0
        ? action.actionSteps
        : draft.actionSteps,
    resourceUrl: action.resourceUrl ?? draft.resourceUrl,
    resourceLabel: action.resourceLabel ?? draft.resourceLabel,
  };
}
