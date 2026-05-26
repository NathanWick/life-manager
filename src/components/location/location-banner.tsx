"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { reverseGeocode } from "@/lib/geocode";
import {
  formatLocationLabel,
  getLocationSuggestions,
} from "@/lib/location-suggestions";
import { questXpReward } from "@/lib/gamification";
import { toastQuestAdded } from "@/lib/toast";
import { MapPin, Navigation, Plus } from "lucide-react";

const DISMISS_KEY = "lifequest-location-dismissed";

export function LocationBanner() {
  const { location, setLocation, addQuest, hydrated } = useLifeQuest();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [placeName, setPlaceName] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    }
  }, [hydrated]);

  useEffect(() => {
    if (!location) {
      setPlaceName(null);
      return;
    }
    let cancelled = false;
    reverseGeocode(location.latitude, location.longitude).then((name) => {
      if (!cancelled) setPlaceName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  const suggestion = useMemo(() => {
    if (!location) return null;
    const suggestions = getLocationSuggestions();
    const index =
      Math.abs(
        Math.floor(location.latitude * 100) + Math.floor(location.longitude * 100)
      ) % suggestions.length;
    return suggestions[index];
  }, [location]);

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
        localStorage.removeItem(DISMISS_KEY);
      },
      () => {
        setError("Could not get location. Check permissions and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!hydrated || dismissed) return null;

  const locationLabel = location
    ? placeName ||
      `Near ${formatLocationLabel(location.latitude, location.longitude)}`
    : null;

  return (
    <Card id="location" className="border-primary/20 bg-primary/5 scroll-mt-24">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Location awareness</p>
            {location ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Active · {locationLabel}
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
                toastQuestAdded(suggestion.questTitle);
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
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
