import { toast } from "sonner";

export function toastQuestAdded(title: string) {
  toast.success("Quest added", { description: title });
}

export function toastQuestComplete(xp: number) {
  toast.success(`+${xp} XP earned!`, {
    description: "Keep your streak alive tomorrow.",
  });
}

export function toastGoalSaved(title: string) {
  toast.success("Goal saved", { description: title });
}
