import { runLifeAgentViaMcp } from "@/lib/agent-mcp-run";
import { LifeGoal, Quest } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      goals = [],
      quests = [],
      streak = 0,
      level = 1,
      xp = 0,
      history = [],
    } = body as {
      message: string;
      goals: LifeGoal[];
      quests: Quest[];
      streak: number;
      level: number;
      xp: number;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const result = await runLifeAgentViaMcp({
      message: message.trim(),
      goals,
      quests,
      streak,
      level,
      xp,
      history,
    });

    return NextResponse.json({
      content: result.content,
      actions: result.actions,
      provider: result.provider,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isRateLimit =
      msg.includes("RATE_LIMIT") ||
      msg.includes("429") ||
      /rate limit/i.test(msg);
    const error = isRateLimit
      ? "RATE_LIMIT: Groq free tier limit hit. Wait 60 seconds and try again, or set GROQ_MODEL=llama-3.1-8b-instant in Vercel for higher limits."
      : `Failed to process message: ${msg.slice(0, 200)}`;
    return NextResponse.json({ error }, { status: isRateLimit ? 429 : 500 });
  }
}
