import { generateFallbackReply } from "@/lib/ai-fallback";
import { LifeGoal } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      goals = [],
      streak = 0,
      level = 1,
      location,
    } = body as {
      message: string;
      goals: LifeGoal[];
      streak: number;
      level: number;
      location?: { latitude: number; longitude: number } | null;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are the Life Agent for LifeQuest — a warm, encouraging personal life coach that gamifies self-improvement. Break big goals into small daily/weekly quests. Be concise (2-4 short paragraphs). Reference the user's goals when relevant. If location is available, suggest location-aware micro-quests.

User goals: ${JSON.stringify(goals.map((g) => ({ title: g.title, category: g.category, progress: g.progress, why: g.whyItMatters })))}
Level: ${level}, Streak: ${streak} days
Location: ${location ? `${location.latitude}, ${location.longitude}` : "unknown"}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content =
            data.choices?.[0]?.message?.content ||
            "I'm here to help — try asking about a specific goal!";
          const fallback = generateFallbackReply({
            message,
            goals,
            streak,
            level,
            hasLocation: !!location,
          });
          return NextResponse.json({
            content,
            suggestedQuests: fallback.suggestedQuests,
          });
        }
      } catch {
        // fall through to local AI
      }
    }

    const reply = generateFallbackReply({
      message,
      goals,
      streak,
      level,
      hasLocation: !!location,
    });

    return NextResponse.json({
      content: reply.content.replace(/\*\*/g, ""),
      suggestedQuests: reply.suggestedQuests,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
