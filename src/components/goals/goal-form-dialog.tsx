"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifeGoal, GoalCategory, GoalPriority } from "@/types";

const categories: { value: GoalCategory; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "career", label: "Career" },
  { value: "relationships", label: "Relationships" },
  { value: "finance", label: "Finance" },
  { value: "learning", label: "Learning" },
  { value: "creativity", label: "Creativity" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "other", label: "Other" },
];

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: LifeGoal | null;
  onSubmit: (data: {
    title: string;
    category: GoalCategory;
    priority: GoalPriority;
    deadline?: string;
    whyItMatters: string;
    progress: number;
  }) => void;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  onSubmit,
}: GoalFormDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("health");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setCategory(goal.category);
      setPriority(goal.priority);
      setDeadline(goal.deadline?.slice(0, 10) || "");
      setWhyItMatters(goal.whyItMatters);
      setProgress(goal.progress);
    } else {
      setTitle("");
      setCategory("health");
      setPriority("medium");
      setDeadline("");
      setWhyItMatters("");
      setProgress(0);
    }
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !whyItMatters.trim()) return;
    onSubmit({
      title: title.trim(),
      category,
      priority,
      deadline: deadline || undefined,
      whyItMatters: whyItMatters.trim(),
      progress,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New life goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Run a half marathon"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as GoalCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as GoalPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="why">Why it matters</Label>
            <Textarea
              id="why"
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              placeholder="I want more energy for my family and to feel proud of my body."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="progress">Current progress ({progress}%)</Label>
            <input
              id="progress"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{goal ? "Save" : "Add goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
