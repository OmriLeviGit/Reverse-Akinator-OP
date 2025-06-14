// src/pages/Index.tsx
import React, { useState } from "react";
import { toast } from "sonner";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import ArcSelection from "../components/ArcSelection";
import FillerSettings from "../components/FillerSettings";
import DifficultySelection from "../components/DifficultySelection";
import StartButton from "../components/StartButton";
import GameScreen from "../components/GameScreen";
import CharacterRevealScreen from "../components/CharacterRevealScreen";
import { useGameContext } from "../contexts/GameContext";

type GameState = "home" | "playing" | "reveal";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("home");
  const [selectedArc, setSelectedArc] = useState("all");
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { startGame, currentGameSession } = useGameContext();

  const handleFillerPercentageChange = (value: number) => {
    setFillerPercentage(value);
    if (value === 0) {
      setIncludeNonTVFillers(false);
    }
  };

  const handleStart = async () => {
    setIsStartingGame(true);

    try {
      const gameSettings = {
        arcSelection: selectedArc,
        fillerPercentage,
        includeNonTVFillers,
        difficultyLevel: selectedDifficulty,
      };

      console.log("Starting game with settings:", gameSettings);

      await startGame(gameSettings);
      setGameState("playing");
      toast.success("Game started successfully!");
    } catch (error: any) {
      console.error("Failed to start game:", error);

      if (error.response?.data?.message === "No characters available") {
        toast.error("No characters available for this difficulty level. Try adjusting your settings.");
      } else {
        toast.error("Failed to start game. Please try again.");
      }
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleRevealCharacter = () => {
    setGameState("reveal");
  };

  const handlePlayAgain = async () => {
    setIsStartingGame(true);

    try {
      const gameSettings = {
        arcSelection: selectedArc,
        fillerPercentage,
        includeNonTVFillers,
        difficultyLevel: selectedDifficulty,
      };

      await startGame(gameSettings);
      setGameState("playing");
      toast.success("New game started!");
    } catch (error: any) {
      console.error("Failed to start new game:", error);

      if (error.response?.data?.message === "No characters available") {
        toast.error("No characters available for this difficulty level.");
        setGameState("home");
      } else {
        toast.error("Failed to start new game.");
        setGameState("home");
      }
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleReturnHome = () => {
    setGameState("home");
  };

  // Render different screens based on game state
  if (gameState === "playing") {
    return <GameScreen onRevealCharacter={handleRevealCharacter} onReturnHome={handleReturnHome} />;
  }

  if (gameState === "reveal") {
    return <CharacterRevealScreen onPlayAgain={handlePlayAgain} onReturnHome={handleReturnHome} />;
  }

  // Home screen
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background without Animation */}
      <div className="absolute inset-0 ocean-gradient"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <NavigationHeader />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Settings Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
              <div className="space-y-8">
                <div className="transform transition-all duration-300">
                  <DifficultySelection selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <ArcSelection selectedArc={selectedArc} onArcChange={setSelectedArc} />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <FillerSettings
                    fillerPercentage={fillerPercentage}
                    onFillerPercentageChange={handleFillerPercentageChange}
                    includeNonTVFillers={includeNonTVFillers}
                    onIncludeNonTVFillersChange={setIncludeNonTVFillers}
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="mt-8 flex justify-center">
              <StartButton onStart={handleStart} />
            </div>

            {/* Loading indicator */}
            {isStartingGame && (
              <div className="mt-4 text-center">
                <p className="text-white/70">Starting game...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
