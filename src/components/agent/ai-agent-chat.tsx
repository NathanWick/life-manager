"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import { applyAgentActions } from "@/lib/apply-agent-actions";
import type { AgentAction } from "@/lib/agent-tools";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type AiAgentChatProps = {
  /** Embedded on dashboard (scrolls with page) vs standalone page */
  variant?: "embedded" | "page";
};

export function AiAgentChat({ variant = "embedded" }: AiAgentChatProps) {
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { keyboardInset, setInputFocused, keyboardOpen } = useMobileKeyboard();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chatHistory, loading]);

  useEffect(() => {
    document.documentElement.classList.toggle("keyboard-open", keyboardOpen);
    return () => document.documentElement.classList.remove("keyboard-open");
  }, [keyboardOpen]);

  const scrollInputIntoView = () => {
    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

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
      <div className="flex min-h-[12rem] items-center justify-center text-muted-foreground text-sm">
        Waking up your Life Agent…
      </div>
    );
  }

  const messages = (
    <div className="space-y-4 pb-2">
      {chatHistory.length === 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground space-y-3">
          <p>
            Say your <strong className="text-foreground">north star</strong> or any
            goal — I&apos;ll create it. Ask for <strong className="text-foreground">quests</strong>{" "}
            with steps and YouTube links.
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
        </div>
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
  );

  const inputBar = (
    <form
      className="flex gap-2 border-t bg-card p-3"
      style={{
        paddingBottom: `max(0.75rem, ${keyboardInset}px)`,
      }}
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(input);
      }}
    >
      <Textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="I want to learn guitar and practice 20 min a day…"
        rows={2}
        className="resize-none min-h-[44px] text-base"
        onFocus={() => {
          setInputFocused(true);
          scrollInputIntoView();
        }}
        onBlur={() => setInputFocused(false)}
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
  );

  if (variant === "page") {
    return (
      <div className="flex flex-col min-h-0">
        <div className="mb-3">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Life Agent
          </h1>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain -mx-1 px-1 min-h-[200px] max-h-[50vh]"
        >
          {messages}
        </div>
        {inputBar}
      </div>
    );
  }

  return (
    <Card
      id="agent"
      className="scroll-mt-20 overflow-hidden shadow-sm border-primary/15"
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Life Agent
        </CardTitle>
        <p className="text-xs text-muted-foreground font-normal">
          Chat below — goals &amp; quests created automatically
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="overflow-y-auto overscroll-contain px-4 max-h-[min(45vh,380px)] sm:max-h-[420px]"
        >
          {messages}
        </div>
        {inputBar}
      </CardContent>
    </Card>
  );
}
