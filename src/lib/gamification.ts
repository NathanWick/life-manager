export const XP_PER_LEVEL = 100;

export function xpForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return level;
}

export function xpProgressInLevel(xp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = levelFromXp(xp);
  let spent = 0;
  for (let l = 1; l < level; l++) {
    spent += xpForLevel(l);
  }
  const current = xp - spent;
  const needed = xpForLevel(level);
  return {
    level,
    current,
    needed,
    percent: Math.min(100, Math.round((current / needed) * 100)),
  };
}

export function questXpReward(
  difficulty: "easy" | "medium" | "hard",
  type: "daily" | "weekly"
): number {
  const base = { easy: 15, medium: 30, hard: 50 }[difficulty];
  return type === "weekly" ? base * 2 : base;
}

export function overallLifeProgress(goals: { progress: number }[]): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce((acc, g) => acc + g.progress, 0);
  return Math.round(sum / goals.length);
}

export function updateStreak(
  lastActiveDate: string | null,
  currentStreak: number
): { streak: number; lastActiveDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (lastActiveDate === today) {
    return { streak: currentStreak, lastActiveDate: today };
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (lastActiveDate === yesterdayStr) {
    return { streak: currentStreak + 1, lastActiveDate: today };
  }
  return { streak: 1, lastActiveDate: today };
}
