"use client";

import { useLifeQuest } from "@/hooks/use-lifequest";

export function MetricsStrip() {
  const { hydrated, level, xp, streak, lifeProgress, goals, quests } =
    useLifeQuest();

  if (!hydrated) {
    return (
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const active = quests.filter((q) => q.status === "active").length;
  const items = [
    { label: "Level", value: String(level) },
    { label: "XP", value: xp.toLocaleString() },
    { label: "Streak", value: `${streak}d` },
    { label: "Life", value: `${lifeProgress}%` },
  ];

  return (
    <div className="border-b border-border/60 px-4 py-2">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/60 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-sm font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        {goals.length} goal{goals.length === 1 ? "" : "s"} · {active} active
        quest{active === 1 ? "" : "s"}
      </p>
    </div>
  );
}
