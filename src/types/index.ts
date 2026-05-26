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
export type QuestStatus = "active" | "completed" | "skipped";

export interface LifeGoal {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  deadline?: string;
  whyItMatters: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
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
  suggestedByAI?: boolean;
  locationContext?: string;
  /** e.g. YouTube search or tutorial link */
  resourceUrl?: string;
  resourceLabel?: string;
  /** Concrete steps to complete the quest */
  actionSteps?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
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
  /** Actions the agent applied via tool calls */
  appliedActions?: AgentActionSummary[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt: string;
}

export interface LifeQuestState {
  goals: LifeGoal[];
  quests: Quest[];
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  achievements: Achievement[];
  chatHistory: ChatMessage[];
  location: UserLocation | null;
  completedQuestIds: string[];
}

export const STORAGE_KEY = "lifequest-state-v1";

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-quest",
    title: "First Steps",
    description: "Complete your first quest",
    icon: "footprints",
  },
  {
    id: "streak-3",
    title: "On Fire",
    description: "Maintain a 3-day streak",
    icon: "flame",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "calendar",
  },
  {
    id: "level-5",
    title: "Rising Star",
    description: "Reach level 5",
    icon: "star",
  },
  {
    id: "goal-complete",
    title: "Dream Achiever",
    description: "Complete a life goal to 100%",
    icon: "trophy",
  },
  {
    id: "ten-quests",
    title: "Quest Master",
    description: "Complete 10 quests",
    icon: "swords",
  },
];
