"use client";

import { Quest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  MapPin,
  SkipForward,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const difficultyStyle = {
  easy: "border-emerald-500/30 bg-emerald-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  hard: "border-red-500/30 bg-red-500/5",
};

interface QuestCardProps {
  quest: Quest;
  goalTitle?: string;
  onComplete: () => void;
  onSkip: () => void;
  onDelete: () => void;
}

export function QuestCard({
  quest,
  goalTitle,
  onComplete,
  onSkip,
  onDelete,
}: QuestCardProps) {
  const completed = quest.status === "completed";
  const skipped = quest.status === "skipped";

  return (
    <Card
      className={cn(
        "transition-opacity",
        completed && "opacity-60",
        skipped && "opacity-40",
        !completed && !skipped && difficultyStyle[quest.difficulty]
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {quest.status === "active" ? (
            <button
              type="button"
              onClick={onComplete}
              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Complete quest"
            >
              <CheckCircle2 className="h-6 w-6" />
            </button>
          ) : (
            <CheckCircle2
              className={cn(
                "h-6 w-6 mt-0.5",
                completed ? "text-primary" : "text-muted-foreground/30"
              )}
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                {quest.type}
              </Badge>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {quest.difficulty}
              </Badge>
              {quest.suggestedByAI && (
                <Badge className="text-[10px] gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </Badge>
              )}
            </div>
            <h3
              className={cn(
                "font-medium",
                completed && "line-through text-muted-foreground"
              )}
            >
              {quest.title}
            </h3>
            <p className="text-sm text-muted-foreground">{quest.description}</p>
            {goalTitle && (
              <p className="text-xs text-muted-foreground">
                Linked to: {goalTitle}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {quest.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Zap className="h-3 w-3" />
                +{quest.xpReward} XP
              </span>
              {quest.locationContext && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {quest.locationContext}
                </span>
              )}
            </div>
          </div>
        </div>
        {quest.status === "active" && (
          <div className="flex gap-2 mt-3 ml-9">
            <Button size="sm" className="flex-1" onClick={onComplete}>
              Complete (+{quest.xpReward} XP)
            </Button>
            <Button size="sm" variant="outline" onClick={onSkip}>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
