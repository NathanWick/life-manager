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
import type { AgentAction } from "@/lib/agent-tools";
import {
  levelFromXp,
  overallLifeProgress,
  updateStreak,
} from "@/lib/gamification";
import { initialState, loadState, saveState } from "@/lib/storage";
import {
  AgentActionSummary,
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
  updateQuest: (id: string, updates: Partial<QuestInput>) => void;
  completeQuest: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  applyAgentResult: (
    actions: AgentAction[],
    assistant: { content: string }
  ) => AgentActionSummary[];
}

const LifeQuestContext = createContext<LifeQuestContextValue | null>(null);

function findActiveQuest(
  quests: Quest[],
  questId?: string,
  questTitle?: string
): Quest | undefined {
  if (questId) {
    const byId = quests.find((q) => q.id === questId && q.status === "active");
    if (byId) return byId;
  }
  if (questTitle) {
    const key = questTitle.toLowerCase().trim();
    return (
      quests.find(
        (q) => q.status === "active" && q.title.toLowerCase() === key
      ) ??
      quests.find(
        (q) =>
          q.status === "active" &&
          (q.title.toLowerCase().includes(key) ||
            key.includes(q.title.toLowerCase()))
      )
    );
  }
  return undefined;
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

  const updateQuest = useCallback((id: string, updates: Partial<QuestInput>) => {
    setState((prev) => {
      const match = findActiveQuest(prev.quests, id, updates.title);
      if (!match) return prev;
      return {
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === match.id ? { ...q, ...updates } : q
        ),
      };
    });
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

  const applyAgentResult = useCallback(
    (actions: AgentAction[], assistant: { content: string }) => {
      let summaries: AgentActionSummary[] = [];

      setState((prev) => {
        let goals = prev.goals;
        let quests = prev.quests;
        const applied: AgentActionSummary[] = [];

        for (const action of actions) {
          if (action.type === "create_goal") {
            goals = [
              ...goals,
              {
                title: action.title,
                category: action.category,
                priority: action.priority,
                whyItMatters: action.whyItMatters,
                progress: action.progress,
                id: uuidv4(),
                createdAt: new Date().toISOString(),
              },
            ];
            applied.push({ type: "create_goal", title: action.title });
          } else if (action.type === "create_quest") {
            quests = [
              ...quests,
              {
                title: action.title,
                description: action.description,
                type: action.questType,
                difficulty: action.difficulty,
                estimatedMinutes: action.estimatedMinutes,
                xpReward: action.xpReward,
                goalId: action.goalId,
                id: uuidv4(),
                status: "active",
                createdAt: new Date().toISOString(),
              },
            ];
            applied.push({ type: "create_quest", title: action.title });
          } else if (action.type === "update_quest") {
            const match = findActiveQuest(
              quests,
              action.questId,
              action.questTitle || action.title
            );
            if (!match) continue;
            quests = quests.map((q) =>
              q.id === match.id ? { ...q, ...action.updates } : q
            );
            applied.push({
              type: "update_quest",
              title: action.updates.title || match.title,
            });
          }
        }

        summaries = applied;

        return {
          ...prev,
          goals,
          quests,
          chatHistory: [
            ...prev.chatHistory,
            {
              id: uuidv4(),
              role: "assistant",
              content: assistant.content,
              timestamp: new Date().toISOString(),
              appliedActions: applied.length ? applied : undefined,
            },
          ],
        };
      });

      return summaries;
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
        updateQuest,
        completeQuest,
        addChatMessage,
        applyAgentResult,
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
