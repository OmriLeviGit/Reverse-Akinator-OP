// src/components/GameSetupForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Arc } from "@/types";

interface GameSetupFormProps {
  maxArcSeen: string; // Changed from number to string
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
  // Local state for slider (needs to be array for the Slider component)
  const [fillerSliderValue, setFillerSliderValue] = useState([fillerPercentage]);

  // Update slider when prop changes
  useEffect(() => {
    setFillerSliderValue([fillerPercentage]);
  }, [fillerPercentage]);

  const handleFillerSliderChange = (value: number[]) => {
    setFillerSliderValue(value);
    onFillerPercentageChange(value[0]);
  };

  const handleStartGame = () => {
    onStart();
  };

  // Filter available arcs based on maxArcSeen if needed
  // You might need to adjust this logic based on how your arcs are structured
  const getDisplayValue = (arc: any) => {
    // Adjust this based on your arc object structure
    return typeof arc === "string" ? arc : arc.name || arc.label || String(arc);
  };

  const getArcValue = (arc: any) => {
    // Adjust this based on your arc object structure
    return typeof arc === "string" ? arc : arc.value || arc.id || String(arc);
  };

  return (
    <Card className="w-full max-w-2xl bg-gradient-card border-border shadow-lg">
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
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary hover:bg-secondary-hover text-secondary-foreground border-border"
                }`}
              >
                {level}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="unrated"
              checked={includeUnrated}
              onCheckedChange={(checked) => onIncludeUnratedChange(!!checked)}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="unrated" className="text-sm text-muted-foreground cursor-pointer">
              Include Unrated Characters
            </label>
          </div>
        </div>

        {/* Arc Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Story Arc Selection</h3>
          <Select value={selectedArc} onValueChange={onArcChange}>
            <SelectTrigger className="bg-input hover:bg-input border-border text-foreground">
              <SelectValue placeholder="Select an arc" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {availableArcs.map((arc, index) => (
                <SelectItem key={index} value={getArcValue(arc)} className="text-popover-foreground hover:bg-secondary">
                  {getDisplayValue(arc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="non-tv"
                checked={includeNonTVFillers}
                onCheckedChange={(checked) => onIncludeNonTVFillersChange(!!checked)}
                disabled={fillerPercentage === 0}
                className={`border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                  fillerPercentage === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <label
                htmlFor="non-tv"
                className={`text-sm cursor-pointer ${
                  fillerPercentage === 0 ? "text-disabled-foreground" : "text-muted-foreground"
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
