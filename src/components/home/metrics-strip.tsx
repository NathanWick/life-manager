"use client";

import { useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { ChevronDown, ChevronUp, Target, Scroll, Trophy } from "lucide-react";

export function MetricsStrip() {
  const { hydrated, xpProgress, streak, goals, quests, lifeProgress, achievements } =
    useLifeQuest();
  const [expanded, setExpanded] = useState(false);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const activeQuests = quests.filter((q) => q.status === "active");
  const completedQuests = quests.filter((q) => q.status === "completed");
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const highPriorityGoals = goals.filter((g) => g.priority === "high");
  const northStar = highPriorityGoals[0] ?? goals[0];

  const items = [
    { label: "Level", value: String(xpProgress.level) },
    { label: "XP", value: `${xpProgress.current}/${xpProgress.needed}` },
    { label: "Streak", value: `${streak}d` },
    { label: "Life", value: `${lifeProgress}%` },
  ];

  return (
    <div className="border-b border-border/50 bg-card/50">
      <div className="grid grid-cols-4 gap-2 px-4 py-2">
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
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {goals.length} goals · {activeQuests.length} active quests · {unlockedAchievements.length} badges
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 text-xs animate-in slide-in-from-top-2 duration-200">
          {northStar && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
              <p className="text-[10px] uppercase text-primary font-medium flex items-center gap-1">
                <Target className="h-3 w-3" /> North Star
              </p>
              <p className="font-medium mt-0.5">{northStar.title}</p>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${northStar.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {northStar.progress}% · {northStar.category} · {northStar.whyItMatters.slice(0, 60)}
              </p>
            </div>
          )}

          {goals.length > 1 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground font-medium">Other Goals</p>
              {goals.filter((g) => g.id !== northStar?.id).map((g) => (
                <div key={g.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{g.title}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{g.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {activeQuests.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                <Scroll className="h-3 w-3" /> Active Quests
              </p>
              {activeQuests.slice(0, 3).map((q) => (
                <div key={q.id} className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{q.difficulty}</span>
                  <p className="truncate flex-1">{q.title}</p>
                  <span className="text-[10px] text-muted-foreground">+{q.xpReward}xp</span>
                </div>
              ))}
              {activeQuests.length > 3 && (
                <p className="text-[10px] text-muted-foreground">+{activeQuests.length - 3} more</p>
              )}
            </div>
          )}

          {unlockedAchievements.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Badges
              </p>
              <div className="flex flex-wrap gap-1">
                {unlockedAchievements.map((a) => (
                  <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {completedQuests.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              {completedQuests.length} quest{completedQuests.length !== 1 ? "s" : ""} completed total
            </p>
          )}
        </div>
      )}
    </div>
  );
}
