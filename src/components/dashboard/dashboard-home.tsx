"use client";

import { LocationBanner } from "@/components/location/location-banner";
import { ProgressRing } from "@/components/gamification/progress-ring";
import { AchievementsGrid } from "@/components/gamification/achievements-grid";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Flame,
  Scroll,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export function DashboardHome() {
  const {
    hydrated,
    lifeProgress,
    xpProgress,
    xp,
    streak,
    goals,
    quests,
    completeQuest,
  } = useLifeQuest();

  const activeQuests = quests.filter((q) => q.status === "active");
  const activeGoals = goals.filter((g) => g.progress < 100);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Loading your quest log…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-3 sm:gap-4 min-w-0">
          <ProgressRing
            value={lifeProgress}
            label="Life"
            sublabel="progress"
            size={96}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                Level {xpProgress.level}
              </p>
              <p className="text-xl sm:text-2xl font-semibold tabular-nums truncate">
                {xp.toLocaleString()} XP
              </p>
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <span className="shrink-0">Next level</span>
                <span className="tabular-nums shrink-0">
                  {xpProgress.current}/{xpProgress.needed}
                </span>
              </div>
              <Progress value={xpProgress.percent} className="h-2 w-full" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs max-w-full">
                <Flame className="h-3 w-3 shrink-0 text-orange-500" />
                <span className="truncate">{streak} day streak</span>
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs max-w-full">
                <Target className="h-3 w-3 shrink-0" />
                <span className="truncate">{activeGoals.length} goals</span>
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <LocationBanner />

      <section className="grid grid-cols-2 gap-3">
        <Link href="/quests">
          <Card className="hover:bg-muted/30 transition-colors h-full">
            <CardContent className="p-4">
              <Scroll className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-semibold">{activeQuests.length}</p>
              <p className="text-xs text-muted-foreground">Active quests</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/agent">
          <Card className="hover:bg-muted/30 transition-colors h-full">
            <CardContent className="p-4">
              <Sparkles className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-medium">AI Life Agent</p>
              <p className="text-xs text-muted-foreground">Get personalized quests</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Today&apos;s quests</CardTitle>
          <Link
            href="/quests"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeQuests.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No active quests yet.</p>
              <Link
                href="/agent"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "mt-1 inline-flex"
                )}
              >
                Ask your Life Agent
              </Link>
            </div>
          ) : (
            activeQuests.slice(0, 4).map((quest) => (
              <div
                key={quest.id}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <button
                  type="button"
                  onClick={() => completeQuest(quest.id)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Complete quest"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quest.estimatedMinutes} min · +{quest.xpReward} XP
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize text-[10px]">
                  {quest.difficulty}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Goal momentum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate pr-2">{goal.title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {goal.progress}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-1.5" />
              </div>
            ))}
            <Link
              href="/goals"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full"
              )}
            >
              Manage goals
            </Link>
          </CardContent>
        </Card>
      )}

      <div>
        <p className="text-sm font-medium mb-2 px-1">Badges</p>
        <AchievementsGrid compact />
      </div>
    </div>
  );
}
