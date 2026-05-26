import {
  DEFAULT_ACHIEVEMENTS,
  LifeQuestState,
  Quest,
  STORAGE_KEY,
} from "@/types";

const LEGACY_QUEST_TITLES = new Set([
  "define your north star",
  "define your north star ",
]);

function sanitizeQuests(quests: Quest[]): Quest[] {
  return quests.filter((q) => {
    const title = q.title.toLowerCase().trim();
    if (LEGACY_QUEST_TITLES.has(title)) return false;
    if (q.description?.toLowerCase().includes("goals section")) return false;
    return true;
  });
}

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
      quests: sanitizeQuests(parsed.quests ?? []),
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
