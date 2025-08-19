import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import GameSetupForm from "../components/GameSetupForm";
import { useAppContext } from "../contexts/AppContext";
import { useGameSession } from "../hooks/useGameSession";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { sessionData, availableArcs, isLoading, charactersLoaded, updateGlobalArcLimit, globalArcLimit } =
    useAppContext();

  const { startGame } = useGameSession();
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
    const currentPreferredArc = preferences.preferredArc || globalArcLimit;
    const safeArc = getEarlierArc(currentPreferredArc, globalArcLimit);

    console.log("🔍 Arc spoiler check:", {
      currentPreferredArc,
      globalArcLimit,
      safeArc,
    });

    // Only update if the safe arc is different from current preference
    if (safeArc !== preferences.preferredArc) {
      console.log("📝 Updating preferredArc due to spoiler protection:", safeArc);
      updatePreferences({ preferredArc: safeArc });
    }
  }, [globalArcLimit, availableArcs, preferences.preferredArc, updatePreferences]);

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

  const handleMaxArcChange = (arcName: string) => {
    updateGlobalArcLimit(arcName);
  };

  // Game setup handlers that update localStorage preferences
  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    updatePreferences({ difficulty });
  };

  const handleIncludeUnratedChange = (includeUnrated: boolean) => {
    updatePreferences({ includeUnrated });
  };

  const handleArcChange = (arc: string) => {
    updatePreferences({ preferredArc: arc });
  };

  const handleFillerPercentageChange = (value: number) => {
    if (value === 0) {
      updatePreferences({
        fillerPercentage: value,
        includeNonTVFillers: false,
      });
    } else {
      updatePreferences({ fillerPercentage: value });
    }
  };

  const handleIncludeNonTVFillersChange = (include: boolean) => {
    updatePreferences({ includeNonTVFillers: include });
  };

  const handleStart = async () => {
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

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
            selectedDifficulty={preferences.difficulty}
            onDifficultyChange={handleDifficultyChange}
            includeUnrated={preferences.includeUnrated}
            onIncludeUnratedChange={handleIncludeUnratedChange}
            selectedArc={preferences.preferredArc}
            onArcChange={handleArcChange}
            fillerPercentage={preferences.fillerPercentage}
            onFillerPercentageChange={handleFillerPercentageChange}
            includeNonTVFillers={preferences.includeNonTVFillers}
            onIncludeNonTVFillersChange={handleIncludeNonTVFillersChange}
            onStart={handleStart}
            isStartingGame={isStartingGame}
            charactersLoaded={charactersLoaded}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Index;
