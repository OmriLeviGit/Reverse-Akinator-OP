// src/hooks/useGameSession.ts
import { gameApi } from "../services/api";
import { useAppContext } from "../contexts/AppContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useGameSession = () => {
  const { currentGameSession, setCurrentGameSession } = useAppContext();
  const navigate = useNavigate();

  const validateGameSession = async () => {
    if (!currentGameSession?.gameId) {
      return false;
    }

    try {
      const response = await gameApi.checkGameStatus(currentGameSession.gameId);
      return response.isValidGame;
    } catch (error) {
      console.error("Failed to validate game session:", error);
      return false;
    }
  };

  const handleStaleSession = () => {
    toast.error("Game session expired. Please start a new game.");
    setCurrentGameSession(null);
    navigate("/");
  };

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
    if (!currentGameSession?.gameId) {
      handleStaleSession();
      return "";
    }

    try {
      const response = await gameApi.askQuestion(currentGameSession.gameId, question);
      return response.answer;
    } catch (error: any) {
      console.error("Failed to ask question:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Invalid or expired")) {
        handleStaleSession();
        return "";
      }
      throw error;
    }
  };

  const makeGuess = async (characterName: string) => {
    if (!currentGameSession?.gameId) {
      handleStaleSession();
      return { isCorrect: false };
    }

    try {
      const response = await gameApi.makeGuess(currentGameSession.gameId, characterName);
      return response;
    } catch (error: any) {
      console.error("Failed to make guess:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Invalid or expired")) {
        handleStaleSession();
        return { isCorrect: false };
      }
      throw error;
    }
  };

  const revealCharacter = async () => {
    if (!currentGameSession?.gameId) {
      handleStaleSession();
      return null;
    }

    try {
      const response = await gameApi.revealCharacter(currentGameSession.gameId);
      setCurrentGameSession(null); // Clear session after reveal
      return response;
    } catch (error: any) {
      console.error("Failed to reveal character:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Invalid or expired")) {
        handleStaleSession();
        return null;
      }
      throw error;
    }
  };

  return {
    currentGameSession,
    startGame,
    askQuestion,
    makeGuess,
    revealCharacter,
    validateGameSession,
  };
};
