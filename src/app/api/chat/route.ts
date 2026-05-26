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
      location,
      history = [],
    } = body as {
      message: string;
      goals: LifeGoal[];
      quests: Quest[];
      streak: number;
      level: number;
      location?: { latitude: number; longitude: number } | null;
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
      location,
      history,
    });

    return NextResponse.json({
      content: result.content,
      actions: result.actions,
      provider: result.provider,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
