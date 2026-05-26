"use client";

import { useLifeQuest } from "@/hooks/use-lifequest";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MapPin, Sparkles, Target, ChevronRight } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Set a life goal",
    description: "What matters most right now?",
    href: "/goals",
    icon: Target,
  },
  {
    step: 2,
    title: "Talk to your Life Agent",
    description: "Get daily quests tailored to you.",
    href: "/agent",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Enable location",
    description: "Unlock nearby micro-quests.",
    href: "/",
    icon: MapPin,
    hash: "#location",
  },
];

export function GettingStarted() {
  const { goals, quests, hydrated } = useLifeQuest();

  if (!hydrated || goals.length > 0 || quests.length > 0) return null;

  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Start your adventure</p>
          <p className="text-xs text-muted-foreground mt-1">
            You&apos;re at Level 1 — three quick steps to get momentum.
          </p>
        </div>
        <ol className="space-y-2">
          {steps.map(({ step, title, description, href, icon: Icon, hash }) => (
            <li key={step}>
              <Link
                href={hash ? `${href}${hash}` : href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card/80 p-3 transition-colors hover:bg-muted/40"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                  {step}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
