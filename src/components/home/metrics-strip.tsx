"use client";

import { useLifeQuest } from "@/hooks/use-lifequest";

export function MetricsStrip() {
  const { hydrated, xp, xpProgress, streak, goals, quests, lifeProgress } =
    useLifeQuest();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const activeQuests = quests.filter((q) => q.status === "active").length;

  const items = [
    { label: "Level", value: String(xpProgress.level) },
    { label: "XP", value: xp.toLocaleString() },
    { label: "Streak", value: `${streak}d` },
    { label: "Life", value: `${lifeProgress}%` },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border/50 bg-card/50">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg bg-background/80 border border-border/40 px-2 py-2 text-center"
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-semibold tabular-nums">{value}</p>
        </div>
      ))}
      <p className="col-span-4 text-[10px] text-center text-muted-foreground -mt-1">
        {goals.length} goals · {activeQuests} active quests
      </p>
    </div>
  );
}
