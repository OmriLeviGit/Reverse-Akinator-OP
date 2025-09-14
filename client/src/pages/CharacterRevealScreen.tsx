import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, ExternalLink, Home } from "lucide-react";
import { CharacterImage } from "../components/CharacterImage";
import CharacterDifficultyDropdown from "../components/CharacterDifficultyDropdown";
import { useGameSession } from "../hooks/useGameSession";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useCharacterRatings } from "@/hooks/useCharacterRatings";
import { FullCharacter } from "../types/character";
import { toast } from "sonner";
import CharacterIgnoreButton from "@/components/CharacterIgnoreButton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RevealData {
  character: FullCharacter;
  questionsAsked: number;
  guessesMade: number;
  wasCorrectGuess?: boolean;
}

const CharacterRevealScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startGame } = useGameSession();
  const { preferences } = useUserPreferences();
  const { getCharacterById, setCharacterRating, toggleIgnoreCharacter } = useCharacterRatings();

  const [isStartingNewGame, setIsStartingNewGame] = useState(false);

  // Get data directly from navigation state
  const revealData = location.state as RevealData | null;

  // Handle the case where data might be null
  if (!revealData?.character) {
    useEffect(() => {
      navigate("/");
    }, [navigate]);
    return null;
  }

  const { character: originalCharacter, questionsAsked, guessesMade, wasCorrectGuess } = revealData;

  // Merge original full character data with live ratings/ignore status
  const liveCharacterData = getCharacterById(originalCharacter.id);
  const [character, setCharacter] = useState<FullCharacter>(() => ({
    ...originalCharacter,
    ...(liveCharacterData && {
      difficulty: liveCharacterData.difficulty,
      isIgnored: liveCharacterData.isIgnored,
    }),
  }));

  // Update character when live data changes
  useEffect(() => {
    setCharacter({
      ...originalCharacter,
      ...(liveCharacterData && {
        difficulty: liveCharacterData.difficulty,
        isIgnored: liveCharacterData.isIgnored,
      }),
    });
  }, [originalCharacter, liveCharacterData]);

  const handleRatingChange = (characterId: string, difficulty: string | null) => {
    const difficultyValue = difficulty || "";
    setCharacterRating(characterId, difficultyValue);
  };

  const handleIgnoreToggle = (characterId: string) => {
    toggleIgnoreCharacter(characterId);
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

  console.log("character", character);

  return (
    <>
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Character Reveal</h1>
          <p className="text-muted-foreground text-lg">
            {wasCorrectGuess
              ? "Congratulations! You guessed correctly!"
              : "Here's the character you were trying to guess"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <Card className="border-border/40 shadow-lg overflow-hidden">
            <div className="lg:grid lg:grid-cols-[auto_1fr] lg:grid-rows-[min-content] flex flex-col">
              {/* Character Image */}
              <div className="bg-muted/30 p-6 overflow-hidden flex">
                <CharacterImage character={character} size="large" maxWidth={350} />
              </div>

              {/* Character Details */}
              <div className="p-6 flex flex-col">
                <div className="flex items-start justify-between">
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
                <div className="bg-muted/40 rounded-lg p-2 mb-4">
                  <p className="text-foreground leading-relaxed">
                    {character.description || "No description available for this character."}
                  </p>
                </div>

                {/* Character Fun Fact */}
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-foreground leading-relaxed">
                    {character.funFact ? (
                      <>
                        <div className="text-primary font-semibold">Fun fact:</div>
                        <div>{character.funFact}</div>
                      </>
                    ) : (
                      "No fun fact available for this character."
                    )}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Game Stats - Temporarily disabled*/}
                {/* <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{questionsAsked}</div>
                    <div className="text-sm text-muted-foreground">Questions Asked</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{guessesMade}</div>
                    <div className="text-sm text-muted-foreground">Guesses Made</div>
                  </div>
                </div>

                <Separator className="my-6" /> */}

                {/* Rating and Ignore Controls */}
                <div className="space-y-2 ">
                  <h3 className="text-lg font-semibold text-foreground">Rate this character</h3>

                  {/* Difficulty Rating Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
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
    </>
  );
};

export default CharacterRevealScreen;
