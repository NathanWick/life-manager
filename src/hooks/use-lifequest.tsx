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
} from "@/lib/gamification";
import { initialState, loadState, saveState } from "@/lib/storage";
import {
  ChatMessage,
  LifeGoal,
  LifeQuestState,
  Quest,
} from "@/types";

type GoalInput = Omit<LifeGoal, "id" | "createdAt">;
type QuestInput = Omit<Quest, "id" | "status" | "createdAt" | "completedAt">;

interface LifeQuestContextValue extends LifeQuestState {
  hydrated: boolean;
  lifeProgress: number;
  addGoal: (goal: GoalInput) => void;
  addQuest: (quest: QuestInput) => void;
  completeQuest: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
}

const LifeQuestContext = createContext<LifeQuestContextValue | null>(null);

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

  const addGoal = useCallback((goal: GoalInput) => {
    const newGoal: LifeGoal = {
      ...goal,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, goals: [...prev.goals, newGoal] }));
  }, []);

  const addQuest = useCallback((quest: QuestInput) => {
    const newQuest: Quest = {
      ...quest,
      id: uuidv4(),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, quests: [...prev.quests, newQuest] }));
  }, []);

  const completeQuest = useCallback((id: string) => {
    setState((prev) => {
      const quest = prev.quests.find((q) => q.id === id);
      if (!quest || quest.status === "completed") return prev;

      const streakUpdate = updateStreak(prev.lastActiveDate, prev.streak);
      const newXp = prev.xp + quest.xpReward;
      const newLevel = levelFromXp(newXp);

      let goals = prev.goals;
      if (quest.goalId) {
        goals = prev.goals.map((g) =>
          g.id === quest.goalId
            ? { ...g, progress: Math.min(100, g.progress + 5) }
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
  }, []);

  const addChatMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const message: ChatMessage = {
        ...msg,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, message],
      }));
    },
    []
  );

  const lifeProgress = useMemo(
    () => overallLifeProgress(state.goals),
    [state.goals]
  );

  return (
    <LifeQuestContext.Provider
      value={{
        ...state,
        hydrated,
        lifeProgress,
        addGoal,
        addQuest,
        completeQuest,
        addChatMessage,
      }}
    >
      {children}
    </LifeQuestContext.Provider>
  );
}

export function useLifeQuest() {
  const ctx = useContext(LifeQuestContext);
  if (!ctx) throw new Error("useLifeQuest must be used within LifeQuestProvider");
  return ctx;
}
