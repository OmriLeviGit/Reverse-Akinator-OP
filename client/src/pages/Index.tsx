import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameSetupForm from "../components/GameSetupForm";
import { useAppContext } from "../contexts/AppContext";
import { useGameSession } from "../hooks/useGameSession";
import { UserPreferences } from "../types/userPreferences";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { sessionData, availableArcs, isLoading, charactersLoaded, globalArcLimit } = useAppContext();

  const { startGame } = useGameSession();

  // Show loading screen ONLY until essential data is loaded
  if (isLoading || !sessionData || availableArcs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground text-xl">Loading game data...</p>
            <p className="text-muted-foreground text-sm mt-2">
              {isLoading ? "Fetching from server..." : "Preparing game..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStart = async (preferences: UserPreferences) => {
    if (!charactersLoaded) {
      console.log("⏳ Characters still loading, please wait...");
      toast.warning("Please wait for characters to finish loading...");
      return;
    }

    setIsStartingGame(true);

    try {
      const gameSettings = {
        arcSelection: preferences.preferredArc,
        fillerPercentage: preferences.fillerPercentage,
        includeNonTVFillers: preferences.includeNonTVFillers,
        difficultyLevel: preferences.difficulty,
        includeUnrated: preferences.includeUnrated,
      };

      console.log("🎮 Starting game with settings:", gameSettings);

      const gameSession = await startGame(gameSettings);
      console.log("✅ Game started successfully:", gameSession);

      navigate("/game");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Something went wrong. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsStartingGame(false);
    }
  };

  return (
    <>
      {/* Title Section */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Character Guessing Game</h1>
          <p className="text-muted-foreground text-lg">Configure your game settings and test your knowledge</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <div className="flex justify-center">
          <GameSetupForm
            globalArcLimit={globalArcLimit}
            availableArcs={availableArcs}
            onStart={handleStart}
            isStartingGame={isStartingGame}
            charactersLoaded={charactersLoaded}
            isLoading={isLoading}
          />
        </div>
      </main>
    </>
  );
};

export default Index;
