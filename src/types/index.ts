export type GoalCategory =
  | "health"
  | "career"
  | "relationships"
  | "finance"
  | "learning"
  | "creativity"
  | "mindfulness"
  | "other";

export type GoalPriority = "low" | "medium" | "high";
export type QuestDifficulty = "easy" | "medium" | "hard";
export type QuestType = "daily" | "weekly";
export type QuestStatus = "active" | "completed";

export interface LifeGoal {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  whyItMatters: string;
  progress: number;
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  status: QuestStatus;
  goalId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentActionSummary {
  type: "create_goal" | "create_quest";
  title: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  appliedActions?: AgentActionSummary[];
}

export interface LifeQuestState {
  goals: LifeGoal[];
  quests: Quest[];
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  chatHistory: ChatMessage[];
}

export const STORAGE_KEY = "lifequest-state-v1";
