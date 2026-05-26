import {
  DEFAULT_ACHIEVEMENTS,
  LifeQuestState,
  STORAGE_KEY,
} from "@/types";

export const initialState: LifeQuestState = {
  goals: [],
  quests: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  achievements: DEFAULT_ACHIEVEMENTS,
  chatHistory: [],
  location: null,
  completedQuestIds: [],
};

export function loadState(): LifeQuestState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as LifeQuestState;
    return {
      ...initialState,
      ...parsed,
      achievements:
        parsed.achievements?.length > 0
          ? parsed.achievements
          : DEFAULT_ACHIEVEMENTS,
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: LifeQuestState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
