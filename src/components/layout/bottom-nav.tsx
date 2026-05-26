"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHash } from "@/hooks/use-hash";
import { Home, Target, Scroll, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home, match: "home" as const },
  { href: "/goals", label: "Goals", icon: Target, match: "goals" as const },
  { href: "/quests", label: "Quests", icon: Scroll, match: "quests" as const },
  { href: "/#agent", label: "Agent", icon: Sparkles, match: "agent" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const hash = useHash();

  const isActive = (match: (typeof navItems)[number]["match"]) => {
    if (match === "home") return pathname === "/" && hash !== "#agent";
    if (match === "agent") return pathname === "/" && hash === "#agent";
    if (match === "goals") return pathname.startsWith("/goals");
    if (match === "quests") return pathname.startsWith("/quests");
    return false;
  };

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] transition-transform duration-200"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
