import { AGENT_TOOLS } from "@/lib/agent-tools";
import { LifeGoal, Quest } from "@/types";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatCompletionMessage {
  role: ChatRole;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface ProviderConfig {
  url: string;
  apiKey: string;
  model: string;
}

export function resolveAgentProvider(): ProviderConfig | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      model:
        process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  return null;
}

export function buildSystemPrompt(ctx: {
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  location?: { latitude: number; longitude: number } | null;
}): string {
  const activeQuests = ctx.quests.filter((q) => q.status === "active");

  return `You are the Life Agent for LifeQuest — warm, concise, encouraging.

## Goals vs Quests (CRITICAL)
- **Goals** = LONG-TERM north stars (weeks to years): "Run a marathon", "Save $10k", "Learn Spanish". Use tool \`create_goal\`.
- **Quests** = SHORT-TERM actions (today or this week): "Run 2 miles", "Transfer $50 to savings". Use tool \`create_quest\`. Quests earn XP when done.

Never use create_goal for a one-off task. Never use create_quest for a multi-month ambition—create a goal, then quests that advance it.

When the user asks to add a goal, call create_goal. When they need something to do now, call create_quest (link via goalTitle if it matches an existing goal).

Keep replies short (2-3 sentences) unless they ask for detail. Use tools proactively when appropriate—don't only suggest in text.

## User state
Goals: ${JSON.stringify(
    ctx.goals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      priority: g.priority,
      progress: g.progress,
      why: g.whyItMatters,
    }))
  )}
Active quests: ${JSON.stringify(
    activeQuests.map((q) => ({
      title: q.title,
      type: q.type,
      difficulty: q.difficulty,
      goalId: q.goalId,
    }))
  )}
Level: ${ctx.level}, Streak: ${ctx.streak} days
Location: ${ctx.location ? `${ctx.location.latitude}, ${ctx.location.longitude}` : "unknown"}`;
}

export async function chatCompletion(params: {
  messages: ChatCompletionMessage[];
  tools?: boolean;
}): Promise<{
  message: ChatCompletionMessage;
  finishReason: string;
}> {
  const provider = resolveAgentProvider();
  if (!provider) {
    throw new Error("NO_PROVIDER");
  }

  const body: Record<string, unknown> = {
    model: provider.model,
    messages: params.messages,
    temperature: 0.6,
    max_tokens: 700,
  };

  if (params.tools) {
    body.tools = AGENT_TOOLS;
    body.tool_choice = "auto";
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider.url.includes("openrouter.ai")) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_REFERRER || "https://lifequest.app";
    headers["X-Title"] = "LifeQuest";
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    message: choice?.message ?? { role: "assistant", content: "" },
    finishReason: choice?.finish_reason ?? "stop",
  };
}

export function getProviderLabel(): string {
  if (process.env.GROQ_API_KEY) return "Groq";
  if (process.env.OPENROUTER_API_KEY) return "OpenRouter";
  if (process.env.OPENAI_API_KEY) return "OpenAI";
  return "local";
}
