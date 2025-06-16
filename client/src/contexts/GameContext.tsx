// src/contexts/GameContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi, userApi, gameApi } from "../services/api";
import { Character } from "../types/character";

interface GameSession {
  gameSessionId: string;
  gameState: string;
  currentCharacter?: Character;
}

interface GameContextType {
  // Game Session
  currentGameSession: GameSession | null;
  currentCharacter: Character | null;
  startGame: (settings: GameSettings) => Promise<void>;

  // Character Data
  allCharacters: Character[];
  isLoadingCharacters: boolean;
  characterError: Error | null;

  // Character Ratings
  characterRatings: Record<string, number>;
  setCharacterRating: (characterId: string, rating: number) => void;
  isUpdatingRating: boolean;

  // Ignored Characters
  ignoredCharacters: Set<string>;
  addToIgnoredCharacters: (characterId: string) => void;
  removeFromIgnoredCharacters: (characterId: string) => void;
  isUpdatingIgnoreList: boolean;

  // Game Actions
  askQuestion: (question: string) => Promise<any>;
  getHint: () => Promise<any>;
  revealCharacter: () => Promise<any>;
  makeGuess: (guess: string) => Promise<any>;
}

interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [currentGameSession, setCurrentGameSession] = React.useState<GameSession | null>(null);

  // Fetch all characters with status
  const {
    data: charactersData,
    isLoading: isLoadingCharacters,
    error: characterError,
  } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: characterApi.getCharacters,
  });

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: gameApi.startGame,
    onSuccess: (data) => {
      setCurrentGameSession({
        gameSessionId: data.gameSessionId,
        gameState: data.gameState,
      });
    },
  });

  // Character rating mutation
  const ratingMutation = useMutation({
    mutationFn: ({ characterId, rating }: { characterId: string; rating: number }) => userApi.rateCharacter(characterId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
    },
  });

  // Ignore character mutations
  const ignoreMutation = useMutation({
    mutationFn: userApi.ignoreCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
    },
  });

  const unignoreMutation = useMutation({
    mutationFn: userApi.unignoreCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
    },
  });

  // Game action mutations
  const questionMutation = useMutation({
    mutationFn: (questionText: string) => gameApi.askQuestion(currentGameSession!.gameSessionId, questionText),
  });

  const hintMutation = useMutation({
    mutationFn: () => gameApi.getHint(currentGameSession!.gameSessionId),
  });

  const revealMutation = useMutation({
    mutationFn: () => gameApi.revealCharacter(currentGameSession!.gameSessionId),
    onSuccess: (data) => {
      setCurrentGameSession((prev) =>
        prev
          ? {
              ...prev,
              currentCharacter: data.character,
              gameState: data.gameState,
            }
          : null
      );
    },
  });

  const guessMutation = useMutation({
    mutationFn: (guess: string) => gameApi.makeGuess(currentGameSession!.gameSessionId, guess),
  });

  // Helper functions to process API data
  const allCharacters: Character[] = charactersData?.characters || [];

const characterRatings = React.useMemo(() => {
  const ratings: Record<string, number> = {};
  allCharacters.forEach((character) => {
    // Set to difficulty if it exists, otherwise 0
    ratings[character.id] = character.difficulty;
  });
  return ratings;
}, [allCharacters]);

  const ignoredCharacters = React.useMemo(() => {
    // Extract ignored status from character data - update based on your API response structure
    const ignored = new Set<string>();
    allCharacters.forEach((character) => {
      if (character.isIgnored) {
        ignored.add(character.id);
      }
    });
    return ignored;
  }, [allCharacters]);

  // Add currentCharacter computed value
  const currentCharacter = currentGameSession?.currentCharacter || null;

  const startGame = async (settings: GameSettings) => {
    await startGameMutation.mutateAsync(settings);
  };

  const setCharacterRating = (characterId: string, rating: number) => {
    ratingMutation.mutate({ characterId, rating });
  };

  const addToIgnoredCharacters = (characterId: string) => {
    ignoreMutation.mutate(characterId);
  };

  const removeFromIgnoredCharacters = (characterId: string) => {
    unignoreMutation.mutate(characterId);
  };

  const askQuestion = async (question: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await questionMutation.mutateAsync(question);
  };

  const getHint = async () => {
    if (!currentGameSession) throw new Error("No active game session");
    return await hintMutation.mutateAsync();
  };

  const revealCharacter = async () => {
    if (!currentGameSession) throw new Error("No active game session");
    return await revealMutation.mutateAsync();
  };

  const makeGuess = async (guess: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await guessMutation.mutateAsync(guess);
  };

  return (
    <GameContext.Provider
      value={{
        currentGameSession,
        currentCharacter,
        startGame,
        allCharacters,
        isLoadingCharacters,
        characterError: characterError as Error | null,
        characterRatings,
        setCharacterRating,
        isUpdatingRating: ratingMutation.isPending,
        ignoredCharacters,
        addToIgnoredCharacters,
        removeFromIgnoredCharacters,
        isUpdatingIgnoreList: ignoreMutation.isPending || unignoreMutation.isPending,
        askQuestion,
        getHint,
        revealCharacter,
        makeGuess,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
