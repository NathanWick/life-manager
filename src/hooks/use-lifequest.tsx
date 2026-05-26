"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  levelFromXp,
  overallLifeProgress,
  updateStreak,
  xpProgressInLevel,
} from "@/lib/gamification";
import { initialState, loadState, saveState } from "@/lib/storage";
import {
  Achievement,
  ChatMessage,
  LifeGoal,
  LifeQuestState,
  Quest,
  UserLocation,
} from "@/types";

type GoalInput = Omit<LifeGoal, "id" | "createdAt" | "updatedAt">;
type QuestInput = Omit<Quest, "id" | "status" | "createdAt" | "completedAt">;

interface LifeQuestContextValue extends LifeQuestState {
  hydrated: boolean;
  lifeProgress: number;
  xpProgress: ReturnType<typeof xpProgressInLevel>;
  addGoal: (goal: GoalInput) => void;
  updateGoal: (id: string, updates: Partial<GoalInput>) => void;
  deleteGoal: (id: string) => void;
  addQuest: (quest: QuestInput) => void;
  completeQuest: (id: string) => void;
  skipQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLocation: (loc: UserLocation | null) => void;
  resetAll: () => void;
}

const LifeQuestContext = createContext<LifeQuestContextValue | null>(null);

function checkAchievements(state: LifeQuestState): Achievement[] {
  const achievements = [...state.achievements];
  const unlock = (id: string) => {
    const a = achievements.find((x) => x.id === id);
    if (a && !a.unlockedAt) {
      a.unlockedAt = new Date().toISOString();
    }
  };

  const completedCount = state.completedQuestIds.length;
  if (completedCount >= 1) unlock("first-quest");
  if (completedCount >= 10) unlock("ten-quests");
  if (state.streak >= 3) unlock("streak-3");
  if (state.streak >= 7) unlock("streak-7");
  if (state.level >= 5) unlock("level-5");
  if (state.goals.some((g) => g.progress >= 100)) unlock("goal-complete");

  return achievements;
}

export function LifeQuestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LifeQuestState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const setStateWithAchievements = useCallback(
    (updater: (prev: LifeQuestState) => LifeQuestState) => {
      setState((prev) => {
        const next = updater(prev);
        return {
          ...next,
          achievements: checkAchievements(next),
        };
      });
    },
    []
  );

  const addGoal = useCallback((goal: GoalInput) => {
    const now = new Date().toISOString();
    const newGoal: LifeGoal = {
      ...goal,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setStateWithAchievements((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  }, [setStateWithAchievements]);

  const updateGoal = useCallback(
    (id: string, updates: Partial<GoalInput>) => {
      setStateWithAchievements((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id
            ? { ...g, ...updates, updatedAt: new Date().toISOString() }
            : g
        ),
      }));
    },
    [setStateWithAchievements]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setStateWithAchievements((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }));
    },
    [setStateWithAchievements]
  );

  const addQuest = useCallback(
    (quest: QuestInput) => {
      const newQuest: Quest = {
        ...quest,
        id: uuidv4(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      setStateWithAchievements((prev) => ({
        ...prev,
        quests: [...prev.quests, newQuest],
      }));
    },
    [setStateWithAchievements]
  );

  const completeQuest = useCallback(
    (id: string) => {
      setStateWithAchievements((prev) => {
        const quest = prev.quests.find((q) => q.id === id);
        if (!quest || quest.status === "completed") return prev;

        const streakUpdate = updateStreak(prev.lastActiveDate, prev.streak);
        const newXp = prev.xp + quest.xpReward;
        const newLevel = levelFromXp(newXp);

        let goals = prev.goals;
        if (quest.goalId) {
          goals = prev.goals.map((g) =>
            g.id === quest.goalId
              ? {
                  ...g,
                  progress: Math.min(100, g.progress + 5),
                  updatedAt: new Date().toISOString(),
                }
              : g
          );
        }

        return {
          ...prev,
          goals,
          xp: newXp,
          level: newLevel,
          streak: streakUpdate.streak,
          lastActiveDate: streakUpdate.lastActiveDate,
          completedQuestIds: [...prev.completedQuestIds, id],
          quests: prev.quests.map((q) =>
            q.id === id
              ? {
                  ...q,
                  status: "completed" as const,
                  completedAt: new Date().toISOString(),
                }
              : q
          ),
        };
      });
    },
    [setStateWithAchievements]
  );

  const skipQuest = useCallback(
    (id: string) => {
      setStateWithAchievements((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === id ? { ...q, status: "skipped" as const } : q
        ),
      }));
    },
    [setStateWithAchievements]
  );

  const deleteQuest = useCallback(
    (id: string) => {
      setStateWithAchievements((prev) => ({
        ...prev,
        quests: prev.quests.filter((q) => q.id !== id),
      }));
    },
    [setStateWithAchievements]
  );

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const message: ChatMessage = {
        ...msg,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      setStateWithAchievements((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, message],
      }));
    },
    [setStateWithAchievements]
  );

  const setLocation = useCallback((loc: UserLocation | null) => {
    setStateWithAchievements((prev) => ({ ...prev, location: loc }));
  }, [setStateWithAchievements]);

  const resetAll = useCallback(() => {
    setState(initialState);
    saveState(initialState);
  }, []);

  const lifeProgress = useMemo(
    () => overallLifeProgress(state.goals),
    [state.goals]
  );
  const xpProgress = useMemo(() => xpProgressInLevel(state.xp), [state.xp]);

  const value: LifeQuestContextValue = {
    ...state,
    hydrated,
    lifeProgress,
    xpProgress,
    addGoal,
    updateGoal,
    deleteGoal,
    addQuest,
    completeQuest,
    skipQuest,
    deleteQuest,
    addChatMessage,
    setLocation,
    resetAll,
  };

  return (
    <LifeQuestContext.Provider value={value}>
      {children}
    </LifeQuestContext.Provider>
  );
}

export function useLifeQuest() {
  const ctx = useContext(LifeQuestContext);
  if (!ctx) throw new Error("useLifeQuest must be used within LifeQuestProvider");
  return ctx;
}
