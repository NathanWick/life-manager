import {
  AgentAction,
  parseToolCall,
  toolResultMessage,
} from "@/lib/agent-tools";
import {
  buildSystemPrompt,
  chatCompletion,
  ChatCompletionMessage,
} from "@/lib/agent-provider";
import { generateFallbackReply } from "@/lib/ai-fallback";
import { enrichActionsFromNaturalLanguage } from "@/lib/parse-natural-language";
import { LifeGoal, Quest } from "@/types";

export interface AgentRunResult {
  content: string;
  actions: AgentAction[];
  provider: string;
}

function extractToolCalls(
  message: ChatCompletionMessage,
  goalIdByTitle: Map<string, string>
): AgentAction[] {
  const actions: AgentAction[] = [];
  for (const tc of message.tool_calls ?? []) {
    const parsed = parseToolCall(
      tc.function.name,
      tc.function.arguments,
      goalIdByTitle
    );
    if (parsed) actions.push(parsed);
  }
  return actions;
}

export async function runLifeAgent(input: {
  message: string;
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  location?: { latitude: number; longitude: number } | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AgentRunResult> {
  const goalIdByTitle = new Map(
    input.goals.map((g) => [g.title.toLowerCase(), g.id])
  );

  try {
    const system = buildSystemPrompt({
      goals: input.goals,
      quests: input.quests,
      streak: input.streak,
      level: input.level,
      location: input.location,
    });

    const messages: ChatCompletionMessage[] = [
      { role: "system", content: system },
      ...(input.history ?? []).slice(-8).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: input.message },
    ];

    const first = await chatCompletion({ messages, tools: true });
    const allActions: AgentAction[] = extractToolCalls(
      first.message,
      goalIdByTitle
    );

    if (
      first.finishReason === "tool_calls" &&
      (first.message.tool_calls?.length ?? 0) > 0
    ) {
      messages.push(first.message);

      for (const tc of first.message.tool_calls!) {
        const parsed = parseToolCall(
          tc.function.name,
          tc.function.arguments,
          goalIdByTitle
        );
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: parsed
            ? toolResultMessage(parsed)
            : "Action recorded.",
        });
      }

      const second = await chatCompletion({ messages, tools: true });
      allActions.push(...extractToolCalls(second.message, goalIdByTitle));

      const merged = enrichActionsFromNaturalLanguage(
        input.message,
        input.goals,
        dedupeActions(allActions)
      );
      return {
        content:
          second.message.content?.trim() ||
          summarizeActions(merged) ||
          "Done! I added that for you.",
        actions: merged,
        provider: providerName(),
      };
    }

    const merged = enrichActionsFromNaturalLanguage(
      input.message,
      input.goals,
      dedupeActions(allActions)
    );
    return {
      content:
        first.message.content?.trim() ||
        summarizeActions(merged) ||
        "How can I help with your goals or quests today?",
      actions: merged,
      provider: providerName(),
    };
  } catch (e) {
    if (e instanceof Error && e.message === "NO_PROVIDER") {
      return runFallback(input);
    }
    return runFallback(input);
  }
}

function providerName(): string {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "local";
}

function dedupeActions(actions: AgentAction[]): AgentAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key =
      a.type === "create_goal"
        ? `g:${a.title}`
        : `q:${a.title}:${a.questType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeActions(actions: AgentAction[]): string | null {
  if (actions.length === 0) return null;
  const parts = actions.map((a) =>
    a.type === "create_goal"
      ? `Added goal “${a.title}”`
      : `Added quest “${a.title}”`
  );
  return parts.join(". ") + ".";
}

function runFallback(input: {
  message: string;
  goals: LifeGoal[];
  streak: number;
  level: number;
  location?: { latitude: number; longitude: number } | null;
}): AgentRunResult {
  const reply = generateFallbackReply({
    message: input.message,
    goals: input.goals,
    streak: input.streak,
    level: input.level,
    hasLocation: !!input.location,
  });

  const actions: AgentAction[] = [];

  for (const g of reply.suggestedGoals ?? []) {
    actions.push({
      type: "create_goal",
      title: g.title,
      category: g.category,
      priority: g.priority,
      whyItMatters: g.whyItMatters,
      progress: g.progress,
    });
  }

  for (const q of reply.suggestedQuests) {
    actions.push({
      type: "create_quest",
      title: q.title,
      description: q.description,
      questType: q.type,
      difficulty: q.difficulty,
      estimatedMinutes: q.estimatedMinutes,
      xpReward: q.xpReward,
      goalId: q.goalId,
      suggestedByAI: true,
    });
  }

  return {
    content: reply.content.replace(/\*\*/g, ""),
    actions,
    provider: "local",
  };
}
