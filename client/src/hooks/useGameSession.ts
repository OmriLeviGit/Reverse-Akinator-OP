// src/hooks/useGameSession.ts
import { gameApi } from "../services/api";
import { useAppContext } from "../contexts/AppContext";

export const useGameSession = () => {
  const { currentGameSession, setCurrentGameSession } = useAppContext();

  const startGame = async (settings: any) => {
    try {
      const response = await gameApi.startGame(settings);
      const gameSession = {
        isActive: true,
        gameId: response.gameId,
        characterPool: response.characterPool,
      };
      setCurrentGameSession(gameSession);
      return gameSession;
    } catch (error) {
      console.error("Failed to start game:", error);
      throw error;
    }
  };

  const askQuestion = async (question: string) => {
    try {
      const response = await gameApi.askQuestion(question);
      return response.answer;
    } catch (error) {
      console.error("Failed to ask question:", error);
      throw error;
    }
  };

  const makeGuess = async (characterName: string) => {
    try {
      const response = await gameApi.makeGuess(characterName);
      return response;
    } catch (error) {
      console.error("Failed to make guess:", error);
      throw error;
    }
  };

  const revealCharacter = async () => {
    try {
      const response = await gameApi.revealCharacter();
      setCurrentGameSession(null); // This will also clear localStorage
      return response;
    } catch (error) {
      console.error("Failed to reveal character:", error);
      throw error;
    }
  };

  return {
    currentGameSession,
    startGame,
    askQuestion,
    makeGuess,
    revealCharacter,
  };
};
