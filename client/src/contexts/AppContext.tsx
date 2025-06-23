// src/contexts/GameContext.tsx
import React, { createContext, useContext, ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "../services/api";
import { Character } from "../types/character";

interface GameSession {
  gameSessionId: string;
  gameState: string;
  currentCharacter?: Character;
}

interface AppContextType {
  // Game Session State
  currentGameSession: GameSession | null;
  currentCharacter: Character | null;

  // Game Actions
  startGame: (settings: GameSettings) => Promise<void>;
  askQuestion: (question: string) => Promise<any>;
  revealCharacter: () => Promise<any>;
  makeGuess: (guess: string) => Promise<any>;
}

interface GameSettings {
  arcSelection: string;
  fillerPercentage: number;
  includeNonTVFillers: boolean;
  difficultyLevel: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(null);

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

  // Game action mutations
  const questionMutation = useMutation({
    mutationFn: (questionText: string) => gameApi.askQuestion(currentGameSession!.gameSessionId, questionText),
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

  // Game action functions
  const startGame = async (settings: GameSettings) => {
    await startGameMutation.mutateAsync(settings);
  };

  const askQuestion = async (question: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await questionMutation.mutateAsync(question);
  };

  const revealCharacter = async () => {
    if (!currentGameSession) throw new Error("No active game session");
    return await revealMutation.mutateAsync();
  };

  const makeGuess = async (guess: string) => {
    if (!currentGameSession) throw new Error("No active game session");
    return await guessMutation.mutateAsync(guess);
  };

  const currentCharacter = currentGameSession?.currentCharacter || null;

  return (
    <AppContext.Provider
      value={{
        currentGameSession,
        currentCharacter,
        startGame,
        askQuestion,
        revealCharacter,
        makeGuess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
