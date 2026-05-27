import type { LifeGoal, Quest } from "@/types";

export interface LifeQuestMcpContext {
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  xp: number;
}

export function goalIdByTitle(goals: LifeGoal[]): Map<string, string> {
  return new Map(goals.map((g) => [g.title.toLowerCase(), g.id]));
}
