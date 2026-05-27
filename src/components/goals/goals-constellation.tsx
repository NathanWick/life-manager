"use client";

import { useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { LifeGoal } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Sparkles,
  Heart,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryEmoji: Record<string, string> = {
  health: "💪",
  career: "🚀",
  relationships: "💕",
  finance: "💰",
  learning: "📚",
  creativity: "🎨",
  mindfulness: "🧘",
  other: "✨",
};

const categoryGradient: Record<string, string> = {
  health: "from-emerald-500/20 to-emerald-500/5",
  career: "from-blue-500/20 to-blue-500/5",
  relationships: "from-pink-500/20 to-pink-500/5",
  finance: "from-amber-500/20 to-amber-500/5",
  learning: "from-violet-500/20 to-violet-500/5",
  creativity: "from-orange-500/20 to-orange-500/5",
  mindfulness: "from-teal-500/20 to-teal-500/5",
  other: "from-gray-500/20 to-gray-500/5",
};

const categoryBorder: Record<string, string> = {
  health: "border-emerald-500/30",
  career: "border-blue-500/30",
  relationships: "border-pink-500/30",
  finance: "border-amber-500/30",
  learning: "border-violet-500/30",
  creativity: "border-orange-500/30",
  mindfulness: "border-teal-500/30",
  other: "border-border",
};

const categoryAccent: Record<string, string> = {
  health: "text-emerald-600 dark:text-emerald-400",
  career: "text-blue-600 dark:text-blue-400",
  relationships: "text-pink-600 dark:text-pink-400",
  finance: "text-amber-600 dark:text-amber-400",
  learning: "text-violet-600 dark:text-violet-400",
  creativity: "text-orange-600 dark:text-orange-400",
  mindfulness: "text-teal-600 dark:text-teal-400",
  other: "text-muted-foreground",
};

export function GoalsConstellation() {
  const { goals, addGoal, updateGoal, deleteGoal, hydrated } = useLifeQuest();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LifeGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your universe…</p>
        </div>
      </div>
    );
  }

  const northStars = goals.filter((g) => g.priority === "high");
  const regularGoals = goals.filter((g) => g.priority !== "high");

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteGoal(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            Goals & North Stars
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your guiding lights and stepping stones
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-full shadow-md"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Your sky is empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            Tell your Life Agent what you dream about, or tap the button to add your first north star.
          </p>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="rounded-full"
          >
            <Star className="h-4 w-4 mr-1.5" />
            Set your first north star
          </Button>
        </div>
      )}

      {/* North Stars section */}
      {northStars.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              North Stars
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
              {northStars.length}
            </span>
          </div>

          <div className="space-y-3">
            {northStars.map((goal) => (
              <NorthStarCard
                key={goal.id}
                goal={goal}
                linkedGoals={regularGoals.filter(
                  (g) => g.category === goal.category
                )}
                onEdit={() => {
                  setEditing(goal);
                  setDialogOpen(true);
                }}
                onDelete={() => handleDelete(goal.id)}
                confirmingDelete={confirmDelete === goal.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular goals section */}
      {regularGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Goals
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {regularGoals.length}
            </span>
          </div>

          <div className="grid gap-2">
            {regularGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {
                  setEditing(goal);
                  setDialogOpen(true);
                }}
                onDelete={() => handleDelete(goal.id)}
                confirmingDelete={confirmDelete === goal.id}
              />
            ))}
          </div>
        </section>
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

function NorthStarCard({
  goal,
  linkedGoals,
  onEdit,
  onDelete,
  confirmingDelete,
}: {
  goal: LifeGoal;
  linkedGoals: LifeGoal[];
  onEdit: () => void;
  onDelete: () => void;
  confirmingDelete: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-gradient-to-br p-4 space-y-3 transition-all hover:shadow-lg",
        categoryGradient[goal.category],
        categoryBorder[goal.category]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/80 shadow-sm text-lg">
            {categoryEmoji[goal.category]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{goal.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                {goal.category}
              </Badge>
              {goal.deadline && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(goal.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-background/60 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
              confirmingDelete
                ? "bg-red-500/10 text-red-500"
                : "hover:bg-background/60 text-muted-foreground"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Why it matters */}
      <div className="flex items-start gap-2 px-1">
        <Heart className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", categoryAccent[goal.category])} />
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {goal.whyItMatters}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs px-1">
          <span className="text-muted-foreground">Progress</span>
          <span className={cn("font-bold tabular-nums", categoryAccent[goal.category])}>
            {goal.progress}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-background/60 overflow-hidden shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              goal.progress >= 100
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : goal.progress >= 50
                  ? "bg-gradient-to-r from-primary/80 to-primary"
                  : "bg-gradient-to-r from-primary/60 to-primary/80"
            )}
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          />
        </div>
      </div>

      {/* Linked goals */}
      {linkedGoals.length > 0 && (
        <div className="pt-1 border-t border-border/30">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
            Related goals in {goal.category}
          </p>
          <div className="space-y-1">
            {linkedGoals.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-2 rounded-lg bg-background/40 px-2.5 py-1.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                <span className="text-xs flex-1 truncate">{g.title}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{g.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmingDelete && (
        <p className="text-[11px] text-red-500 text-center animate-in fade-in">
          Tap delete again to confirm
        </p>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  confirmingDelete,
}: {
  goal: LifeGoal;
  onEdit: () => void;
  onDelete: () => void;
  confirmingDelete: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-3 transition-all hover:shadow-md group",
        categoryGradient[goal.category],
        categoryBorder[goal.category]
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/80 text-sm shadow-sm">
          {categoryEmoji[goal.category]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{goal.title}</h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 rounded-full bg-background/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {goal.progress}%
            </span>
          </div>
        </div>

        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-background/60 transition-colors"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-lg transition-colors",
              confirmingDelete
                ? "bg-red-500/10 text-red-500"
                : "hover:bg-background/60 text-muted-foreground"
            )}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {goal.whyItMatters && (
        <p className="text-[11px] text-muted-foreground mt-1.5 pl-12 line-clamp-1">
          {goal.whyItMatters}
        </p>
      )}

      {confirmingDelete && (
        <p className="text-[11px] text-red-500 text-center mt-1 animate-in fade-in">
          Tap delete again to confirm
        </p>
      )}
    </div>
  );
}
