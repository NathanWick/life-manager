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
  if (process.env.GROQ_API_KEY) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
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
}): string {
  const active = ctx.quests.filter((q) => q.status === "active");
  return `You are LifeQuest's Life Agent. Be warm and brief (1-2 sentences).

Goals = long-term north stars → use create_goal.
Quests = short tasks for today/this week → use create_quest.

When the user describes a dream or direction, call create_goal.
When they want something to do now, call create_quest.
Always use tools when creating things — never only suggest.

State: Level ${ctx.level}, streak ${ctx.streak}d
Goals: ${JSON.stringify(ctx.goals.map((g) => ({ title: g.title, progress: g.progress })))}
Active quests: ${JSON.stringify(active.map((q) => q.title))}`;
}

export async function chatCompletion(params: {
  messages: ChatCompletionMessage[];
  tools?: boolean;
}): Promise<{ message: ChatCompletionMessage; finishReason: string }> {
  const provider = resolveAgentProvider();
  if (!provider) throw new Error("NO_PROVIDER");

  const body: Record<string, unknown> = {
    model: provider.model,
    messages: params.messages,
    temperature: 0.5,
    max_tokens: 400,
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
    headers["HTTP-Referer"] = "https://lifequest.app";
    headers["X-Title"] = "LifeQuest";
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    message: choice?.message ?? { role: "assistant", content: "" },
    finishReason: choice?.finish_reason ?? "stop",
  };
}
