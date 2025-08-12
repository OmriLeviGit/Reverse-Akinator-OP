// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import ArcSelection from "../components/ArcSelection";
import FillerSettings from "../components/FillerSettings";
import DifficultySelection from "../components/DifficultySelection";
import StartButton from "../components/StartButton";
import { useAppContext } from "../contexts/AppContext";

const Index = () => {
  const navigate = useNavigate();
  const [isStartingGame, setIsStartingGame] = useState(false);

  const {
    startGame,
    sessionData,
    availableArcs,
    characters,
    isLoading, // Only waits for initial data now
    charactersLoaded, // New flag for characters
    updatePreferences,
  } = useAppContext();

  console.log("Index page state:", {
    isLoading,
    sessionData: !!sessionData,
    availableArcsLength: availableArcs.length,
    charactersLength: characters.length,
    charactersLoaded, // Add this to debug
  });

  // Initialize local state from session data
  const [selectedArc, setSelectedArc] = useState("All");
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");

  // Update local state when session data loads
  useEffect(() => {
    if (sessionData?.user_preferences) {
      const prefs = sessionData.user_preferences;
      setSelectedDifficulty(prefs.difficulty);
      setSelectedArc(prefs.preferred_arc);
      setIncludeNonTVFillers(prefs.includeNonTVFillers);
      setFillerPercentage(prefs.fillerPercentage);
    }
  }, [sessionData]);

  // Show loading screen ONLY until essential data is loaded (faster!)
  if (isLoading || !sessionData || availableArcs.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 ocean-gradient"></div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading game data...</p>
              <p className="text-white/70 text-sm mt-2">
                {isLoading ? "Fetching from server..." : "Preparing game..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handlers that update both local state and preferences
  const handleArcChange = (arc: string) => {
    setSelectedArc(arc);
    updatePreferences({ preferred_arc: arc });
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    updatePreferences({ difficulty });
  };

  const handleFillerPercentageChange = (value: number) => {
    setFillerPercentage(value);
    updatePreferences({ fillerPercentage: value });

    if (value === 0) {
      setIncludeNonTVFillers(false);
      updatePreferences({ includeNonTVFillers: false });
    }
  };

  const handleIncludeNonTVFillersChange = (include: boolean) => {
    setIncludeNonTVFillers(include);
    updatePreferences({ includeNonTVFillers: include });
  };

  const handleStart = async () => {
    // Check if characters are loaded before starting
    if (!charactersLoaded) {
      console.log("⏳ Characters still loading, please wait...");
      // You could show a toast/alert here instead of just returning
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
      await startGame(gameSettings);

      navigate("/game");
    } catch (error: any) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStartingGame(false);
    }
  };

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
                  <DifficultySelection
                    selectedDifficulty={selectedDifficulty}
                    onDifficultyChange={handleDifficultyChange}
                  />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <ArcSelection
                    selectedArc={selectedArc}
                    setSelectedArc={handleArcChange}
                    availableArcs={availableArcs}
                  />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <FillerSettings
                    fillerPercentage={fillerPercentage}
                    onFillerPercentageChange={handleFillerPercentageChange}
                    includeNonTVFillers={includeNonTVFillers}
                    onIncludeNonTVFillersChange={handleIncludeNonTVFillersChange}
                  />
                </div>
              </div>

              {/* Start Button */}
              <div className="mt-8 flex justify-center">
                <StartButton
                  onStart={handleStart}
                  disabled={isStartingGame || isLoading || !charactersLoaded} // Updated condition
                />
              </div>

              {/* Character loading status */}
              {!charactersLoaded && (
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                    <p className="text-white/70 text-sm">Loading character data in background...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Starting Game Loading */}
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
