"use client";

import { useLifeQuest } from "@/hooks/use-lifequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Flame,
  Footprints,
  Star,
  Swords,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  flame: Flame,
  calendar: Calendar,
  star: Star,
  trophy: Trophy,
  swords: Swords,
};

export function AchievementsGrid({ compact = false }: { compact?: boolean }) {
  const { achievements } = useLifeQuest();
  const unlocked = achievements.filter((a) => a.unlockedAt);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {achievements.map((a) => {
          const Icon = iconMap[a.icon] || Star;
          return (
            <div
              key={a.id}
              title={a.description}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border",
                a.unlockedAt
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground/40"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Achievements
          <Badge variant="secondary">{unlocked.length}/{achievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {achievements.map((a) => {
          const Icon = iconMap[a.icon] || Star;
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                a.unlockedAt ? "bg-primary/5 border-primary/20" : "opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  a.unlockedAt ? "bg-primary/15 text-primary" : "bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
