import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavigationHeader from "../components/NavigationHeader";
import { useGameContext } from "../contexts/GameContext";
import { DifficultyRating } from "@/components/DifficultyRating";

const CharacterRevealScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentCharacter, characterRatings, setCharacterRating, toggleIgnoreCharacter, startGame, currentGameSession } = useGameContext();
  const [showConfirmation, setShowConfirmation] = useState<"added" | "removed" | null>(null);

  // Redirect to home if no current character or game session
  useEffect(() => {
    if (!currentCharacter || !currentGameSession) {
      navigate("/");
    }
  }, [currentCharacter, currentGameSession, navigate]);

  // Don't render anything if no character data
  if (!currentCharacter) {
    return null;
  }

  const currentRating = characterRatings[currentCharacter.name];

  const handleRating = (rating: number) => {
    setCharacterRating(currentCharacter.name, rating);
  };

  const handleIgnoreCharacter = () => {
    const wasIgnored = currentCharacter.isIgnored;

    toggleIgnoreCharacter(currentCharacter.name);

    // Show appropriate message and confirmation based on previous state
    if (wasIgnored) {
      setShowConfirmation("removed");
    } else {
      setShowConfirmation("added");
    }

    // Hide confirmation after 3 seconds
    setTimeout(() => setShowConfirmation(null), 3000);
  };

  const handlePlayAgain = async () => {
    try {
      const gameSettings = {
        arcSelection: "all",
        fillerPercentage: 0,
        includeNonTVFillers: false,
        difficultyLevel: "easy",
      };

      await startGame(gameSettings);
      navigate("/game");
    } catch (error: any) {
      console.error("Failed to start new game:", error);
      navigate("/");
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
            {/* Character Reveal Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 ship-shadow border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Character Revealed!</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
              </div>

              {/* Character Image */}
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/30 ship-shadow">
                  <img src={currentCharacter.image} alt={currentCharacter.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Character Name */}
              <h3 className="text-2xl font-bold text-center pirate-text mb-4">{currentCharacter.name}</h3>

              {/* Character Description */}
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <p className="text-white leading-relaxed text-center">{currentCharacter.description}</p>
              </div>

              {/* Character Information */}
              <div className="text-left mb-6 space-y-1">
                <a
                  href={currentCharacter.wikiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline transition-colors text-sm block"
                >
                  View on wiki
                </a>
              </div>

              {/* Difficulty Rating System */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-white text-center mb-4">How difficult was this character to guess?</h4>
                <DifficultyRating currentRating={currentRating} onRatingChange={handleRating} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Button
                  onClick={handlePlayAgain}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Play Again
                </Button>
                <Button
                  onClick={handleIgnoreCharacter}
                  className={`font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    currentCharacter.isIgnored
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                  }`}
                >
                  {currentCharacter.isIgnored ? "Remove from Ignore List" : "Add to Ignore List"}
                </Button>
              </div>

              {/* Confirmation Messages */}
              {showConfirmation && (
                <div className="text-center">
                  {showConfirmation === "added" && <p className="text-green-300 text-sm">Character added to ignore list!</p>}
                  {showConfirmation === "removed" && <p className="text-red-300 text-sm">Character removed from ignore list!</p>}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-white/70 text-sm">Thanks for playing the One Piece Character Guessing Game!</p>
        </footer>
      </div>
    </div>
  );
};

export default CharacterRevealScreen;
