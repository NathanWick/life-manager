"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("lifequest-install-dismissed");
    if (wasDismissed) return;

    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !(window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setDismissed(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("lifequest-install-dismissed", "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  if (dismissed) return null;

  return (
    <Card className="border-primary/20 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary h-fit">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Install LifeQuest</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS && !deferred
                  ? "Tap Share → Add to Home Screen for the full app experience."
                  : "Add to your home screen for quick access like a native app."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {deferred && (
          <Button size="sm" className="w-full mt-3" onClick={install}>
            Install app
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
