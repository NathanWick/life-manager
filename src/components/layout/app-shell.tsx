"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">LifeQuest</p>
              {subtitle ? (
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Your life operating system
                </p>
              )}
            </div>
          </Link>
          {title && (
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
