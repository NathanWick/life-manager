"use client";

import { QuestCard } from "@/components/quests/quest-card";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

export function QuestsSection() {
  const {
    quests,
    goals,
    completeQuest,
    skipQuest,
    deleteQuest,
    hydrated,
    xp,
    streak,
  } = useLifeQuest();

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Loading quests…
      </div>
    );
  }

  const active = quests.filter((q) => q.status === "active");
  const completed = quests.filter((q) => q.status === "completed");
  const daily = active.filter((q) => q.type === "daily");
  const weekly = active.filter((q) => q.type === "weekly");

  const getGoalTitle = (goalId?: string) =>
    goals.find((g) => g.id === goalId)?.title;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quests</h1>
          <p className="text-sm text-muted-foreground">
            Short-term actions · {xp.toLocaleString()} XP · {streak}d streak
          </p>
        </div>
        <Link
          href="/agent"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Get quests
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-2xl font-semibold">{daily.length}</p>
          <p className="text-xs text-muted-foreground">Daily active</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-2xl font-semibold">{weekly.length}</p>
          <p className="text-xs text-muted-foreground">Weekly active</p>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            Done ({completed.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-3 mt-3">
          {active.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <p className="mb-3">No active quests. Your adventure awaits!</p>
              <Link href="/agent" className={cn(buttonVariants())}>
                <Plus className="h-4 w-4 mr-1" />
                Ask Life Agent
              </Link>
            </div>
          ) : (
            active.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                goalTitle={getGoalTitle(quest.goalId)}
                onComplete={() => completeQuest(quest.id)}
                onSkip={() => skipQuest(quest.id)}
                onDelete={() => deleteQuest(quest.id)}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="done" className="space-y-3 mt-3">
          {completed.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">
              Complete quests to see them here.
            </p>
          ) : (
            completed.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                goalTitle={getGoalTitle(quest.goalId)}
                onComplete={() => {}}
                onSkip={() => {}}
                onDelete={() => deleteQuest(quest.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
