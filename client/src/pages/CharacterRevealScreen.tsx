import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, EyeOff, Eye, ExternalLink, Home } from "lucide-react";
import Navigation from "../components/Navigation";
import { CharacterImage } from "../components/CharacterImage";
import CharacterDifficultyDropdown from "../components/CharacterDifficultyDropdown";
import { useAppContext } from "../contexts/AppContext";
import { useGameSession } from "../hooks/useGameSession";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useCharacterRatings } from "@/hooks/useCharacterRatings";
import { Character } from "../types/character";
import { toast } from "sonner";
import CharacterIgnoreButton from "@/components/CharacterIgnoreButton";

interface RevealData {
  character: Character;
  questionsAsked: number;
  guessesMade: number;
}

const CharacterRevealScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { availableArcs, updateGlobalArcLimit, globalArcLimit } = useAppContext();
  const { startGame } = useGameSession();
  const { preferences } = useUserPreferences();
  const { setCharacterRating, toggleIgnoreCharacter } = useCharacterRatings();

  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStats, setGameStats] = useState<{ questionsAsked: number; guessesMade: number } | null>(null);

  // Get data from navigation state
  useEffect(() => {
    const revealData = location.state as RevealData | null;

    if (revealData?.character) {
      setCharacter(revealData.character);
      setGameStats({
        questionsAsked: revealData.questionsAsked,
        guessesMade: revealData.guessesMade,
      });
    } else {
      // No data passed, redirect to home
      navigate("/");
    }
  }, [location.state, navigate]);

  const handleMaxArcChange = (arcName: string) => {
    updateGlobalArcLimit(arcName);
  };

  const handleRatingChange = (characterId: string, difficulty: string | null) => {
    if (!character) return;

    const difficultyValue = difficulty || "";
    setCharacterRating(characterId, difficultyValue);

    // Update local state to reflect the change
    setCharacter((prev) => (prev ? { ...prev, difficulty: difficultyValue } : null));
  };

  const handleIgnoreToggle = (characterId: string) => {
    if (!character) return;

    toggleIgnoreCharacter(characterId);

    // Update local state to reflect the change
    const newIgnoreState = !character.isIgnored;
    setCharacter((prev) => (prev ? { ...prev, isIgnored: newIgnoreState } : null));

    const message = newIgnoreState ? "Character added to ignore list" : "Character removed from ignore list";
    console.log(message);
  };

  const handlePlayAgain = async () => {
    setIsStartingNewGame(true);

    try {
      const gameSettings = {
        arcSelection: preferences.preferredArc,
        fillerPercentage: preferences.fillerPercentage,
        includeNonTVFillers: preferences.includeNonTVFillers,
        difficultyLevel: preferences.difficulty,
        includeUnrated: preferences.includeUnrated,
      };

      await startGame(gameSettings);
      navigate("/game");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Failed to start new game";
      toast.error(errorMessage);
      navigate("/");
    } finally {
      setIsStartingNewGame(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // Don't render anything if no character data
  if (!character || !gameStats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation globalArcLimit={globalArcLimit} onMaxArcChange={handleMaxArcChange} availableArcs={availableArcs} />

      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Character Reveal</h1>
          <p className="text-muted-foreground text-lg">Here's the character you were trying to guess</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/40 shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0">
              {/* Character Image */}
              <div className="relative overflow-hidden bg-muted/30 flex items-center justify-center p-8">
                <CharacterImage character={character} size="large" />
              </div>

              {/* Character Details */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-2">{character.name}</h2>
                    {character.wikiLink && (
                      <a
                        href={character.wikiLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on wiki
                      </a>
                    )}
                  </div>
                </div>

                {/* Character Description */}
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <p className="text-foreground leading-relaxed">
                    {character.description || "No description available for this character."}
                  </p>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{gameStats.questionsAsked}</div>
                    <div className="text-sm text-muted-foreground">Questions Asked</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{gameStats.guessesMade}</div>
                    <div className="text-sm text-muted-foreground">Guesses Made</div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Rating and Ignore Controls */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Rate this character</h3>

                  {/* Difficulty Rating Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      How difficult was this character to guess?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <CharacterDifficultyDropdown character={character} onRatingChange={handleRatingChange} />
                      <CharacterIgnoreButton character={character} onIgnoreToggle={handleIgnoreToggle} />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handlePlayAgain}
                    disabled={isStartingNewGame}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {isStartingNewGame ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play Again
                      </>
                    )}
                  </Button>
                  <Button onClick={handleBackToHome} variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>
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

export default CharacterRevealScreen;
