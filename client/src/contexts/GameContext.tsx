// src/contexts/GameContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterApi, gameApi } from "../services/api";
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
  toggleIgnoreCharacter: (characterId: string) => void;
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
    mutationFn: ({ characterId, difficulty }: { characterId: string; difficulty: number }) =>
      characterApi.rateCharacter(characterId, difficulty),
    onMutate: async ({ characterId, difficulty }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });

      // Snapshot the previous value
      const previousCharacters = queryClient.getQueryData(["allCharacters"]);

      // Optimistically update the cache
      queryClient.setQueryData(["allCharacters"], (old: any) => {
        if (!old || !old.characters) return old;

        return {
          ...old,
          characters: old.characters.map((char: Character) => (char.name === characterId ? { ...char, difficulty } : char)),
        };
      });

      // Return context for rollback
      return { previousCharacters };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCharacters) {
        queryClient.setQueryData(["allCharacters"], context.previousCharacters);
      }
    },
  });

  // Toggle ignore character mutation with optimistic updates
  const toggleIgnoreMutation = useMutation({
    mutationFn: characterApi.toggleIgnoreCharacter, // You'll need to add this to your API
    onMutate: async (characterId: string) => {
      await queryClient.cancelQueries({ queryKey: ["allCharacters"] });
      const previousCharacters = queryClient.getQueryData(["allCharacters"]);

      queryClient.setQueryData(["allCharacters"], (old: any) => {
        if (!old || !old.characters) return old;
        return {
          ...old,
          characters: old.characters.map((char: Character) => (char.name === characterId ? { ...char, isIgnored: !char.isIgnored } : char)),
        };
      });

      return { previousCharacters };
    },
    onError: (err, variables, context) => {
      if (context?.previousCharacters) {
        queryClient.setQueryData(["allCharacters"], context.previousCharacters);
      }
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
    const difficulties: Record<string, number> = {};
    allCharacters.forEach((character) => {
      difficulties[character.name] = character.difficulty;
    });
    return difficulties;
  }, [allCharacters]);

  // Add currentCharacter computed value
  const currentCharacter = React.useMemo(() => {
    if (!currentGameSession?.currentCharacter?.name) return null;

    // Find the updated character from allCharacters, fall back to session character
    return allCharacters.find((char) => char.name === currentGameSession.currentCharacter.name) || currentGameSession.currentCharacter;
  }, [currentGameSession?.currentCharacter?.name, allCharacters]);

  const startGame = async (settings: GameSettings) => {
    await startGameMutation.mutateAsync(settings);
  };

  const setCharacterRating = (characterId: string, difficulty: number) => {
    ratingMutation.mutate({ characterId, difficulty });
  };

  const toggleIgnoreCharacter = (characterId: string) => {
    toggleIgnoreMutation.mutate(characterId);
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
        toggleIgnoreCharacter,
        isUpdatingIgnoreList: toggleIgnoreMutation.isPending,
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
