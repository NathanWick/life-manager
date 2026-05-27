"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import { applyAgentActions } from "@/lib/apply-agent-actions";
import type { AgentAction } from "@/lib/agent-tools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Target, Scroll, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STARTERS = [
  "My north star is to get healthier",
  "Give me 2 quests for today",
  "I want to learn guitar this year",
];

export function ChatPanel() {
  const {
    goals,
    quests,
    streak,
    level,
    xp,
    chatHistory,
    addChatMessage,
    addGoal,
    addQuest,
    hydrated,
  } = useLifeQuest();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { keyboardInset } = useMobileKeyboard();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatHistory, loading]);

  const send = async (text: string) => {
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
          quests,
          streak,
          level,
          xp,
          location: null,
          history: chatHistory.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const applied = applyAgentActions(
        (data.actions ?? []) as AgentAction[],
        addGoal,
        addQuest
      );
      if (applied.length > 0) {
        const parts: string[] = [];
        const g = applied.filter((a) => a.type === "create_goal").length;
        const q = applied.filter((a) => a.type === "create_quest").length;
        if (g) parts.push(`${g} goal${g > 1 ? "s" : ""}`);
        if (q) parts.push(`${q} quest${q > 1 ? "s" : ""}`);
        toast.success(`Added ${parts.join(" & ")}`);
      }

      addChatMessage({
        role: "assistant",
        content: data.content || "Here to help!",
        appliedActions: applied.length ? applied : undefined,
      });
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Unknown error";
      const isRateLimit =
        detail.includes("RATE_LIMIT") ||
        detail.includes("429") ||
        /rate limit/i.test(detail);
      const friendly = isRateLimit
        ? "Groq rate limit — wait about a minute, then try again. Or in Vercel set GROQ_MODEL to llama-3.1-8b-instant (higher free limits than Qwen)."
        : detail.includes("model") && detail.includes("not exist")
          ? "Wrong model name — set GROQ_MODEL to qwen/qwen3-32b in Vercel and redeploy."
          : detail.includes("GROQ_API_KEY") || detail.includes("NO_PROVIDER")
            ? "Add GROQ_API_KEY in Vercel (Production), redeploy, then try again."
            : detail;
      addChatMessage({
        role: "assistant",
        content: friendly,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {!hydrated ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading…
          </p>
        ) : chatHistory.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Tell me your north star or what to do today — I&apos;ll create
              goals &amp; quests for you.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-xs rounded-full border px-3 py-1.5 hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    msg.role === "assistant"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[88%] space-y-1",
                    msg.role === "user" && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap inline-block text-left",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.appliedActions?.map((a, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-[10px] mr-1"
                    >
                      {a.type === "create_goal" ? (
                        <Target className="h-2.5 w-2.5 mr-0.5" />
                      ) : (
                        <Scroll className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {a.title}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
              </p>
            )}
            <div ref={endRef} className="h-1" />
          </div>
        )}
      </div>

      <form
        className="shrink-0 flex gap-2 border-t bg-background px-3 pt-3"
        style={{
          paddingBottom: `calc(0.75rem + ${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          enterKeyHint="send"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your Life Agent…"
          className="flex-1 min-w-0 h-11 rounded-xl border border-input bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onFocus={() => {
            setTimeout(() => {
              endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 300);
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
