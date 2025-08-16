import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Arc } from "@/types";

interface GameSetupFormProps {
  maxArcSeen: string;
  availableArcs: Arc[];
  selectedDifficulty: "easy" | "medium" | "hard";
  onDifficultyChange: (difficulty: "easy" | "medium" | "hard") => void;
  includeUnrated: boolean;
  onIncludeUnratedChange: (include: boolean) => void;
  selectedArc: string;
  onArcChange: (arc: string) => void;
  fillerPercentage: number;
  onFillerPercentageChange: (value: number) => void;
  includeNonTVFillers: boolean;
  onIncludeNonTVFillersChange: (include: boolean) => void;
  onStart: () => void;
  isStartingGame: boolean;
  charactersLoaded: boolean;
  isLoading: boolean;
}
const GameSetupForm = ({
  maxArcSeen,
  availableArcs,
  selectedDifficulty,
  onDifficultyChange,
  includeUnrated,
  onIncludeUnratedChange,
  selectedArc,
  onArcChange,
  fillerPercentage,
  onFillerPercentageChange,
  includeNonTVFillers,
  onIncludeNonTVFillersChange,
  onStart,
  isStartingGame,
  charactersLoaded,
  isLoading,
}: GameSetupFormProps) => {
  const [fillerSliderValue, setFillerSliderValue] = useState([fillerPercentage]);

  useEffect(() => {
    setFillerSliderValue([fillerPercentage]);
  }, [fillerPercentage]);

  // Filter arcs based on maxArcSeen (spoiler protection)
  const getFilteredArcs = () => {
    if (maxArcSeen === "All") {
      // Return all arcs in reverse order (newest first)
      return [...availableArcs].reverse();
    }

    // Find the index of maxArcSeen arc in the original array
    const maxArcIndex = availableArcs.findIndex((arc) => arc.name === maxArcSeen);
    if (maxArcIndex === -1) {
      return [...availableArcs].reverse(); // Fallback to all arcs reversed
    }

    // Get arcs from beginning up to and including maxArcSeen, then reverse
    return availableArcs.slice(0, maxArcIndex + 1).reverse();
  };

  const filteredArcs = getFilteredArcs();

  // Create options array with "All Arcs" only if maxArcSeen is "All"
  const getSelectOptions = () => {
    const options = [];

    // Only add "All Arcs" option if user can see all arcs
    if (maxArcSeen === "All") {
      options.push({ name: "All", displayName: "All Arcs" });
    }

    // Add filtered arcs
    filteredArcs.forEach((arc) => {
      options.push({ name: arc.name, displayName: arc.name });
    });

    return options;
  };

  const selectOptions = getSelectOptions();

  // Set default selectedArc to maxArcSeen when availableArcs load or maxArcSeen changes
  useEffect(() => {
    if (maxArcSeen && availableArcs.length > 0 && (!selectedArc || selectedArc === "")) {
      console.log("Setting default arc to:", maxArcSeen);
      onArcChange(maxArcSeen);
    }
  }, [maxArcSeen, availableArcs, selectedArc, onArcChange]);

  const handleFillerSliderChange = (value: number[]) => {
    setFillerSliderValue(value);
    onFillerPercentageChange(value[0]);
  };

  const handleStartGame = () => {
    onStart();
  };

  return (
    <Card className="w-full max-w-2xl bg-card border-border shadow-lg">
      <CardContent className="space-y-8 pt-8">
        {/* Difficulty Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Character Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {(["easy", "medium", "hard"] as const).map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty === level ? "default" : "outline"}
                onClick={() => onDifficultyChange(level)}
                className={`h-12 font-medium capitalize transition-all ${
                  selectedDifficulty === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                }`}
              >
                {level}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="unrated"
              checked={includeUnrated}
              onChange={(e) => onIncludeUnratedChange(e.target.checked)}
              className=""
            />
            <label htmlFor="unrated" className="text-sm text-foreground cursor-pointer">
              Include Unrated Characters
            </label>
          </div>
        </div>

        {/* Arc Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Story Arc Selection</h3>
          <Select value={selectedArc || ""} onValueChange={onArcChange}>
            <SelectTrigger className="bg-input hover:bg-input border-border text-foreground">
              <SelectValue placeholder="Select an arc" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {filteredArcs.map((arc, index) => (
                <SelectItem key={index} value={arc.name} className="text-popover-foreground hover:bg-secondary">
                  <div className="grid grid-cols-[360px_80px_70px] w-full font-mono text-sm">
                    <span className="text-left truncate text-foreground">{arc.name}</span>
                    <span className="text-right text-muted-foreground text-xs">
                      {arc.last_episode > 0 ? `Ep.${arc.last_episode}` : ""}
                    </span>
                    <span className="text-right text-muted-foreground text-xs">
                      {arc.last_chapter > 0 ? `Ch.${arc.last_chapter}` : ""}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rest of the component remains the same */}
        {/* Filler Character Settings */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Filler Character Probability</h3>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Probability</span>
                <span className="text-sm font-medium text-foreground">{fillerSliderValue[0]}%</span>
              </div>
              <Slider
                value={fillerSliderValue}
                onValueChange={handleFillerSliderChange}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="non-tv"
                checked={includeNonTVFillers}
                onChange={(e) => onIncludeNonTVFillersChange(e.target.checked)}
                disabled={fillerPercentage === 0}
                className=""
              />
              <label
                htmlFor="non-tv"
                className={`text-sm cursor-pointer ${
                  fillerPercentage === 0 ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                Include Non-TV Content (Movies, Games, etc.)
              </label>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-6">
          <Button
            onClick={handleStartGame}
            disabled={isStartingGame || isLoading || !charactersLoaded}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 disabled:opacity-50"
          >
            {isStartingGame ? "Starting Game..." : "Start Game"}
          </Button>
        </div>

        {/* Character loading status */}
        {!charactersLoaded && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-muted-foreground text-sm">Loading character data in background...</p>
            </div>
          </div>
        )}

        {/* Starting Game Loading */}
        {isStartingGame && (
          <div className="text-center">
            <p className="text-muted-foreground">Starting game...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GameSetupForm;
