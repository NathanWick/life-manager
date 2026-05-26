"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLifeQuest } from "@/hooks/use-lifequest";
import {
  formatLocationLabel,
  getLocationSuggestions,
} from "@/lib/location-suggestions";
import { questXpReward } from "@/lib/gamification";
import { MapPin, Navigation, Plus } from "lucide-react";

export function LocationBanner() {
  const { location, setLocation, addQuest, hydrated } = useLifeQuest();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
        setDismissed(false);
      },
      () => {
        setError("Could not get location. Check permissions and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (hydrated && !location) {
      const asked = sessionStorage.getItem("lifequest-loc-asked");
      if (!asked) {
        sessionStorage.setItem("lifequest-loc-asked", "1");
      }
    }
  }, [hydrated, location]);

  if (!hydrated || dismissed) return null;

  const suggestion = location
    ? getLocationSuggestions()[Math.floor(Math.random() * 3)]
    : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Location awareness</p>
            {location ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Active · {formatLocationLabel(location.latitude, location.longitude)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable location for nearby quest suggestions
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
        </div>

        {location && suggestion && (
          <div className="rounded-lg bg-background/60 p-3 text-sm">
            <p className="text-muted-foreground">{suggestion.message}</p>
            <p className="font-medium mt-1">{suggestion.questTitle}</p>
            <Button
              size="sm"
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => {
                addQuest({
                  title: suggestion.questTitle,
                  description: suggestion.questDescription,
                  type: "daily",
                  difficulty: suggestion.difficulty,
                  estimatedMinutes: suggestion.estimatedMinutes,
                  xpReward: questXpReward(suggestion.difficulty, "daily"),
                  locationContext: suggestion.context,
                  suggestedByAI: true,
                });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add location quest
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={location ? "outline" : "default"}
            className="flex-1"
            onClick={requestLocation}
            disabled={loading}
          >
            <Navigation className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "Locating…" : location ? "Refresh" : "Enable location"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
