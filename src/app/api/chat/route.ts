import { runLifeAgent } from "@/lib/agent-run";
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
      history = [],
    } = body as {
      message: string;
      goals: LifeGoal[];
      quests: Quest[];
      streak: number;
      level: number;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const result = await runLifeAgent({
      message: message.trim(),
      goals,
      quests,
      streak,
      level,
      history,
    });

    return NextResponse.json({
      content: result.content,
      actions: result.actions,
      provider: result.provider,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isRateLimit = msg.includes("RATE_LIMIT");
    return NextResponse.json(
      {
        error: isRateLimit
          ? "RATE_LIMIT: Wait 60 seconds and try again."
          : `Failed: ${msg.slice(0, 200)}`,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
