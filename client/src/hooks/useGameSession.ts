import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "../services/api";
import { GameSession, GameSettings } from "../types";

export const useGameSession = () => {
  const [currentGameSession, setCurrentGameSession] = useState<GameSession | null>(null);

  const questionMutation = useMutation({
    mutationFn: (questionText: string) => gameApi.askQuestion(currentGameSession!.gameSessionId, questionText),
  });

  const startGameMutation = useMutation({
    mutationFn: gameApi.startGame,
    onSuccess: (data) => {
      setCurrentGameSession({
        gameSessionId: data.gameSessionId,
        gameState: data.gameState,
      });
    },
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

  return {
    currentGameSession,
    currentCharacter: currentGameSession?.currentCharacter || null,
    startGame,
    askQuestion,
    revealCharacter,
    makeGuess,
  };
};
