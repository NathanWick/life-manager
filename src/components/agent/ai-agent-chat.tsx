"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { applyAgentActions } from "@/lib/apply-agent-actions";
import type { AgentAction } from "@/lib/agent-tools";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Sparkles, Target, Scroll, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STARTER_PROMPTS = [
  "My north star is to get a six pack",
  "Give me 2 interesting quests for today with YouTube",
  "I want to learn guitar this year",
  "Give me an actionable quest for right now",
];

export function AiAgentChat() {
  const {
    goals,
    quests,
    streak,
    level,
    location,
    chatHistory,
    addChatMessage,
    addGoal,
    addQuest,
    hydrated,
  } = useLifeQuest();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    addChatMessage({ role: "user", content: message });
    setInput("");
    setLoading(true);

    try {
      const history = chatHistory.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          goals,
          quests,
          streak,
          level,
          location: location
            ? { latitude: location.latitude, longitude: location.longitude }
            : null,
          history,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const actions = (data.actions ?? []) as AgentAction[];
      const applied = applyAgentActions(actions, addGoal, addQuest);

      if (applied.length > 0) {
        const goalsN = applied.filter((a) => a.type === "create_goal").length;
        const questsN = applied.filter((a) => a.type === "create_quest").length;
        const parts: string[] = [];
        if (goalsN) parts.push(`${goalsN} goal${goalsN > 1 ? "s" : ""}`);
        if (questsN) parts.push(`${questsN} quest${questsN > 1 ? "s" : ""}`);
        toast.success(`Added ${parts.join(" & ")}`);
      }

      addChatMessage({
        role: "assistant",
        content: data.content || "How can I help?",
        appliedActions: applied.length > 0 ? applied : undefined,
      });
    } catch {
      addChatMessage({
        role: "assistant",
        content:
          "I couldn't reach the agent. Add GROQ_API_KEY on Vercel for a cheap AI, or try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Waking up your Life Agent…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)]">
      <div className="mb-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Life Agent
        </h1>
        <p className="text-sm text-muted-foreground">
          Just talk — I&apos;ll create goals &amp; quests for you. No forms.
        </p>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-4 pb-4">
          {chatHistory.length === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-sm text-muted-foreground space-y-3">
                <p>
                  Say your <strong className="text-foreground">north star</strong>{" "}
                  or any life goal — I&apos;ll create it. Ask for{" "}
                  <strong className="text-foreground">quests</strong> and get steps,
                  YouTube links, and concrete actions. No forms.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs rounded-lg border bg-background px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={
                    msg.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted"
                  }
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-[85%] space-y-2",
                  msg.role === "user" ? "text-right" : ""
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
                {msg.appliedActions && msg.appliedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.appliedActions.map((a, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] gap-1"
                      >
                        {a.type === "create_goal" ? (
                          <Target className="h-3 w-3" />
                        ) : (
                          <Scroll className="h-3 w-3" />
                        )}
                        {a.type === "create_goal" ? "Goal" : "Quest"}: {a.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="flex gap-2 pt-3 border-t mt-auto"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I want to learn guitar and practice 20 min a day…"
          rows={2}
          className="resize-none min-h-[44px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 h-11 w-11"
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
