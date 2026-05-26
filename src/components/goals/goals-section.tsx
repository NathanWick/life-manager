"use client";

import { useState } from "react";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { LifeGoal } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  health: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  career: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  relationships: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  finance: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  learning: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  creativity: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  mindfulness: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  other: "bg-muted text-muted-foreground",
};

const priorityDot = {
  low: "bg-muted-foreground",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function GoalsSection() {
  const { goals, addGoal, updateGoal, deleteGoal, hydrated } = useLifeQuest();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LifeGoal | null>(null);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Loading goals…
      </div>
    );
  }

  const sorted = [...goals].sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Life Goals</h1>
          <p className="text-sm text-muted-foreground">
            Define what matters — quests follow from here
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              No goals yet. Start with one meaningful north star.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create your first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((goal) => (
            <Card key={goal.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          priorityDot[goal.priority]
                        )}
                      />
                      <h3 className="font-medium truncate">{goal.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn("capitalize text-[10px]", categoryColors[goal.category])}
                      >
                        {goal.category}
                      </Badge>
                      {goal.deadline && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(goal);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {goal.whyItMatters}
                </p>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        onSubmit={(data) => {
          if (editing) {
            updateGoal(editing.id, data);
          } else {
            addGoal(data);
          }
        }}
      />
    </div>
  );
}
