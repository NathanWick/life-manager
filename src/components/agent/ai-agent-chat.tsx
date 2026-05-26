"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "I'm feeling overwhelmed — help me with one small win today",
  "Break my top goal into daily quests this week",
  "Suggest a location-based quest for right now",
  "What should I focus on today?",
];

export function AiAgentChat() {
  const {
    goals,
    streak,
    level,
    location,
    chatHistory,
    addChatMessage,
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          goals,
          streak,
          level,
          location: location
            ? { latitude: location.latitude, longitude: location.longitude }
            : null,
        }),
      });
      const data = await res.json();
      addChatMessage({
        role: "assistant",
        content: data.content || "I'm here to help you on your quest!",
        suggestedQuests: data.suggestedQuests,
      });
    } catch {
      addChatMessage({
        role: "assistant",
        content:
          "I couldn't reach the server, but you've got this! Try setting a 5-minute micro-quest toward your top goal.",
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
          Encouraging coach · breaks big goals into daily wins
        </p>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-4 pb-4">
          {chatHistory.length === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p className="mb-3">
                  Hey adventurer! I know your goals
                  {location ? " and location" : ""} and can suggest quests that
                  fit your life. Try a prompt below or ask anything.
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
                {msg.suggestedQuests?.map((sq, i) => (
                  <Card key={i} className="text-left">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium">{sq.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sq.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {sq.type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {sq.estimatedMinutes} min · +{sq.xpReward} XP
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                          addQuest({
                            ...sq,
                            suggestedByAI: true,
                          })
                        }
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add to quests
                      </Button>
                    </CardContent>
                  </Card>
                ))}
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
          placeholder="Ask for quests, motivation, or a weekly plan…"
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
