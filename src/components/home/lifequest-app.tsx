"use client";

import { MetricsStrip } from "@/components/home/metrics-strip";
import { ChatPanel } from "@/components/home/chat-panel";
import { Sparkles } from "lucide-react";

export function LifeQuestApp() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 flex items-center gap-2 border-b px-4 py-3 safe-top">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">LifeQuest</h1>
          <p className="text-[11px] text-muted-foreground">
            Your life operating system
          </p>
        </div>
      </header>

      <MetricsStrip />

      <ChatPanel />
    </div>
  );
}
