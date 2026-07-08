import {
  AgentAction,
  parseToolCall,
  toolResultMessage,
} from "@/lib/agent-tools";
import {
  buildSystemPrompt,
  chatCompletion,
  ChatCompletionMessage,
  resolveAgentProvider,
} from "@/lib/agent-provider";
import { generateFallbackReply } from "@/lib/ai-fallback";
import { LifeGoal, Quest } from "@/types";

export interface AgentRunResult {
  content: string;
  actions: AgentAction[];
  provider: string;
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

function summarize(actions: AgentAction[]): string | null {
  if (!actions.length) return null;
  return (
    actions
      .map((a) =>
        a.type === "create_goal"
          ? `Added goal “${a.title}”`
          : `Added quest “${a.title}”`
      )
      .join(". ") + "."
  );
}

function providerLabel(): string {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "local";
}

export async function runLifeAgent(input: {
  message: string;
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AgentRunResult> {
  if (!resolveAgentProvider()) {
    const fallback = generateFallbackReply(input);
    return {
      content: fallback.content,
      actions: fallback.actions,
      provider: "local",
    };
  }

  const goalIdByTitle = new Map(
    input.goals.map((g) => [g.title.toLowerCase(), g.id])
  );

  const messages: ChatCompletionMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt({
        goals: input.goals,
        quests: input.quests,
        streak: input.streak,
        level: input.level,
      }),
    },
    ...(input.history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  const first = await chatCompletion({ messages, tools: true });
  const actions: AgentAction[] = [];

  for (const tc of first.message.tool_calls ?? []) {
    const parsed = parseToolCall(
      tc.function.name,
      tc.function.arguments,
      goalIdByTitle
    );
    if (parsed) actions.push(parsed);
  }

  let content = first.message.content?.trim() ?? "";

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
        content: parsed ? toolResultMessage(parsed) : "Done.",
      });
    }
    const second = await chatCompletion({ messages, tools: true });
    for (const tc of second.message.tool_calls ?? []) {
      const parsed = parseToolCall(
        tc.function.name,
        tc.function.arguments,
        goalIdByTitle
      );
      if (parsed) actions.push(parsed);
    }
    content = second.message.content?.trim() || content;
  }

  const merged = dedupeActions(actions);
  return {
    content:
      content ||
      summarize(merged) ||
      "How can I help with your goals or quests?",
    actions: merged,
    provider: providerLabel(),
  };
}
