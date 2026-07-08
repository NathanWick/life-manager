"use client";

import { useLifeQuest } from "@/hooks/use-lifequest";

export function QuestsList() {
  const { hydrated, quests, completeQuest } = useLifeQuest();
  const active = quests.filter((q) => q.status === "active");

  if (!hydrated || active.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-border/60 px-4 py-2 max-h-36 overflow-y-auto">
      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        Active quests
      </p>
      <ul className="space-y-1.5">
        {active.map((q) => (
          <li
            key={q.id}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{q.title}</p>
              <p className="text-[10px] text-muted-foreground">
                +{q.xpReward} XP · {q.estimatedMinutes}m
              </p>
            </div>
            <button
              type="button"
              onClick={() => completeQuest(q.id)}
              className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
