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
import { useGameContext } from "../contexts/GameContext"; // ✅ Add this import

type GameState = "home" | "playing" | "reveal";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("home");
  const [selectedArc, setSelectedArc] = useState("all");
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [isStartingGame, setIsStartingGame] = useState(false);

  // ✅ Use GameContext instead of local state
  const { allCharacters, isLoadingCharacters, startGame, currentGameSession, revealCharacter } = useGameContext();

  // ✅ Derive charactersLoaded from GameContext
  const charactersLoaded = !isLoadingCharacters && allCharacters.length > 0;

  const handleFillerPercentageChange = (value: number) => {
    setFillerPercentage(value);
    if (value === 0) {
      setIncludeNonTVFillers(false);
    }
  };

  const handleStart = async () => {
    // Don't allow starting game until characters are loaded
    if (!charactersLoaded) {
      toast.error("Character database is still loading. Please wait...");
      return;
    }

    setIsStartingGame(true);

    try {
      const gameSettings = {
        arcSelection: selectedArc,
        fillerPercentage,
        includeNonTVFillers,
        difficultyLevel: selectedDifficulty,
      };

      console.log("Starting game with settings:", gameSettings);

      // ✅ Use startGame from GameContext
      await startGame(gameSettings);
      setGameState("playing");
      toast.success("Game started successfully!");
    } catch (error: any) {
      console.error("Failed to start game:", error);

      if (error.message?.includes("No characters available")) {
        toast.error("No characters available for this difficulty level. Try adjusting your settings.");
      } else {
        toast.error("Failed to start game. Please try again.");
      }
    } finally {                <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>

      setIsStartingGame(false);
    }
  };

  const handleRevealCharacter = async () => {
    console.log("🎭 handleRevealCharacter called");

    try {
      // Actually call the API to get character data
      const result = await revealCharacter();
      console.log("✅ Character revealed:", result);

      // Then change the UI state
      setGameState("reveal");
    } catch (error) {
      console.error("❌ Failed to reveal character:", error);
      toast.error("Failed to reveal character");
    }
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

      // ✅ Use startGame from GameContext
      await startGame(gameSettings);
      setGameState("playing");
      toast.success("New game started!");
    } catch (error: any) {
      console.error("Failed to start new game:", error);

      if (error.message?.includes("No characters available")) {
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

  // ✅ Update to use currentGameSession from GameContext
  if (gameState === "playing" && currentGameSession) {
    return (
      <GameScreen
        gameSessionId={currentGameSession.gameSessionId} // ✅ Use the session ID
        allCharacters={allCharacters.map((char) => char.name)} // ✅ Convert Character[] to string[] if GameScreen needs names
        onRevealCharacter={handleRevealCharacter}
        onReturnHome={handleReturnHome}
      />
    );
  }

  if (gameState === "reveal" && currentGameSession) {
    return (
      <CharacterRevealScreen
        gameSessionId={currentGameSession.gameSessionId} // ✅ Use the session ID
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Home screen remains the same
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
              {/* Start Button */}
              <div className="mt-8 flex justify-center">
                <StartButton
                  onStart={handleStart}
                  disabled={isStartingGame || isLoadingCharacters} // ✅ Use isLoadingCharacters from context
                />
              </div>
            </div>

            {/* Loading indicators */}
            {isLoadingCharacters && (
              <div className="mt-4 text-center">
                <p className="text-white/70">Loading character database...</p>
              </div>
            )}

            {isStartingGame && (
              <div className="mt-4 text-center">
                <p className="text-white/70">Starting game...</p>
              </div>
            )}

            {!charactersLoaded && !isLoadingCharacters && (
              <div className="mt-4 text-center">
                <p className="text-red-300">Failed to load characters. Some features may not work.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
