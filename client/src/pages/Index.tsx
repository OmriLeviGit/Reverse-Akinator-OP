import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import ArcSelection from "../components/ArcSelection";
import FillerSettings from "../components/FillerSettings";
import DifficultySelection from "../components/DifficultySelection";
import StartButton from "../components/StartButton";
import { useGameContext } from "../contexts/GameContext";
import { useSelectedArc } from "@/hooks/useSelectedArc";

const Index = () => {
  const navigate = useNavigate();
  const { selectedArc, setSelectedArc } = useSelectedArc();
  const [fillerPercentage, setFillerPercentage] = useState(0);
  const [includeNonTVFillers, setIncludeNonTVFillers] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { allCharacters, isLoadingCharacters, startGame } = useGameContext();
  const charactersLoaded = !isLoadingCharacters && allCharacters.length > 0;

  const handleFillerPercentageChange = (value: number) => {
    setFillerPercentage(value);
    if (value === 0) {
      setIncludeNonTVFillers(false);
    }
  };

  const handleStart = async () => {
    if (!charactersLoaded) {
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

      navigate("/game"); // Navigate to game route
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
                  <DifficultySelection selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} />
                </div>

                <div className="border-t border-white/20 pt-6">
                  <ArcSelection />
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
                <StartButton onStart={handleStart} disabled={isStartingGame || isLoadingCharacters} />
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
