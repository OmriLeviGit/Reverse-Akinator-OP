import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Arc } from "@/types";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { UserPreferences } from "@/types/userPreferences";

interface GameSetupFormProps {
  globalArcLimit: string;
  availableArcs: Arc[];
  onStart: (preferences: UserPreferences) => void;
  isStartingGame: boolean;
  charactersLoaded: boolean;
  isLoading: boolean;
}

const GameSetupForm = ({
  globalArcLimit,
  availableArcs,
  onStart,
  isStartingGame,
  charactersLoaded,
  isLoading,
}: GameSetupFormProps) => {
  const { preferences, updatePreferences } = useUserPreferences();

  // Helper function to determine which arc is earlier
  const getEarlierArc = (arc1: string, arc2: string): string => {
    // If either arc is "All", return the other one (or "All" if both are "All")
    if (arc1 === "All" && arc2 === "All") return "All";
    if (arc1 === "All") return arc2;
    if (arc2 === "All") return arc1;

    // Find indices in the original availableArcs array (earlier arcs have lower indices)
    const index1 = availableArcs.findIndex((arc) => arc.name === arc1);
    const index2 = availableArcs.findIndex((arc) => arc.name === arc2);

    // If either arc is not found, return the found one or fallback
    if (index1 === -1 && index2 === -1) return globalArcLimit; // fallback
    if (index1 === -1) return arc2;
    if (index2 === -1) return arc1;

    // Return the arc with the lower index (earlier in the series)
    return index1 <= index2 ? arc1 : arc2;
  };

  // Handle arc selection with spoiler protection when globalArcLimit changes
  useEffect(() => {
    if (availableArcs.length === 0 || !globalArcLimit) {
      return; // Wait for required data
    }

    // Apply spoiler protection to current preferredArc
    const safeArc = getEarlierArc(preferences.preferredArc, globalArcLimit);

    // Only update if the safe arc is different from current preference
    if (safeArc !== preferences.preferredArc) {
      console.log("🔍 Arc spoiler check in form:", {
        currentPreferredArc: preferences.preferredArc,
        globalArcLimit,
        safeArc,
      });
      updatePreferences({ preferredArc: safeArc });
    }
  }, [globalArcLimit, availableArcs, preferences.preferredArc, updatePreferences]);

  // Filter arcs based on globalArcLimit (spoiler protection)
  const getFilteredArcs = () => {
    if (globalArcLimit === "All") {
      return [{ name: "All", chapter: 0, episode: 0 }, ...[...availableArcs].reverse()];
    }

    // Find the index of globalArcLimit arc in the original array
    const maxArcIndex = availableArcs.findIndex((arc) => arc.name === globalArcLimit);
    if (maxArcIndex === -1) {
      return [...availableArcs].reverse(); // Fallback to all arcs reversed
    }

    // Get arcs from beginning up to and including globalArcLimit, then reverse
    return availableArcs.slice(0, maxArcIndex + 1).reverse();
  };

  const filteredArcs = getFilteredArcs();

  const handleFillerSliderChange = (value: number[]) => {
    const newValue = value[0];

    // Auto-disable non-TV fillers when percentage is 0
    if (newValue === 0) {
      updatePreferences({
        fillerPercentage: newValue,
        includeNonTVFillers: false,
      });
    } else {
      updatePreferences({ fillerPercentage: newValue });
    }
  };

  const handleStartGame = () => {
    // Call the parent's onStart with current preferences
    onStart(preferences);
  };

  return (
    <Card className="w-full max-w-2xl bg-card border-border shadow-lg">
      <CardContent className="space-y-8 pt-8">
        {/* Difficulty Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Character Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "easy", label: "Easy", description: "Characters rated 1-3" },
              { id: "medium", label: "Medium", description: "Characters rated 2-4" },
              { id: "hard", label: "Hard", description: "Characters rated 3-5" },
            ].map((level) => (
              <Button
                key={level.id}
                variant={preferences.difficulty === level.id ? "default" : "secondary"}
                onClick={() => updatePreferences({ difficulty: level.id as "easy" | "medium" | "hard" })}
                className="h-16 font-medium transition-all flex flex-col justify-center items-center py-2"
              >
                <span className="capitalize font-semibold leading-none">{level.label}</span>
                <span className="text-xs opacity-75 leading-none -mt-0.5">{level.description}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="unrated"
              checked={preferences.includeUnrated}
              onChange={(e) => updatePreferences({ includeUnrated: e.target.checked })}
              className=""
            />
            <label htmlFor="unrated" className="text-sm text-foreground cursor-pointer">
              Include Unrated Characters
            </label>
          </div>
        </div>

        {/* Arc Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Character Arc Limit</h3>
          <Select
            value={preferences.preferredArc || ""}
            onValueChange={(arc) => updatePreferences({ preferredArc: arc })}
          >
            <SelectTrigger className="bg-input hover:bg-input hover:brightness-125 border-border text-foreground">
              <SelectValue placeholder="Select an arc" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {filteredArcs.map((arc, index) => (
                <SelectItem key={index} value={arc.name} className="text-popover-foreground hover:bg-secondary">
                  <div className="grid grid-cols-[440px_70px_60px] w-full font-mono text-sm">
                    <span className="text-left truncate text-foreground">
                      {arc.name === "All" ? "All Arcs" : arc.name}
                    </span>
                    <span className="text-left text-muted-foreground text-xs">
                      {arc.episode > 0 ? `Ep.${arc.episode}` : ""}
                    </span>
                    <span className="text-left text-muted-foreground text-xs">
                      {arc.chapter > 0 ? `Ch.${arc.chapter}` : ""}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filler Character Settings */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Filler Character Probability</h3>
          <div className="space-y-5">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Probability</span>
                <span className="text-sm font-medium text-foreground">{preferences.fillerPercentage}%</span>
              </div>
              <Slider
                value={[preferences.fillerPercentage]}
                onValueChange={handleFillerSliderChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="non-tv"
                checked={preferences.includeNonTVFillers}
                onChange={(e) => updatePreferences({ includeNonTVFillers: e.target.checked })}
                disabled={preferences.fillerPercentage === 0}
                className=""
              />
              <label
                htmlFor="non-tv"
                className={`text-sm cursor-pointer ${
                  preferences.fillerPercentage === 0 ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                Include Non-TV Content (Movies, Games, etc.)
              </label>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartGame}
          disabled={isStartingGame || isLoading || !charactersLoaded}
          className="w-full h-14 text-lg font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {isStartingGame ? "Starting Game..." : "Start Game"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameSetupForm;
