import { questXpReward } from "@/lib/gamification";
import type { AgentAction } from "@/lib/agent-tools";
import type { LifeGoal } from "@/types";

function inferCategory(text: string): LifeGoal["category"] {
  const t = text.toLowerCase();
  if (/health|fit|gym|run|weight|sleep|diet/.test(t)) return "health";
  if (/job|career|work|promo|business/.test(t)) return "career";
  if (/friend|family|date|relationship|social/.test(t)) return "relationships";
  if (/money|save|budget|invest|debt|finance/.test(t)) return "finance";
  if (/learn|study|read|course|skill|language/.test(t)) return "learning";
  if (/art|music|write|creat|draw|guitar/.test(t)) return "creativity";
  if (/meditat|mindful|calm|stress|journal/.test(t)) return "mindfulness";
  return "other";
}

function extractGoalTitle(message: string): string | null {
  const patterns = [
    /(?:my )?north\s*star(?: is|:?)\s*(.+)/i,
    /i want to\s+(.+)/i,
    /help me\s+(.+)/i,
    /i'?m trying to\s+(.+)/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m?.[1]) {
      let title = m[1].replace(/[.!?].*$/, "").trim().slice(0, 80);
      title = title.replace(/^to\s+/i, "").trim();
      if (title.length >= 3) return title.charAt(0).toUpperCase() + title.slice(1);
    }
  }
  return null;
}

export function generateFallbackReply(input: {
  message: string;
  goals: LifeGoal[];
  streak: number;
  level: number;
}): { content: string; actions: AgentAction[] } {
  const { message, goals, streak, level } = input;
  const actions: AgentAction[] = [];

  const goalTitle = extractGoalTitle(message);
  if (goalTitle) {
    actions.push({
      type: "create_goal",
      title: goalTitle,
      category: inferCategory(message),
      priority: "high",
      whyItMatters: "You named this as a direction that matters.",
      progress: 0,
    });
  }

  const wantsQuests =
    /\b(quest|today|task|do now|give me)\b/i.test(message) ||
    /\d+\s*quest/i.test(message);

  const focus =
    goals[0]?.title ??
    (goalTitle ? goalTitle : null);

  if (wantsQuests || (!goalTitle && focus)) {
    const count = Math.min(
      3,
      Number(message.match(/(\d+)\s*quest/i)?.[1] ?? (wantsQuests ? 2 : 1))
    );
    const base = focus ?? "your day";
    for (let i = 0; i < count; i++) {
      const difficulty = i === 0 ? "easy" : "medium";
      actions.push({
        type: "create_quest",
        title: i === 0 ? `15 min on ${base}` : `Next step for ${base}`,
        description: `A concrete action toward ${base}.`,
        questType: "daily",
        difficulty,
        estimatedMinutes: difficulty === "easy" ? 15 : 30,
        xpReward: questXpReward(difficulty, "daily"),
        goalId: goals[0]?.id,
      });
    }
  }

  if (actions.length === 0) {
    return {
      content:
        'Tell me your north star (e.g. "I want to get healthier") or ask for quests for today.',
      actions: [],
    };
  }

  const goalsN = actions.filter((a) => a.type === "create_goal").length;
  const questsN = actions.filter((a) => a.type === "create_quest").length;
  const parts: string[] = [];
  if (goalsN) parts.push(`${goalsN} goal${goalsN > 1 ? "s" : ""}`);
  if (questsN) parts.push(`${questsN} quest${questsN > 1 ? "s" : ""}`);

  return {
    content: `Added ${parts.join(" & ")}. Level ${level}, ${streak}-day streak — keep going.`,
    actions,
  };
}
