import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import GameSetupForm from "../components/GameSetupForm";
import SpoilerProtectionModal from "../components/SpoilerProtectionModal";
import { useAppContext } from "../contexts/AppContext";

const Index = () => {
  const navigate = useNavigate();
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Spoiler protection state - now using arc names
  const [maxArcSeen, setMaxArcSeen] = useState<string>("All");
  const [showSpoilerModal, setShowSpoilerModal] = useState<boolean>(false);

  const {
    startGame,
    sessionData,
    availableArcs,
    characters,
    isLoading,
    charactersLoaded,
    updatePreferences,
    updateGlobalArcLimit,
  } = useAppContext();

  // Initialize local state from session data
  const [selectedArc, setSelectedArc] = useState("");
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [includeUnrated, setIncludeUnrated] = useState(false);

  // Spoiler protection setup - check on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore");
    if (!hasVisited) {
      setShowSpoilerModal(true);
    } else {
      // Load saved max arc setting
      const savedMaxArc = localStorage.getItem("maxArcSeen");
      if (savedMaxArc) {
        setMaxArcSeen(savedMaxArc);
      }
    }
  }, []);

  // Initialize maxArcSeen from sessionData if available
  useEffect(() => {
    if (sessionData?.global_arc_limit) {
      setMaxArcSeen(sessionData.global_arc_limit);
      localStorage.setItem("maxArcSeen", sessionData.global_arc_limit);
    }
  }, [sessionData]);

  // Update local state when session data loads
  useEffect(() => {
    if (sessionData?.user_preferences) {
      const prefs = sessionData.user_preferences;
      setSelectedDifficulty((prefs.difficulty as "easy" | "medium" | "hard") || "easy");
      setSelectedArc(prefs.preferred_arc);
      setIncludeNonTVFillers(prefs.includeNonTVFillers);
      setFillerPercentage(prefs.fillerPercentage);
      setIncludeUnrated(prefs.includeUnrated || false);
    }
  }, [sessionData]);

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

  // Spoiler protection handlers
  const handleSpoilerModalClose = (arcName: string) => {
    setMaxArcSeen(arcName);
    setShowSpoilerModal(false);
    localStorage.setItem("hasVisitedBefore", "true");
    localStorage.setItem("maxArcSeen", arcName);

    // Update the backend global arc limit
    updateGlobalArcLimit(arcName);
  };

  const handleMaxArcChange = (arcName: string) => {
    setMaxArcSeen(arcName);
    localStorage.setItem("maxArcSeen", arcName);

    // Update the backend global arc limit
    updateGlobalArcLimit(arcName);
  };

  // Game setup handlers that update both local state and preferences
  const handleDifficultyChange = (difficulty: "easy" | "medium" | "hard") => {
    setSelectedDifficulty(difficulty);
    updatePreferences({ difficulty });
  };

  const handleIncludeUnratedChange = (includeUnrated: boolean) => {
    setIncludeUnrated(includeUnrated);
    updatePreferences({ includeUnrated });
  };

  const handleArcChange = (arc: string) => {
    setSelectedArc(arc);
    updatePreferences({ preferred_arc: arc });
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
    if (!charactersLoaded) {
      console.log("⏳ Characters still loading, please wait...");
      return;
    }

    setIsStartingGame(true);

    try {
      const gameSettings = {
        arcSelection: selectedArc,
        fillerPercentage,
        includeNonTVFillers,
        difficultyLevel: selectedDifficulty,
        includeUnrated,
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation maxArcSeen={maxArcSeen} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

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
            maxArcSeen={maxArcSeen}
            availableArcs={availableArcs}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            includeUnrated={includeUnrated}
            onIncludeUnratedChange={handleIncludeUnratedChange}
            selectedArc={selectedArc}
            onArcChange={handleArcChange}
            fillerPercentage={fillerPercentage}
            onFillerPercentageChange={handleFillerPercentageChange}
            includeNonTVFillers={includeNonTVFillers}
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

      {/* Spoiler Protection Modal */}
      <SpoilerProtectionModal
        isOpen={showSpoilerModal}
        onClose={handleSpoilerModalClose}
        availableArcs={availableArcs}
      />
    </div>
  );
};

export default Index;
